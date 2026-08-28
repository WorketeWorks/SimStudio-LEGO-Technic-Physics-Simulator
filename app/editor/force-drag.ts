import * as THREE from "three";

/** Keeps pointer-force depth fixed to the camera-facing plane captured on click. */
export const forceDragTarget = (ray: THREE.Ray, plane: THREE.Plane) =>
  ray.intersectPlane(plane, new THREE.Vector3()) ?? undefined;
