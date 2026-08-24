use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::math::{normalized, vector};
use crate::model::GearConfig;

// One forward/reverse sweep only propagates a driven velocity across roughly
// one neighbouring contact before Rapier runs. Longer gear trains therefore
// entered the step with mutually inconsistent velocities and could eject the
// whole chain. Four cheap gear-only sweeps converge chains without adding
// more Rapier substeps.
const VELOCITY_SOLVER_PASSES: usize = 8;
const VELOCITY_EPSILON: Real = 1.0e-6;
const GEOMETRY_EPSILON: Real = 1.0e-8;

const REST_ANGULAR_SPEED: Real = 2.0e-5;
const REST_CONTACT_SPEED: Real = 2.0e-5;
const REST_LINEAR_SPEED: Real = 2.0e-5;

const PHASE_BAUMGARTE: Real = 0.35;
const MAX_PHASE_CORRECTION_SPEED: Real = 1.5;

#[derive(Clone)]
pub struct GearRuntime {
    pub id: String,
    pub body_a: RigidBodyHandle,
    pub body_b: RigidBodyHandle,
    pub carrier_body: Option<RigidBodyHandle>,
    pub local_carrier_axis: Option<Vector>,
    pub local_axis_a: Vector,
    pub local_axis_b: Vector,
    pub local_center_a: Vector,
    pub local_center_b: Vector,
    pub local_reference_a: Vector,
    pub local_reference_b: Vector,
    pub teeth_a: Real,
    pub signed_teeth_b: Real,
    pub phase_lock: bool,
    pub initial_phase: Real,
    pub phase_target: Real,
    pub angle_a: Real,
    pub angle_b: Real,
}

fn initial_gear_angles(config: &GearConfig) -> (Real, Real) {
    let axis_a = normalized(config.axis_a);
    let axis_b = normalized(config.axis_b);
    let center_a = vector(config.center_a);
    let center_b = vector(config.center_b);
    let center_delta = center_b - center_a;

    let radial_a_raw =
        center_delta - axis_a * center_delta.dot(axis_a);
    let radial_b_raw =
        -center_delta - axis_b * (-center_delta).dot(axis_b);

    if radial_a_raw.length_squared() <= GEOMETRY_EPSILON
        || radial_b_raw.length_squared() <= GEOMETRY_EPSILON
    {
        return (0.0, 0.0);
    }

    let radial_a = radial_a_raw.normalize();
    let radial_b = radial_b_raw.normalize();

    let reference_a = normalized(config.reference_a);
    let reference_b = normalized(config.reference_b);

    let ref_a_raw = reference_a - axis_a * reference_a.dot(axis_a);
    let ref_b_raw = reference_b - axis_b * reference_b.dot(axis_b);

    if ref_a_raw.length_squared() <= GEOMETRY_EPSILON
        || ref_b_raw.length_squared() <= GEOMETRY_EPSILON
    {
        return (0.0, 0.0);
    }

    (
        signed_angle_around_axis(ref_a_raw.normalize(), radial_a, axis_a),
        signed_angle_around_axis(ref_b_raw.normalize(), radial_b, axis_b),
    )
}
pub fn build_gears(
    configs: &[GearConfig],
    bodies: &HashMap<u32, RigidBodyHandle>,
    world: &PhysicsWorld,
) -> Vec<GearRuntime> {
    configs
        .iter()
        .filter_map(|config| {
            let body_a = *bodies.get(&config.body_a)?;
            let body_b = *bodies.get(&config.body_b)?;

            if body_a == body_b {
                return None;
            }

            let rigid_a = world.bodies.get(body_a)?;
            let rigid_b = world.bodies.get(body_b)?;
            let carrier_body = config
                .carrier_body
                .and_then(|id| bodies.get(&id).copied());
            let local_carrier_axis = config.carrier_axis.and_then(|axis| {
                carrier_body.and_then(|handle| {
                    world
                        .bodies
                        .get(handle)
                        .map(|carrier| carrier.position().inverse_transform_vector(normalized(axis)))
                })
            });


            let (initial_angle_a, initial_angle_b) =
                initial_gear_angles(config);
            let teeth_a = config.teeth_a.max(1.0);
            let teeth_b = config.teeth_b.max(1.0);
            let sign_b = if config.sign_b < 0.0 { -1.0 } else { 1.0 };
            let initial_raw_phase =
                teeth_a * initial_angle_a
                    + sign_b * teeth_b * initial_angle_b;

            // Correct any pre-existing misalignment to the nearest valid
            // tooth engagement instead of preserving the starting error.
            let phase_target =
                std::f32::consts::PI
                    + std::f32::consts::TAU
                        * ((initial_raw_phase - std::f32::consts::PI)
                            / std::f32::consts::TAU)
                            .round();

            let initial_phase = wrap_pi(phase_target);

            Some(GearRuntime {
                id: config.id.clone(),
                body_a,
                body_b,
                carrier_body,
                local_carrier_axis,
                local_axis_a: rigid_a
                    .position()
                    .inverse_transform_vector(normalized(config.axis_a)),
                local_axis_b: rigid_b
                    .position()
                    .inverse_transform_vector(normalized(config.axis_b)),
                local_center_a: rigid_a
                    .position()
                    .inverse_transform_point(vector(config.center_a)),
                local_center_b: rigid_b
                    .position()
                    .inverse_transform_point(vector(config.center_b)),
                local_reference_a: rigid_a
                    .position()
                    .inverse_transform_vector(normalized(config.reference_a)),
                local_reference_b: rigid_b
                    .position()
                    .inverse_transform_vector(normalized(config.reference_b)),
                teeth_a: config.teeth_a.max(1.0),
                signed_teeth_b: config.sign_b * config.teeth_b.max(1.0),
                phase_lock: config.phase_lock,
                initial_phase,
                phase_target,
                angle_a: initial_angle_a,
                angle_b: initial_angle_b,
            })
        })
        .collect()
}



