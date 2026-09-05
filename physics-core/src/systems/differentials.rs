use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::model::DifferentialConfig;

const EPSILON: Real = 1.0e-6;
const PHASE_BAUMGARTE: Real = 0.35;
const MAX_PHASE_SPIN_SPEED: Real = 1.5;

#[derive(Clone)]
pub struct DifferentialSatelliteRuntime {
    pub body: RigidBodyHandle,
    pub side_body: RigidBodyHandle,
    pub local_axis: Vector,
    pub local_side_axis: Vector,
    pub local_center: Vector,
    pub local_side_center: Vector,
    pub local_reference: Vector,
    pub local_side_reference: Vector,
    pub coefficient: Real,
    pub side_coefficient: Real,
    pub phase_lock: bool,
    angle: Real,
    side_angle: Real,
    phase_target: Real,
}

#[derive(Clone)]
pub struct DifferentialRuntime {
    pub left: RigidBodyHandle,
    pub right: RigidBodyHandle,
    pub carrier: RigidBodyHandle,
    pub local_axis_left: Vector,
    pub local_axis_right: Vector,
    pub local_axis_carrier: Vector,
    pub satellites: Vec<DifferentialSatelliteRuntime>,
}

fn vector(value: [f32; 3]) -> Vector {
    Vector::new(value[0], value[1], value[2])
}

pub fn build(
    configs: &[DifferentialConfig],
    bodies: &HashMap<u32, RigidBodyHandle>,
    world: &PhysicsWorld,
) -> Vec<DifferentialRuntime> {
    configs.iter().filter_map(|config| {
        let left = *bodies.get(&config.left_body)?;
        let right = *bodies.get(&config.right_body)?;
        let carrier = *bodies.get(&config.carrier_body)?;
        if left == right || left == carrier || right == carrier { return None; }
        let mut axis = vector(config.axis);
        if axis.length_squared() <= EPSILON { return None; }
        axis = axis.normalize();
        let left_body = world.bodies.get(left)?;
        let right_body = world.bodies.get(right)?;
        let carrier_body = world.bodies.get(carrier)?;
        let satellites = config.satellites.iter().filter_map(|satellite| {
            let body = *bodies.get(&satellite.body)?;
            let side_body = *bodies.get(&satellite.side_body)?;
            if body == side_body || body == carrier || satellite.coefficient.abs() <= EPSILON {
                return None;
            }
            let satellite_body = world.bodies.get(body)?;
            let side = world.bodies.get(side_body)?;
            let mut runtime = DifferentialSatelliteRuntime {
                body,
                side_body,
                local_axis: satellite_body.position().inverse_transform_vector(vector(satellite.axis).normalize()),
                local_side_axis: side.position().inverse_transform_vector(vector(satellite.side_axis).normalize()),
                local_center: satellite_body.position().inverse_transform_point(vector(satellite.center)),
                local_side_center: side.position().inverse_transform_point(vector(satellite.side_center)),
                local_reference: satellite_body.position().inverse_transform_vector(vector(satellite.reference).normalize()),
                local_side_reference: side.position().inverse_transform_vector(vector(satellite.side_reference).normalize()),
                coefficient: satellite.coefficient,
                side_coefficient: satellite.side_coefficient,
                phase_lock: satellite.phase_lock,
                angle: 0.0,
                side_angle: 0.0,
                phase_target: 0.0,
            };
            if let Some((angle, side_angle)) = satellite_angles(&runtime, world) {
                runtime.angle = angle;
                runtime.side_angle = side_angle;
                let raw = runtime.coefficient * angle + runtime.side_coefficient * side_angle;
                runtime.phase_target = std::f32::consts::PI + std::f32::consts::TAU
                    * ((raw - std::f32::consts::PI) / std::f32::consts::TAU).round();
            }
            Some(runtime)
        }).collect();
        Some(DifferentialRuntime {
            left,
            right,
            carrier,
            local_axis_left: left_body.position().inverse_transform_vector(axis),
            local_axis_right: right_body.position().inverse_transform_vector(axis),
            local_axis_carrier: carrier_body.position().inverse_transform_vector(axis),
            satellites,
        })
    }).collect()
}

/// Enforces ω_left + ω_right = 2ω_carrier using one conservative angular
/// impulse. This naturally routes motion through whichever member is free.
pub fn project_velocities(
    differentials: &[DifferentialRuntime],
    dt: Real,
    world: &mut PhysicsWorld,
) {
    for differential in differentials {
        let (axis_l, axis_r, axis_c, wl, wr, wc, il, ir, ic, fixed_l, fixed_r, fixed_c) = {
            let Some(left) = world.bodies.get(differential.left) else { continue; };
            let Some(right) = world.bodies.get(differential.right) else { continue; };
            let Some(carrier) = world.bodies.get(differential.carrier) else { continue; };
            let axis_l = (left.position().rotation * differential.local_axis_left).normalize();
            let axis_r = (right.position().rotation * differential.local_axis_right).normalize();
            let axis_c = (carrier.position().rotation * differential.local_axis_carrier).normalize();
            (
                axis_l, axis_r, axis_c,
                left.angvel().dot(axis_l),
                right.angvel().dot(axis_r),
                carrier.angvel().dot(axis_c),
                axis_l.dot(left.mass_properties().effective_world_inv_inertia * axis_l),
                axis_r.dot(right.mass_properties().effective_world_inv_inertia * axis_r),
                axis_c.dot(carrier.mass_properties().effective_world_inv_inertia * axis_c),
                left.is_fixed(), right.is_fixed(), carrier.is_fixed(),
            )
        };
        let error = wl + wr - 2.0 * wc;
        let denominator = il + ir + 4.0 * ic;
        if error.abs() <= EPSILON || denominator <= EPSILON { continue; }
        let impulse = -error / denominator;
        if !fixed_l { world.bodies[differential.left].apply_torque_impulse(axis_l * impulse, true); }
        if !fixed_r { world.bodies[differential.right].apply_torque_impulse(axis_r * impulse, true); }
        if !fixed_c { world.bodies[differential.carrier].apply_torque_impulse(axis_c * (-2.0 * impulse), true); }
    }
    for differential in differentials {
        project_satellites(differential, dt, world);
    }
}

