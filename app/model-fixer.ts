/**
 * Geometry helpers for the model fixer: rotation clean-up, seating one part on
 * another through a pair of connectors, and turning legacy motor joints into
 * animation spins. Pure functions (THREE maths only) so they can be tested.
 */
import * as THREE from "three";
import type { Keyframe } from "./animation.ts";
import { spinKeys, type Vec3 } from "./animation.ts";

let lattice: THREE.Quaternion[] | undefined;

/** The 24 proper rotations that map the axes onto themselves. */
export function latticeRotations() {
  if (lattice) return lattice;
  const found: THREE.Quaternion[] = [],
    axes = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
  for (const x of axes)
    for (const y of axes) {
      if (Math.abs(x.dot(y)) > 0.5) continue;
      const z = new THREE.Vector3().crossVectors(x, y),
        q = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(x, y, z),
        );
      if (!found.some((other) => Math.abs(other.dot(q)) > 0.9999)) found.push(q);
    }
  lattice = found;
  return found;
}

/** Nearest lattice rotation if `q` is within `toleranceDegrees` of it (and not already exact). */
export function snapToLattice(q: THREE.Quaternion, toleranceDegrees: number) {
  let best: THREE.Quaternion | undefined,
    bestAngle = Infinity;
  for (const candidate of latticeRotations()) {
    const angle = 2 * Math.acos(Math.min(1, Math.abs(candidate.dot(q))));
    if (angle < bestAngle) {
      bestAngle = angle;
      best = candidate;
    }
  }
  const degrees = THREE.MathUtils.radToDeg(bestAngle);
  return best && degrees > 1e-3 && degrees <= toleranceDegrees ? best.clone() : undefined;
}

export type Seat = { rotation: THREE.Quaternion; translation: THREE.Vector3 };

/**
 * Rigid correction that seats the mover's connector (point + axis, world) onto
 * the target's: its axis is turned parallel to the target axis (about the
 * connector point) and its centre moved onto the target axis. Motion along the
 * axis is kept when `keepAlong` (sliding joints) or closed when not.
 */
export function seatingCorrection(
  moverPoint: THREE.Vector3,
  moverAxis: THREE.Vector3,
  targetPoint: THREE.Vector3,
  targetAxis: THREE.Vector3,
  keepAlong: boolean,
): Seat {
  const desired = targetAxis.clone().normalize();
  if (moverAxis.dot(desired) < 0) desired.negate();
  const rotation = new THREE.Quaternion().setFromUnitVectors(
      moverAxis.clone().normalize(),
      desired,
    ),
    delta = targetPoint.clone().sub(moverPoint);
  if (keepAlong) delta.addScaledVector(desired, -delta.dot(desired));
  return { rotation, translation: delta };
}

/** Applies a seating correction to an Object3D (rotation about `pivot`). */
export function applySeat(object: THREE.Object3D, seat: Seat, pivot: THREE.Vector3) {
  object.position
    .sub(pivot)
    .applyQuaternion(seat.rotation)
    .add(pivot)
    .add(seat.translation);
  object.quaternion.premultiply(seat.rotation);
  object.updateMatrixWorld(true);
}

/** Distance from `point` to the infinite line through `origin` along `axis`. */
export function distanceToLine(point: THREE.Vector3, origin: THREE.Vector3, axis: THREE.Vector3) {
  const d = point.clone().sub(origin),
    unit = axis.clone().normalize();
  return d.addScaledVector(unit, -d.dot(unit)).length();
}

/**
 * Keys for a legacy motor joint: `speed` rad/s over `duration` seconds becomes a
 * whole number of turns (at least one) so the loop is seamless.
 */
export function motorSpinKeys(axis: Vec3, speedRadPerSecond: number, duration: number): Keyframe[] {
  const turns = (speedRadPerSecond * duration) / (Math.PI * 2),
    whole = Math.sign(turns || 1) * Math.max(1, Math.round(Math.abs(turns)));
  return spinKeys(axis, whole, duration);
}