pub fn project_velocities(
    gears: &[GearRuntime],
    world: &mut PhysicsWorld,
    dt: Real,
) {
    // One bilateral angular constraint transfers torque without injecting
    // linear impulses into every axle. Longer graphs receive more cheap
    // Gauss-Seidel passes, capped to keep large mechanisms predictable.
    let passes = gears.len().min(24).max(VELOCITY_SOLVER_PASSES);
    for _ in 0..passes {
        for gear in gears {
            solve_ideal_gear_velocity(gear, world, phase_velocity_bias(gear, world, dt));
        }

        for gear in gears.iter().rev() {
            solve_ideal_gear_velocity(gear, world, phase_velocity_bias(gear, world, dt));
        }
    }

    for gear in gears {
        settle_near_rest(gear, world);
    }
}

fn phase_velocity_bias(gear: &GearRuntime, world: &PhysicsWorld, dt: Real) -> Real {
    if !gear.phase_lock || dt <= 1.0e-6 {
        return 0.0;
    }
    let (Some(body_a), Some(body_b)) = (
        world.bodies.get(gear.body_a),
        world.bodies.get(gear.body_b),
    ) else {
        return 0.0;
    };
    let position_a = *body_a.position();
    let position_b = *body_b.position();
    let axis_a = position_a.rotation * gear.local_axis_a;
    let axis_b = position_b.rotation * gear.local_axis_b;
    let center_a = position_a.transform_point(gear.local_center_a);
    let center_b = position_b.transform_point(gear.local_center_b);
    let delta = center_b - center_a;
    let radial_a = delta - axis_a * delta.dot(axis_a);
    let radial_b = -delta - axis_b * (-delta).dot(axis_b);
    if radial_a.length_squared() <= GEOMETRY_EPSILON
        || radial_b.length_squared() <= GEOMETRY_EPSILON
    {
        return 0.0;
    }
    let phase_error = unwrapped_phase_error(
        gear,
        position_a,
        position_b,
        radial_a.normalize(),
        radial_b.normalize(),
    );
    let max_phase_rate = MAX_PHASE_CORRECTION_SPEED
        * gear.teeth_a.min(gear.signed_teeth_b.abs()).max(1.0);
    (phase_error * PHASE_BAUMGARTE / dt)
        .clamp(-max_phase_rate, max_phase_rate)
}