fn project_satellites(
    differential: &DifferentialRuntime,
    dt: Real,
    world: &mut PhysicsWorld,
) {
    for satellite in &differential.satellites {
        let (axis, side_axis, carrier_jacobian, error, denominator, phase_error) = {
            let Some(body) = world.bodies.get(satellite.body) else { continue; };
            let Some(side) = world.bodies.get(satellite.side_body) else { continue; };
            let Some(carrier) = world.bodies.get(differential.carrier) else { continue; };
            let pose = *body.position();
            let side_pose = *side.position();
            let axis = (pose.rotation * satellite.local_axis).normalize();
            let side_axis = (side_pose.rotation * satellite.local_side_axis).normalize();
            let phase_error = if satellite.phase_lock && dt > EPSILON {
                satellite_angles(satellite, world).map_or(0.0, |(angle, side_angle)| {
                    satellite.coefficient * (satellite.angle + super::gears::wrapped_delta(angle, satellite.angle))
                        + satellite.side_coefficient * (satellite.side_angle + super::gears::wrapped_delta(side_angle, satellite.side_angle))
                        - satellite.phase_target
                })
            } else { 0.0 };
            let carrier_jacobian = -axis * satellite.coefficient
                - side_axis * satellite.side_coefficient;
            let satellite_jacobian = axis * satellite.coefficient;
            let side_jacobian = side_axis * satellite.side_coefficient;
            (
                axis,
                side_axis,
                carrier_jacobian,
                satellite_jacobian.dot(body.angvel())
                    + side_jacobian.dot(side.angvel())
                    + carrier_jacobian.dot(carrier.angvel()),
                satellite_jacobian.dot(body.mass_properties().effective_world_inv_inertia * satellite_jacobian)
                    + side_jacobian.dot(side.mass_properties().effective_world_inv_inertia * side_jacobian)
                    + carrier_jacobian.dot(carrier.mass_properties().effective_world_inv_inertia * carrier_jacobian),
                phase_error,
            )
        };
        if denominator <= EPSILON { continue; }
        let phase_rate = if dt > EPSILON {
            (phase_error * PHASE_BAUMGARTE / dt).clamp(
                -MAX_PHASE_SPIN_SPEED * satellite.coefficient.abs(),
                MAX_PHASE_SPIN_SPEED * satellite.coefficient.abs(),
            )
        } else { 0.0 };
        // The satellite is a physical member: its inertia and any obstruction
        // must react on both the side gear and carrier.
        let impulse = (phase_rate - error) / denominator;
        world.bodies[satellite.body].apply_torque_impulse(
            axis * (satellite.coefficient * impulse), true,
        );
        world.bodies[satellite.side_body].apply_torque_impulse(
            side_axis * (satellite.side_coefficient * impulse), true,
        );
        world.bodies[differential.carrier].apply_torque_impulse(carrier_jacobian * impulse, true);
    }
}

fn satellite_angles(satellite: &DifferentialSatelliteRuntime, world: &PhysicsWorld) -> Option<(Real, Real)> {
    let pose = world.bodies.get(satellite.body)?.position();
    let side_pose = world.bodies.get(satellite.side_body)?.position();
    let axis = pose.rotation * satellite.local_axis;
    let side_axis = side_pose.rotation * satellite.local_side_axis;
    let delta = side_pose.transform_point(satellite.local_side_center)
        - pose.transform_point(satellite.local_center);
    let radial = delta - axis * delta.dot(axis);
    let side_radial = -delta - side_axis * (-delta).dot(side_axis);
    let reference = pose.rotation * satellite.local_reference;
    let side_reference = side_pose.rotation * satellite.local_side_reference;
    let reference = reference - axis * reference.dot(axis);
    let side_reference = side_reference - side_axis * side_reference.dot(side_axis);
    if [radial, side_radial, reference, side_reference].iter()
        .any(|v| v.length_squared() <= EPSILON) { return None; }
    Some((signed_angle(reference.normalize(), radial.normalize(), axis),
        signed_angle(side_reference.normalize(), side_radial.normalize(), side_axis)))
}

pub fn accumulate_angles(differentials: &mut [DifferentialRuntime], world: &PhysicsWorld) {
    for differential in differentials {
        for satellite in &mut differential.satellites {
            if let Some((angle, side_angle)) = satellite_angles(satellite, world) {
                satellite.angle += super::gears::wrapped_delta(angle, satellite.angle);
                satellite.side_angle += super::gears::wrapped_delta(side_angle, satellite.side_angle);
            }
        }
    }
}

fn signed_angle(from: Vector, to: Vector, axis: Vector) -> Real {
    axis.dot(from.cross(to)).atan2(from.dot(to))
}
