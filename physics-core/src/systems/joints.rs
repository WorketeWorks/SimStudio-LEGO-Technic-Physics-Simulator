use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::math::{normalized, vector};
use crate::model::{JointConfig, JointMode, PhysicsCommand, PhysicsSettings};

#[derive(Clone)]
pub struct JointRuntime {
    pub id: String,
    pub handle: ImpulseJointHandle,
    pub body_a: RigidBodyHandle,
    pub body_b: RigidBodyHandle,
    pub mode: JointMode,
    pub local_axis_a: Vector,
    pub local_axis_b: Vector,
    pub motor_speed: Real,
    pub motor_force: Real,
}

pub fn create_joint(
    config: &JointConfig,
    body_ids: &HashMap<u32, RigidBodyHandle>,
    world: &mut PhysicsWorld,
) -> Option<JointRuntime> {
    let body_a = *body_ids.get(&config.body_a)?;
    let body_b = *body_ids.get(&config.body_b)?;
    if body_a == body_b {
        return None;
    }

    let rigid_a = world.bodies.get(body_a)?;
    let rigid_b = world.bodies.get(body_b)?;
    let anchor_a = rigid_a
        .position()
        .inverse_transform_point(vector(config.world_anchor_a));
    let anchor_b = rigid_b
        .position()
        .inverse_transform_point(vector(config.world_anchor_b));
    let world_axis_a = normalized(config.world_axis_a);
    let world_axis_b = normalized(config.world_axis_b);
    let axis_a = rigid_a.position().inverse_transform_vector(world_axis_a);
    let axis_b = rigid_b.position().inverse_transform_vector(world_axis_b);

    let mut data = match config.mode {
        JointMode::Rotation | JointMode::Motor => {
            let builder = GenericJointBuilder::new(JointAxesMask::LOCKED_REVOLUTE_AXES)
                .contacts_enabled(true);
            // A limited hinge needs the same complete world-space reference
            // frame on both bodies. Supplying only each local axis lets Rapier
            // choose unrelated tangent axes, so its measured zero angle can be
            // offset even though the Cardan is initially assembled correctly.
            let data = if config.angular_limit.is_some() {
                let world_frame = Rotation::from_rotation_arc(Vector::X, world_axis_a);
                let frame_a = Pose::from_parts(
                    anchor_a,
                    rigid_a.rotation().inverse() * world_frame,
                );
                let frame_b = Pose::from_parts(
                    anchor_b,
                    rigid_b.rotation().inverse() * world_frame,
                );
                builder.local_frame1(frame_a).local_frame2(frame_b).build()
            } else {
                builder
                    .local_axis1(axis_a)
                    .local_axis2(axis_b)
                    .local_anchor1(anchor_a)
                    .local_anchor2(anchor_b)
                    .build()
            };
            data
        }
        JointMode::Linear => {
            let mut joint = PrismaticJoint::new(axis_a);
            joint
                .set_local_axis2(axis_b)
                .set_local_anchor1(anchor_a)
                .set_local_anchor2(anchor_b)
                .set_contacts_enabled(true);
            if !config.dynamic_axle {
                let limit = (config.travel * 0.5).max(0.15);
                joint.set_limits([-limit, limit]);
            }
            joint.data
        }
        JointMode::RotationLinear => GenericJointBuilder::new(
            JointAxesMask::LIN_Y
                | JointAxesMask::LIN_Z
                | JointAxesMask::ANG_Y
                | JointAxesMask::ANG_Z,
        )
        .local_anchor1(anchor_a)
        .local_anchor2(anchor_b)
        .local_axis1(axis_a)
        .local_axis2(axis_b)
        .contacts_enabled(true)
        .build(),
        JointMode::Fixed => {
            // Both frames use the current world orientation. This keeps forced
            // connections at their visual offset instead of teleporting them.
            let world_frame_a = Rotation::from_rotation_arc(Vector::X, world_axis_a);
            let world_frame_b = Rotation::from_rotation_arc(Vector::X, world_axis_b);
            let frame_a = Pose::from_parts(anchor_a, rigid_a.rotation().inverse() * world_frame_a);
            let frame_b = Pose::from_parts(anchor_b, rigid_b.rotation().inverse() * world_frame_b);
            FixedJointBuilder::new()
                .local_frame1(frame_a)
                .local_frame2(frame_b)
                .contacts_enabled(true)
                .build()
                .data
        }
    };

    if matches!(config.mode, JointMode::Rotation | JointMode::Motor) {
        if let Some(limit) = config.angular_limit.filter(|limit| *limit > 0.0) {
            let limit = limit.min(std::f32::consts::PI);
            data.set_limits(JointAxis::AngX, [-limit, limit]);
        }
    }

    // Connected groups still need self-collision away from their joint. Beam
    // clearance is handled by their collider dimensions in the scene builder,
    // rather than disabling contacts for the complete rigid-body pair.
    data.set_contacts_enabled(true);
    let handle = world.impulse_joints.insert(body_a, body_b, data, true);

    Some(JointRuntime {
        id: config.id.clone(),
        handle,
        body_a,
        body_b,
        mode: config.mode,
        local_axis_a: axis_a,
        local_axis_b: axis_b,
        motor_speed: if config.mode == JointMode::Motor { config.motor_speed } else { 0.0 },
        motor_force: if config.mode == JointMode::Motor {
            config.motor_force.max(0.0)
        } else if config.mode == JointMode::Rotation {
            config.passive_motor_force.max(0.0)
        } else { 0.0 },
    })
}