fn solve_ideal_gear_velocity(
    gear: &GearRuntime,
    world: &mut PhysicsWorld,
    phase_bias: Real,
) {
    if gear.carrier_body.is_some() && gear.local_carrier_axis.is_some() {
        solve_differential_impulse(gear, world);
        return;
    }
    let (axis_a, axis_b, speed_a, speed_b, inv_a, inv_b, fixed_a, fixed_b) = {
        let (Some(body_a), Some(body_b)) = (
            world.bodies.get(gear.body_a),
            world.bodies.get(gear.body_b),
        ) else {
            return;
        };
        let position_a = *body_a.position();
        let position_b = *body_b.position();
        let axis_a = (position_a.rotation * gear.local_axis_a).normalize();
        let axis_b = (position_b.rotation * gear.local_axis_b).normalize();
        let center_a = position_a.transform_point(gear.local_center_a);
        let center_b = position_b.transform_point(gear.local_center_b);
        let center_velocity_a = body_a.velocity_at_point(center_a);
        let center_velocity_b = body_b.velocity_at_point(center_b);
        (
            axis_a,
            axis_b,
            mesh_speed_in_body_frame(
                axis_a,
                center_b - center_a,
                center_velocity_b - center_velocity_a,
                body_a.angvel(),
            ),
            mesh_speed_in_body_frame(
                axis_b,
                center_a - center_b,
                center_velocity_a - center_velocity_b,
                body_b.angvel(),
            ),
            axis_a.dot(body_a.mass_properties().effective_world_inv_inertia * axis_a),
            axis_b.dot(body_b.mass_properties().effective_world_inv_inertia * axis_b),
            body_a.is_fixed(),
            body_b.is_fixed(),
        )
    };
    if fixed_a && fixed_b {
        return;
    }
    let coefficient_a = gear.teeth_a.max(1.0);
    let coefficient_b = gear.signed_teeth_b;
    let error = coefficient_a * speed_a + coefficient_b * speed_b - phase_bias;
    let denominator = coefficient_a * coefficient_a * inv_a
        + coefficient_b * coefficient_b * inv_b;
    if error.abs() <= VELOCITY_EPSILON || denominator <= GEOMETRY_EPSILON {
        return;
    }
    let lambda = -error / denominator;
    if !fixed_a {
        world.bodies[gear.body_a]
            .apply_torque_impulse(axis_a * (lambda * coefficient_a), true);
    }
    if !fixed_b {
        world.bodies[gear.body_b]
            .apply_torque_impulse(axis_b * (lambda * coefficient_b), true);
    }
}

/// Axial tooth speed measured against the moving line between both gear
/// centres.  Using only `angvel · axis` is correct for two stationary axles,
/// but misses the essential planetary case: a fork/carrier can orbit one gear
/// around another while both axial speeds initially remain zero.
///
/// The radial line is measured in this gear's rotating body frame. Its signed
/// angular rate is subtracted from the body's axial rate, so translating a
/// meshed gear tangentially produces the exact spin required for rolling
/// contact. The solver still applies torque impulses only; axle joints receive
/// the reaction without the destabilising linear impulses of tooth colliders.
fn mesh_speed_in_body_frame(
    axis: Vector,
    center_delta: Vector,
    center_delta_velocity: Vector,
    body_angular_velocity: Vector,
) -> Real {
    let radial = center_delta - axis * center_delta.dot(axis);
    let radial_length_squared = radial.length_squared();
    if radial_length_squared <= GEOMETRY_EPSILON {
        return body_angular_velocity.dot(axis);
    }

    let radial_velocity_in_body_frame =
        center_delta_velocity - body_angular_velocity.cross(center_delta);
    -axis.dot(radial.cross(radial_velocity_in_body_frame)) / radial_length_squared
}



