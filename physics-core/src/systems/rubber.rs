use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::math::clamp_length;
use crate::model::RubberBandConfig;

/// Elastic links pull but never push. Nodes remain independent colliders.
pub struct RubberBand {
    nodes: Vec<RigidBodyHandle>,
    segment_rest_length: f32,
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
                // Springs in series divide their effective stiffness. Scale each
                // link so the configured value describes the complete loop.
                segment_stiffness: config.stiffness.max(0.0) * count,
                segment_damping: config.damping.max(0.0) * count,
            }
        })
    }).collect()
}

pub fn apply(bands: &[RubberBand], world: &mut PhysicsWorld, dt: f32) {
    for band in bands {
        for index in 0..band.nodes.len() {
            let a = band.nodes[index];
            let b = band.nodes[(index + 1) % band.nodes.len()];
            let (delta, relative_speed) = match (world.bodies.get(a), world.bodies.get(b)) {
                (Some(left), Some(right)) => {
                    let delta = right.translation() - left.translation();
                    (delta, (right.linvel() - left.linvel()).dot(delta.normalize_or_zero()))
                }
                _ => continue,
            };
            let length = delta.length();
            if length <= band.segment_rest_length || length < 1.0e-5 { continue; }
            let tension = ((length - band.segment_rest_length) * band.segment_stiffness
                + relative_speed * band.segment_damping)
                .max(0.0);
            let impulse = clamp_length(delta / length * tension * dt, 2.0);
            if let Some(left) = world.bodies.get_mut(a) { left.apply_impulse(impulse, true); }
            if let Some(right) = world.bodies.get_mut(b) { right.apply_impulse(-impulse, true); }
        }
    }
}
