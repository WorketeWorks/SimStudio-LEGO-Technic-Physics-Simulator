use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::math::{normalized, vector};
use crate::model::CamFollowerConfig;

pub struct CamFollowerRuntime {
    guide_joint: String,
    selector: RigidBodyHandle,
    follower: RigidBodyHandle,
    local_center: Vector,
    local_follower_point: Vector,
    local_axis: Vector,
    local_reference: Vector,
    initial_offset: Real,
    initial_profile: Real,
    profile: Vec<Real>,
}

fn sample(profile: &[Real], angle: Real) -> Real {
    if profile.is_empty() {
        return 0.0;
    }
    let turn = std::f32::consts::TAU;
    let wrapped = angle.rem_euclid(turn) / turn * profile.len() as Real;
    let index = wrapped.floor() as usize % profile.len();
    let next = (index + 1) % profile.len();
    let fraction = wrapped - wrapped.floor();
    profile[index] + (profile[next] - profile[index]) * fraction
}

fn derivative(profile: &[Real], angle: Real) -> Real {
    if profile.len() < 2 {
        return 0.0;
    }
    let turn = std::f32::consts::TAU;
    let wrapped = angle.rem_euclid(turn) / turn * profile.len() as Real;
    let index = wrapped.floor() as usize % profile.len();
    let next = (index + 1) % profile.len();
    (profile[next] - profile[index]) * profile.len() as Real / turn
}

fn relative_angle(axis: Vector, reference: Vector, radial: Vector) -> Real {
    axis.dot(reference.cross(radial)).atan2(reference.dot(radial))
}

pub fn build(
    configs: &[CamFollowerConfig],
    bodies: &HashMap<u32, RigidBodyHandle>,
    world: &PhysicsWorld,
) -> Vec<CamFollowerRuntime> {
    configs
        .iter()
        .filter_map(|config| {
            let selector = *bodies.get(&config.selector_body)?;
            let follower = *bodies.get(&config.follower_body)?;
            if selector == follower || config.profile.len() < 2 {
                return None;
            }
            let selector_body = world.bodies.get(selector)?;
            let follower_body = world.bodies.get(follower)?;
            let center = vector(config.selector_center);
            let follower_point = vector(config.follower_point);
            let axis = normalized(config.world_axis);
            let mut reference = vector(config.world_reference);
            reference -= axis * reference.dot(axis);
            reference = normalized([reference.x, reference.y, reference.z]);
            let mut radial = follower_point - center;
            radial -= axis * radial.dot(axis);
            radial = normalized([radial.x, radial.y, radial.z]);
            let initial_angle = relative_angle(axis, reference, radial);
            Some(CamFollowerRuntime {
                guide_joint: config.guide_joint.clone(),
                selector,
                follower,
                local_center: selector_body.position().inverse_transform_point(center),
                local_follower_point: follower_body
                    .position()
                    .inverse_transform_point(follower_point),
                local_axis: selector_body.position().inverse_transform_vector(axis),
                local_reference: selector_body
                    .position()
                    .inverse_transform_vector(reference),
                initial_offset: (follower_point - center).dot(axis),
                initial_profile: sample(&config.profile, initial_angle),
                profile: config.profile.clone(),
            })
        })
        .collect()
}

/// Couples the guided towball and selector with an impulse constraint. Unlike
/// a pose overwrite, the same impulse returns the follower load to the cam as
/// resistance torque, so a blocked fork can stall a finite-force motor.
pub fn project_velocities(
    cams: &[CamFollowerRuntime],
    active_joints: &HashMap<String, usize>,
    world: &mut PhysicsWorld,
    dt: Real,
) {
    for cam in cams {
        if !cam.guide_joint.is_empty() && !active_joints.contains_key(&cam.guide_joint) {
            continue;
        }
        let (linear, angular_selector, angular_follower, error, denominator) = {
            let selector = &world.bodies[cam.selector];
            let follower = &world.bodies[cam.follower];
            if selector.is_fixed() && follower.is_fixed() {
                continue;
            }
            let center = selector.position().transform_point(cam.local_center);
            let follower_point = follower
                .position()
                .transform_point(cam.local_follower_point);
            let axis = (selector.rotation() * cam.local_axis).normalize();
            let reference = selector.rotation() * cam.local_reference;
            let delta = follower_point - center;
            let radial = delta - axis * delta.dot(axis);
            let radius_squared = radial.length_squared();
            if radius_squared < 1.0e-8 {
                continue;
            }
            let angle = relative_angle(axis, reference, radial.normalize());
            let slope = derivative(&cam.profile, angle);
            // Angular motion of the radial contact contributes to groove phase.
            // This tangent term makes orbiting the follower around the selector
            // equivalent to rotating the selector in the opposite direction.
            let tangent = axis.cross(radial) / radius_squared;
            let linear = axis - tangent * slope;
            let selector_mass = selector.mass_properties();
            let follower_mass = follower.mass_properties();
            let selector_arm = center - selector_mass.world_com;
            let follower_arm = follower_point - follower_mass.world_com;
            let angular_selector = -selector_arm.cross(linear) + axis * slope;
            let angular_follower = follower_arm.cross(linear);
            let current_offset = delta.dot(axis);
            let target_offset =
                cam.initial_offset + sample(&cam.profile, angle) - cam.initial_profile;
            let position_error = current_offset - target_offset;
            let correction_speed = if dt > 1.0e-6 {
                (position_error * 0.35 / dt).clamp(-6.0, 6.0)
            } else {
                0.0
            };
            let velocity_error = linear.dot(follower.linvel() - selector.linvel())
                + angular_selector.dot(selector.angvel())
                + angular_follower.dot(follower.angvel());
            let denominator =
                linear.dot((selector_mass.effective_inv_mass
                    + follower_mass.effective_inv_mass) * linear)
                    + angular_selector.dot(
                        selector_mass.effective_world_inv_inertia * angular_selector,
                    )
                    + angular_follower.dot(
                        follower_mass.effective_world_inv_inertia * angular_follower,
                    );
            (
                linear,
                angular_selector,
                angular_follower,
                velocity_error + correction_speed,
                denominator,
            )
        };
        if denominator <= 1.0e-8 || error.abs() <= 1.0e-6 {
            continue;
        }
        let impulse = -error / denominator;
        let selector_fixed = world.bodies[cam.selector].is_fixed();
        let follower_fixed = world.bodies[cam.follower].is_fixed();
        if !selector_fixed {
            world.bodies[cam.selector].apply_impulse(-linear * impulse, true);
            world.bodies[cam.selector]
                .apply_torque_impulse(angular_selector * impulse, true);
        }
        if !follower_fixed {
            world.bodies[cam.follower].apply_impulse(linear * impulse, true);
            world.bodies[cam.follower]
                .apply_torque_impulse(angular_follower * impulse, true);
        }
    }
}