fn unwrapped_phase_error(
    gear: &GearRuntime,
    position_a: Pose,
    position_b: Pose,
    radial_a: Vector,
    radial_b: Vector,
) -> Real {
    if !gear.phase_lock {
        return 0.0;
    }

    let axis_a = position_a.rotation * gear.local_axis_a;
    let axis_b = position_b.rotation * gear.local_axis_b;

    let reference_a_world =
        position_a.rotation * gear.local_reference_a;
    let reference_b_world =
        position_b.rotation * gear.local_reference_b;

    let ref_a_raw =
        reference_a_world - axis_a * reference_a_world.dot(axis_a);
    let ref_b_raw =
        reference_b_world - axis_b * reference_b_world.dot(axis_b);

    if ref_a_raw.length_squared() <= GEOMETRY_EPSILON
        || ref_b_raw.length_squared() <= GEOMETRY_EPSILON
    {
        return 0.0;
    }

    let wrapped_a =
        signed_angle_around_axis(ref_a_raw.normalize(), radial_a, axis_a);
    let wrapped_b =
        signed_angle_around_axis(ref_b_raw.normalize(), radial_b, axis_b);

    let current_a =
        gear.angle_a + wrap_pi(wrapped_a - wrap_pi(gear.angle_a));
    let current_b =
        gear.angle_b + wrap_pi(wrapped_b - wrap_pi(gear.angle_b));

    gear.teeth_a * current_a
        + gear.signed_teeth_b * current_b
        - gear.phase_target
}


pub fn project_exact_no_slip(
    gears: &[GearRuntime],
    world: &mut PhysicsWorld,
) {
    // This is the hard gear constraint.
    //
    // Repeated forward/reverse Gauss-Seidel sweeps make every gear contact
    // satisfy zero relative tooth velocity. There is no clutch, tolerance,
    // phase spring, or permitted tooth slip.
    let passes = gears.len().min(24).max(VELOCITY_SOLVER_PASSES);
    for _ in 0..passes {
        for gear in gears {
            solve_ideal_gear_velocity(gear, world, 0.0);
        }

        for gear in gears.iter().rev() {
            solve_ideal_gear_velocity(gear, world, 0.0);
        }
    }
}

fn solve_differential_impulse(gear: &GearRuntime, world: &mut PhysicsWorld) {
    let (Some(carrier_handle), Some(local_carrier_axis)) =
        (gear.carrier_body, gear.local_carrier_axis)
    else {
        return;
    };
    let ta = gear.teeth_a.abs().max(1.0);
    let tb = gear.signed_teeth_b.abs().max(1.0);
    let ca = ta;
    let cb = tb;
    let cc = -(ta + tb);
    let (axis_a, axis_b, axis_c, wa, wb, wc, ia, ib, ic, fixed_a, fixed_b, fixed_c) = {
        let Some(body_a) = world.bodies.get(gear.body_a) else { return; };
        let Some(body_b) = world.bodies.get(gear.body_b) else { return; };
        let Some(carrier) = world.bodies.get(carrier_handle) else { return; };
        let axis_a = (body_a.position().rotation * gear.local_axis_a).normalize();
        // Measure both side shafts with the same outward-positive convention.
        // Imported connector axes can point in opposite world directions; if
        // left untouched, an inverse differential appears as equal world
        // angular velocities even though its scalar relation is correct.
        let mut axis_b = (body_b.position().rotation * gear.local_axis_b).normalize();
        if axis_a.dot(axis_b) < -0.2 {
            axis_b = -axis_b;
        }
        let mut axis_c = (carrier.position().rotation * local_carrier_axis).normalize();
        if axis_a.dot(axis_c) < -0.2 {
            axis_c = -axis_c;
        }
        (
            axis_a,
            axis_b,
            axis_c,
            body_a.angvel().dot(axis_a),
            body_b.angvel().dot(axis_b),
            carrier.angvel().dot(axis_c),
            axis_a.dot(body_a.mass_properties().effective_world_inv_inertia * axis_a),
            axis_b.dot(body_b.mass_properties().effective_world_inv_inertia * axis_b),
            axis_c.dot(carrier.mass_properties().effective_world_inv_inertia * axis_c),
            body_a.is_fixed(),
            body_b.is_fixed(),
            carrier.is_fixed(),
        )
    };
    let error = ca * wa + cb * wb + cc * wc;
    let denominator = ca * ca * ia + cb * cb * ib + cc * cc * ic;
    if error.abs() < VELOCITY_EPSILON || denominator <= GEOMETRY_EPSILON {
        return;
    }
    let lambda = -error / denominator;
    if !fixed_a { world.bodies[gear.body_a].apply_torque_impulse(axis_a * (lambda * ca), true); }
    if !fixed_b { world.bodies[gear.body_b].apply_torque_impulse(axis_b * (lambda * cb), true); }
    if !fixed_c { world.bodies[carrier_handle].apply_torque_impulse(axis_c * (lambda * cc), true); }
}

