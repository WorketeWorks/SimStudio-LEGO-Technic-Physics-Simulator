use std::collections::{HashMap, HashSet};

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
            Some(DifferentialSatelliteRuntime {
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
            })
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
    driven_bodies: &HashSet<RigidBodyHandle>,
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
        let driven_l = driven_bodies.contains(&differential.left);
        let driven_r = driven_bodies.contains(&differential.right);
        let driven_c = driven_bodies.contains(&differential.carrier);

        // While the user or a command actively drives one differential member,
        // preserve that input and route the necessary motion through the free
        // members. An inertia-weighted impulse made the carrier feel extremely
        // heavy and consumed most of the drag torque before visible motion.
        if driven_l && !driven_r && !driven_c {
            if fixed_r && fixed_c {
                set_axis_speed(world, differential.left, axis_l, 0.0);
            } else if fixed_r {
                set_axis_speed(world, differential.carrier, axis_c, wl * 0.5);
            } else if fixed_c {
                set_axis_speed(world, differential.right, axis_r, -wl);
            } else {
                // Preserve the undriven side's current speed (including zero
                // when blocked) and send the remainder to the carrier.
                set_axis_speed(world, differential.carrier, axis_c, (wl + wr) * 0.5);
            }
            continue;
        }
        if driven_r && !driven_l && !driven_c {
            if fixed_l && fixed_c {
                set_axis_speed(world, differential.right, axis_r, 0.0);
            } else if fixed_l {
                set_axis_speed(world, differential.carrier, axis_c, wr * 0.5);
            } else if fixed_c {
                set_axis_speed(world, differential.left, axis_l, -wr);
            } else {
                set_axis_speed(world, differential.carrier, axis_c, (wl + wr) * 0.5);
            }
            continue;
        }
        if driven_c && !driven_l && !driven_r {
            if fixed_l && fixed_r {
                set_axis_speed(world, differential.carrier, axis_c, 0.0);
            } else if fixed_l {
                set_axis_speed(world, differential.right, axis_r, 2.0 * wc);
            } else if fixed_r {
                set_axis_speed(world, differential.left, axis_l, 2.0 * wc);
            } else {
                // Keep the existing left/right speed difference and correct
                // their mean to the carrier speed.
                let correction = wc - (wl + wr) * 0.5;
                set_axis_speed(world, differential.left, axis_l, wl + correction);
                set_axis_speed(world, differential.right, axis_r, wr + correction);
            }
            continue;
        }

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
        let (axis, carrier_angular, side_relative_speed, phase_error, fixed) = {
            let Some(body) = world.bodies.get(satellite.body) else { continue; };
            let Some(side) = world.bodies.get(satellite.side_body) else { continue; };
            let Some(carrier) = world.bodies.get(differential.carrier) else { continue; };
            let pose = *body.position();
            let side_pose = *side.position();
            let axis = (pose.rotation * satellite.local_axis).normalize();
            let side_axis = (side_pose.rotation * satellite.local_side_axis).normalize();
            let center = pose.transform_point(satellite.local_center);
            let side_center = side_pose.transform_point(satellite.local_side_center);
            let delta = side_center - center;
            let radial = delta - axis * delta.dot(axis);
            let side_radial = -delta - side_axis * (-delta).dot(side_axis);
            let phase_error = if satellite.phase_lock && radial.length_squared() > EPSILON && side_radial.length_squared() > EPSILON {
                let reference = pose.rotation * satellite.local_reference;
                let side_reference = side_pose.rotation * satellite.local_side_reference;
                let reference = reference - axis * reference.dot(axis);
                let side_reference = side_reference - side_axis * side_reference.dot(side_axis);
                if reference.length_squared() > EPSILON && side_reference.length_squared() > EPSILON {
                    let angle = signed_angle(reference.normalize(), radial.normalize(), axis);
                    let side_angle = signed_angle(side_reference.normalize(), side_radial.normalize(), side_axis);
                    wrap_pi(
                        satellite.coefficient * angle
                            + satellite.side_coefficient * side_angle
                            - std::f32::consts::PI,
                    )
                } else { 0.0 }
            } else { 0.0 };
            let carrier_angular = carrier.angvel();
            (
                axis,
                carrier_angular,
                (side.angvel() - carrier_angular).dot(side_axis),
                phase_error,
                body.is_fixed(),
            )
        };
        if fixed { continue; }
        let phase_rate = if dt > EPSILON {
            (phase_error * PHASE_BAUMGARTE / dt).clamp(
                -MAX_PHASE_SPIN_SPEED * satellite.coefficient.abs(),
                MAX_PHASE_SPIN_SPEED * satellite.coefficient.abs(),
            )
        } else { 0.0 };
        let target_relative =
            (phase_rate - satellite.side_coefficient * side_relative_speed)
                / satellite.coefficient;
        let target = carrier_angular.dot(axis) + target_relative;
        set_axis_speed(world, satellite.body, axis, target);
    }
}

fn signed_angle(from: Vector, to: Vector, axis: Vector) -> Real {
    axis.dot(from.cross(to)).atan2(from.dot(to))
}

fn wrap_pi(value: Real) -> Real {
    (value + std::f32::consts::PI).rem_euclid(std::f32::consts::TAU)
        - std::f32::consts::PI
}

fn set_axis_speed(
    world: &mut PhysicsWorld,
    handle: RigidBodyHandle,
    axis: Vector,
    target: Real,
) {
    let body = &mut world.bodies[handle];
    if body.is_fixed() { return; }
    let angular = body.angvel();
    body.set_angvel(angular + axis * (target - angular.dot(axis)), true);
}
