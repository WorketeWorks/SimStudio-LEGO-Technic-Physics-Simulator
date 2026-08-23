use std::collections::HashMap;

use rapier3d::prelude::*;

use crate::model::RubberBandConfig;

/// Elastic links pull but never push. Nodes remain independent colliders.
pub struct RubberBand {
    nodes: Vec<RigidBodyHandle>,
    segment_rest_length: f32,
    max_segment_length: f32,
    segment_stiffness: f32,
    damping_ratio: f32,
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
                // All supported belts use the same 1.6 mm section. Keep the
                // particle colliders overlapping without imposing an extra
                // global length constraint on an already stretched route.
                max_segment_length: 0.18,
                // Springs in series divide their effective stiffness. Scale each
                // link so the configured value describes the complete loop.
                segment_stiffness: config.stiffness.max(0.0) * count,
                // Treat damping as a ratio of critical damping. A fixed
                // N*s/m value is not stable here because every belt node is
                // deliberately very light and the number of nodes varies.
                damping_ratio: config.damping.clamp(0.0, 2.0),
            }
        })
    }).collect()
}

/// LEGO rubber is much lighter than the rigid parts it wraps around. At the
/// editor's scale full gravity drops a newly placed loop to the floor before
/// its tension can reach those parts.
pub fn configure_bodies(bands: &[RubberBand], world: &mut PhysicsWorld) {
    for band in bands {
        for handle in &band.nodes {
            if let Some(body) = world.bodies.get_mut(*handle) {
                body.set_gravity_scale(0.12, true);
            }
        }
    }
}

pub fn apply(bands: &[RubberBand], world: &mut PhysicsWorld, dt: f32) {
    for band in bands {
        for index in 0..band.nodes.len() {
            let a = band.nodes[index];
            let b = band.nodes[(index + 1) % band.nodes.len()];
            let (delta, relative_speed, left_fixed, right_fixed, left_mass, right_mass) =
                match (world.bodies.get(a), world.bodies.get(b)) {
                (Some(left), Some(right)) => {
                    let delta = right.translation() - left.translation();
                    (
                        delta,
                        (right.linvel() - left.linvel()).dot(delta.normalize_or_zero()),
                        left.is_fixed(),
                        right.is_fixed(),
                        left.mass(),
                        right.mass(),
                    )
                }
                _ => continue,
            };
            let length = delta.length();
            if length <= band.segment_rest_length || length < 1.0e-5 { continue; }
            let left_inverse_mass = if left_fixed { 0.0 } else { 1.0 / left_mass.max(1.0e-6) };
            let right_inverse_mass = if right_fixed { 0.0 } else { 1.0 / right_mass.max(1.0e-6) };
            let inverse_mass = left_inverse_mass + right_inverse_mass;
            if inverse_mass <= 0.0 { continue; }

            // Backward-Euler spring impulse. The previous explicit force used
            // F*dt directly on sub-gram particles; one step could add over
            // 70 u/s and the global 12 u/s clamp then created the permanent
            // oscillation seen in logs 60/61. This solves the future velocity
            // analytically, so stiffness remains forceful without adding
            // numerical energy. Critical damping is derived from the actual
            // pair mass and therefore works with any sampling density.
            let stiffness_scale = if length > band.max_segment_length { 8.0 } else { 1.0 };
            let stiffness = band.segment_stiffness * stiffness_scale;
            let effective_mass = 1.0 / inverse_mass;
            let damping = 2.0 * band.damping_ratio * (stiffness * effective_mass).sqrt();
            let extension = length - band.segment_rest_length;
            let numerator = dt
                * (stiffness * extension + (damping + stiffness * dt) * relative_speed);
            let denominator = 1.0 + inverse_mass * dt * (damping + stiffness * dt);
            let impulse_magnitude = (numerator / denominator).max(0.0);
            if impulse_magnitude <= 0.0 { continue; }
            let impulse = delta / length * impulse_magnitude;
            if !left_fixed {
                if let Some(left) = world.bodies.get_mut(a) { left.apply_impulse(impulse, true); }
            }
            if !right_fixed {
                if let Some(right) = world.bodies.get_mut(b) { right.apply_impulse(-impulse, true); }
            }
        }
    }
}