fn settle_near_rest(gear: &GearRuntime, world: &mut PhysicsWorld) {
    let Some(body_a) = world.bodies.get(gear.body_a) else {
        return;
    };
    let Some(body_b) = world.bodies.get(gear.body_b) else {
        return;
    };

    let position_a = *body_a.position();
    let position_b = *body_b.position();

    let axis_a = position_a.rotation * gear.local_axis_a;
    let axis_b = position_b.rotation * gear.local_axis_b;

    if axis_a.dot(axis_b).abs() < 0.2 {
        return;
    }

    let center_a = position_a.transform_point(gear.local_center_a);
    let center_b = position_b.transform_point(gear.local_center_b);
    let center_delta = center_b - center_a;

    if center_delta.length_squared() <= GEOMETRY_EPSILON {
        return;
    }

    let radial_a_raw = center_delta - axis_a * center_delta.dot(axis_a);
    let radial_b_raw = -center_delta - axis_b * (-center_delta).dot(axis_b);

    if radial_a_raw.length_squared() <= GEOMETRY_EPSILON
        || radial_b_raw.length_squared() <= GEOMETRY_EPSILON
    {
        return;
    }

    let radial_a = radial_a_raw.normalize();
    let radial_b = radial_b_raw.normalize();

    let tangent_a_raw = axis_a.cross(radial_a);
    let tangent_b_raw = axis_b.cross(radial_b);

    if tangent_a_raw.length_squared() <= GEOMETRY_EPSILON
        || tangent_b_raw.length_squared() <= GEOMETRY_EPSILON
    {
        return;
    }

    let tangent_a = tangent_a_raw.normalize();
    let mut tangent_b = tangent_b_raw.normalize();

    if tangent_a.dot(tangent_b) < 0.0 {
        tangent_b = -tangent_b;
    }

    let tangent_sum = tangent_a + tangent_b;
    let tangent = if tangent_sum.length_squared() > GEOMETRY_EPSILON {
        tangent_sum.normalize()
    } else {
        tangent_a
    };

    let distance = center_delta.length();
    if distance <= GEOMETRY_EPSILON {
        return;
    }

    let teeth_b = gear.signed_teeth_b.abs().max(1.0);
    let total_teeth = (gear.teeth_a + teeth_b).max(1.0);
    let radius_a = distance * gear.teeth_a / total_teeth;
    let radius_b = distance * teeth_b / total_teeth;

    let contact_a = center_a + radial_a * radius_a;
    let contact_b = center_b + radial_b * radius_b;

    let r_a = contact_a - position_a.translation;
    let r_b = contact_b - position_b.translation;

    let linear_a = body_a.linvel();
    let linear_b = body_b.linvel();
    let angular_a = body_a.angvel();
    let angular_b = body_b.angvel();

    let point_velocity_a = linear_a + angular_a.cross(r_a);
    let point_velocity_b = linear_b + angular_b.cross(r_b);

    let contact_speed_a = point_velocity_a.dot(tangent).abs();
    let contact_speed_b = point_velocity_b.dot(tangent).abs();
    let relative_linear_speed = (linear_a - linear_b).dot(tangent).abs();

    if contact_speed_a > REST_CONTACT_SPEED
        || contact_speed_b > REST_CONTACT_SPEED
        || relative_linear_speed > REST_LINEAR_SPEED
    {
        return;
    }

    let fixed_a = body_a.is_fixed();
    let fixed_b = body_b.is_fixed();

    let axial_a = angular_a.dot(axis_a);
    let axial_b = angular_b.dot(axis_b);

    if !fixed_a && axial_a.abs() <= REST_ANGULAR_SPEED {
        world.bodies[gear.body_a].set_angvel(
            angular_a - axis_a * axial_a,
            true,
        );
    }

    if !fixed_b && axial_b.abs() <= REST_ANGULAR_SPEED {
        world.bodies[gear.body_b].set_angvel(
            angular_b - axis_b * axial_b,
            true,
        );
    }
}



