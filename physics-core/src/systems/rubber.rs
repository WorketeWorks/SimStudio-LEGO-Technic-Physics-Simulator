use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::math::clamp_length;
use crate::model::RubberBandConfig;

/// Elastic links pull but never push. Nodes remain independent colliders.
pub struct RubberBand {
    nodes: Vec<RigidBodyHandle>,
    segment_rest_length: f32,
    max_segment_length: f32,
    segment_stiffness: f32,
    segment_damping: f32,
}

pub fn build(configs: &[RubberBandConfig], ids: &HashMap<u32, RigidBodyHandle>) -> Vec<RubberBand> {
    configs.iter().filter_map(|config| {
        let nodes: Vec<_> = config.node_ids.iter().filter_map(|id| ids.get(id).copied()).collect();
        (nodes.len() >= 3).then(|| {
            let count = nodes.len() as f32;
            RubberBand {
                nodes,
                segment_rest_length: config.rest_length.max(0.01) / count,
                // This is a one-way safety limit, not a rigid connection:
                // links can still compress and the spring remains elastic.
                // It prevents a stretched link becoming a hole in the collider chain.
                max_segment_length: config.rest_length.max(0.01) * 1.1 / count,
                // Springs in series divide their effective stiffness. Scale each
                // link so the configured value describes the complete loop.
                segment_stiffness: config.stiffness.max(0.0) * count,
                segment_damping: config.damping.max(0.0) * count,
            }
        })
    }).collect()
}

/// Keep adjacent collision nodes close enough that the band cannot open a gap
/// and tunnel through another part while it is under tension.
pub fn limit_stretch(bands: &[RubberBand], world: &mut PhysicsWorld, dt: f32) {
    for band in bands {
        for index in 0..band.nodes.len() {
            let a = band.nodes[index];
            let b = band.nodes[(index + 1) % band.nodes.len()];
            let (delta, relative_velocity, left_fixed, right_fixed, left_mass, right_mass) = {
                let (Some(left), Some(right)) = (world.bodies.get(a), world.bodies.get(b)) else {
                    continue;
                };
                (
                    right.translation() - left.translation(),
                    right.linvel() - left.linvel(),
                    left.is_fixed(),
                    right.is_fixed(),
                    left.mass(),
                    right.mass(),
                )
            };
            let length = delta.length();
            if length < 1.0e-5 { continue; }
            let direction = delta / length;
            let separation_speed = relative_velocity.dot(direction);
            let correction_speed =
                ((length - band.max_segment_length).max(0.0) / dt.max(1.0e-5)) * 0.35;
            let speed_to_remove = (separation_speed + correction_speed).max(0.0);
            if speed_to_remove <= 0.0 { continue; }
            let left_inverse_mass = if left_fixed { 0.0 } else { 1.0 / left_mass.max(1.0e-6) };
            let right_inverse_mass = if right_fixed { 0.0 } else { 1.0 / right_mass.max(1.0e-6) };
            let inverse_mass = left_inverse_mass + right_inverse_mass;
            if inverse_mass <= 0.0 { continue; }
            let impulse = direction * (speed_to_remove / inverse_mass);
            if !left_fixed {
                if let Some(left) = world.bodies.get_mut(a) {
                    left.apply_impulse(impulse, true);
                }
            }
            if !right_fixed {
                if let Some(right) = world.bodies.get_mut(b) {
                    right.apply_impulse(-impulse, true);
                }
            }
        }
    }
}

pub fn apply(bands: &[RubberBand], world: &mut PhysicsWorld, dt: f32) {
    for band in bands {
        for index in 0..band.nodes.len() {
            let a = band.nodes[index];
            let b = band.nodes[(index + 1) % band.nodes.len()];
            let (delta, relative_speed, node_mass) = match (world.bodies.get(a), world.bodies.get(b)) {
                (Some(left), Some(right)) => {
                    let delta = right.translation() - left.translation();
                    (
                        delta,
                        (right.linvel() - left.linvel()).dot(delta.normalize_or_zero()),
                        left.mass().min(right.mass()).max(1.0e-6),
                    )
                }
                _ => continue,
            };
            let length = delta.length();
            if length <= band.segment_rest_length || length < 1.0e-5 { continue; }
            let tension = ((length - band.segment_rest_length) * band.segment_stiffness
                + relative_speed * band.segment_damping)
                .max(0.0);
            // A rubber node is deliberately light. The old 2.0 impulse cap
            // could add 166 m/s in one substep, so a single contact with a
            // LEGO part injected enough energy to tear the loop apart.
            let impulse = clamp_length(delta / length * tension * dt, node_mass * 0.18);
            if let Some(left) = world.bodies.get_mut(a) { left.apply_impulse(impulse, true); }
            if let Some(right) = world.bodies.get_mut(b) { right.apply_impulse(-impulse, true); }
        }
    }
}