pub fn update_motors(
    commands: &[PhysicsCommand],
    joint_ids: &HashMap<String, usize>,
    joints: &mut [JointRuntime],
) {
    for command in commands {
        let PhysicsCommand::SetMotor {
            joint,
            speed,
            force,
        } = command
        else {
            continue;
        };
        let Some(runtime) = joint_ids.get(joint).and_then(|index| joints.get_mut(*index)) else {
            continue;
        };
        if !matches!(runtime.mode, JointMode::Rotation | JointMode::Motor) { continue; }
        runtime.motor_speed = *speed;
        runtime.motor_force = (*force).max(0.0);
    }
}

/// Apply finite motor torque before drivetrain projection and integration.
/// A motor inside Rapier's later solve would rotate a blocked shaft first;
/// cancelling its velocity afterwards cannot undo that skipped tooth.
pub fn apply_motor_impulses(joints: &[JointRuntime], world: &mut PhysicsWorld, dt: Real) {
    for joint in joints {
        if joint.motor_force <= 0.0 { continue; }
        let a = &world.bodies[joint.body_a];
        let b = &world.bodies[joint.body_b];
        let axis_a = a.rotation() * joint.local_axis_a;
        let axis_b = b.rotation() * joint.local_axis_b;
        let denominator = axis_a.dot(a.mass_properties().effective_world_inv_inertia * axis_a)
            + axis_b.dot(b.mass_properties().effective_world_inv_inertia * axis_b);
        if denominator <= 1.0e-8 { continue; }
        let speed = b.angvel().dot(axis_b) - a.angvel().dot(axis_a);
        let gain = joint.motor_force.max(0.01) * dt;
        let delta = (joint.motor_speed - speed) * gain / (1.0 + gain);
        let limit = joint.motor_force * dt;
        let impulse = (delta / denominator).clamp(-limit, limit);
        world.bodies[joint.body_a].apply_torque_impulse(-axis_a * impulse, true);
        world.bodies[joint.body_b].apply_torque_impulse(axis_b * impulse, true);
    }
}

/// Applies the small user-configurable resistance of sliding axles. The joint
/// itself handles alignment; this system only damps motion along its free axis.
pub fn apply_axle_friction(
    joints: &[JointRuntime],
    world: &mut PhysicsWorld,
    settings: PhysicsSettings,
    timestep: f32,
) {
    for joint in joints {
        if joint.mode != JointMode::Linear && joint.mode != JointMode::RotationLinear {
            continue;
        }

        let Some(body_a) = world.bodies.get(joint.body_a) else {
            continue;
        };
        let Some(body_b) = world.bodies.get(joint.body_b) else {
            continue;
        };
        let axis = body_a.rotation() * joint.local_axis_a;
        let linear_a = body_a.linvel();
        let linear_b = body_b.linvel();
        let angular_a = body_a.angvel();
        let angular_b = body_b.angvel();
        let fixed_a = body_a.is_fixed();
        let fixed_b = body_b.is_fixed();

        let relative_speed = (linear_b - linear_a).dot(axis);
        let damping = settings.axle_sliding_friction
            * if joint.mode == JointMode::Linear {
                1.0
            } else {
                0.375
            };
        let impulse = axis * (relative_speed * damping).clamp(-0.35, 0.35) * timestep;
        if !fixed_a {
            world.bodies[joint.body_a].apply_impulse(impulse, true);
        }
        if !fixed_b {
            world.bodies[joint.body_b].apply_impulse(-impulse, true);
        }

        if joint.mode == JointMode::RotationLinear && settings.axle_rotation_friction > 0.0 {
            let relative_angular = (angular_b - angular_a).dot(axis);
            let torque = axis
                * (relative_angular * settings.axle_rotation_friction).clamp(-1.0, 1.0)
                * timestep;
            if !fixed_a {
                world.bodies[joint.body_a].apply_torque_impulse(torque, true);
            }
            if !fixed_b {
                world.bodies[joint.body_b].apply_torque_impulse(-torque, true);
            }
        }
    }
}