fn signed_angle_around_axis(from: Vector, to: Vector, axis: Vector) -> Real {
    axis.dot(from.cross(to)).atan2(from.dot(to))
}

fn wrap_pi(value: Real) -> Real {
    let two_pi = std::f32::consts::TAU;
    (value + std::f32::consts::PI).rem_euclid(two_pi) - std::f32::consts::PI
}

/** Returns the shortest signed angular delta from an unwrapped reference. */
pub fn wrapped_delta(value: Real, reference: Real) -> Real {
    wrap_pi(value - wrap_pi(reference))
}




pub fn accumulate_angles(
    gears: &mut [GearRuntime],
    _previous_rotations: &mut HashMap<RigidBodyHandle, Rotation>,
    world: &PhysicsWorld,
) {
    for gear in gears {
        let Some(body_a) = world.bodies.get(gear.body_a) else {
            continue;
        };
        let Some(body_b) = world.bodies.get(gear.body_b) else {
            continue;
        };

        let position_a = *body_a.position();
        let position_b = *body_b.position();

        let axis_a = position_a.rotation * gear.local_axis_a;
        let axis_b = position_b.rotation * gear.local_axis_b;

        let center_a = position_a.transform_point(gear.local_center_a);
        let center_b = position_b.transform_point(gear.local_center_b);
        let center_delta = center_b - center_a;

        let radial_a_raw =
            center_delta - axis_a * center_delta.dot(axis_a);
        let radial_b_raw =
            -center_delta - axis_b * (-center_delta).dot(axis_b);

        if radial_a_raw.length_squared() <= GEOMETRY_EPSILON
            || radial_b_raw.length_squared() <= GEOMETRY_EPSILON
        {
            continue;
        }

        let radial_a = radial_a_raw.normalize();
        let radial_b = radial_b_raw.normalize();

        let reference_a =
            position_a.rotation * gear.local_reference_a;
        let reference_b =
            position_b.rotation * gear.local_reference_b;

        let ref_a_raw =
            reference_a - axis_a * reference_a.dot(axis_a);
        let ref_b_raw =
            reference_b - axis_b * reference_b.dot(axis_b);

        if ref_a_raw.length_squared() <= GEOMETRY_EPSILON
            || ref_b_raw.length_squared() <= GEOMETRY_EPSILON
        {
            continue;
        }

        let wrapped_a =
            signed_angle_around_axis(ref_a_raw.normalize(), radial_a, axis_a);
        let wrapped_b =
            signed_angle_around_axis(ref_b_raw.normalize(), radial_b, axis_b);

        gear.angle_a += wrap_pi(wrapped_a - wrap_pi(gear.angle_a));
        gear.angle_b += wrap_pi(wrapped_b - wrap_pi(gear.angle_b));
    }
}