/// Return gear reactions to the bearing supports during drivetrain sweeps.
/// Rapier still owns joint position correction, limits and contacts.
pub fn project_locked_velocities(joints: &[JointRuntime], world: &mut PhysicsWorld) {
    for joint in joints {
        let Some(runtime) = world.impulse_joints.get(joint.handle) else { continue; };
        let data = runtime.data;
        let pose_a = *world.bodies[joint.body_a].position();
        let pose_b = *world.bodies[joint.body_b].position();
        let frame_a = pose_a * data.local_frame1;
        let frame_b = pose_b * data.local_frame2;
        for (index, basis) in [Vector::X, Vector::Y, Vector::Z].iter().enumerate() {
            let axis = frame_a.rotation * *basis;
            for angular in [false, true] {
                let bit = 1 << (index + if angular { 3 } else { 0 });
                if data.locked_axes.bits() & bit == 0 { continue; }
                let a = &world.bodies[joint.body_a];
                let b = &world.bodies[joint.body_b];
                let ma = a.mass_properties();
                let mb = b.mass_properties();
                let (ja, jb, error, linear_denominator) = if angular {
                    (axis, -axis, (a.angvel() - b.angvel()).dot(axis), 0.0)
                } else {
                    (
                        (frame_a.translation - ma.world_com).cross(axis),
                        -(frame_b.translation - mb.world_com).cross(axis),
                        (a.velocity_at_point(frame_a.translation)
                            - b.velocity_at_point(frame_b.translation)).dot(axis),
                        axis.dot((ma.effective_inv_mass + mb.effective_inv_mass) * axis),
                    )
                };
                let denominator = linear_denominator
                    + ja.dot(ma.effective_world_inv_inertia * ja)
                    + jb.dot(mb.effective_world_inv_inertia * jb);
                if denominator <= 1.0e-8 || error.abs() <= 1.0e-6 { continue; }
                let impulse = -error / denominator;
                if !angular {
                    world.bodies[joint.body_a].apply_impulse(axis * impulse, true);
                    world.bodies[joint.body_b].apply_impulse(-axis * impulse, true);
                }
                world.bodies[joint.body_a].apply_torque_impulse(ja * impulse, true);
                world.bodies[joint.body_b].apply_torque_impulse(jb * impulse, true);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_joint_keeps_contacts_between_its_two_bodies() {
        let mut world = PhysicsWorld::new();
        let body_a = world.bodies.insert(RigidBodyBuilder::dynamic().build());
        let body_b = world.bodies.insert(RigidBodyBuilder::dynamic().build());
        let body_ids = HashMap::from([(1, body_a), (2, body_b)]);
        let config = JointConfig {
            id: "beam-pin-beam".into(),
            body_a: 1,
            body_b: 2,
            mode: JointMode::Rotation,
            world_anchor_a: [0.0, 0.0, 0.0],
            world_anchor_b: [0.0, 0.0, 0.0],
            world_axis_a: [1.0, 0.0, 0.0],
            world_axis_b: [1.0, 0.0, 0.0],
            travel: 0.0,
            motor_speed: 0.0,
            motor_force: 0.0,
            passive_motor_force: 0.0,
            dynamic_axle: false,
            angular_limit: None,
        };

        let runtime = create_joint(&config, &body_ids, &mut world).unwrap();
        let joint = world.impulse_joints.get(runtime.handle).unwrap();

        assert!(joint.data.contacts_enabled());
    }
}
