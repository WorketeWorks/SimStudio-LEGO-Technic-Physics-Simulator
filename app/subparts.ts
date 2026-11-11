/**
 * Sub-part animation: moves one LDraw sub-part (a motor rotor, a shaft...) of a
 * piece while the rest of the piece stays put, even if the piece is in a group.
 *
 * The LDraw worker tags every renderable of a separate sub-part with
 * `userData.sub`. A sub-part pose is expressed in the PIECE's local frame
 * (studs): a rotation vector about the sub-part's centre plus an offset, exactly
 * like group tracks use a pivot. The original matrices are remembered so the
 * model is never modified by the preview.
 */
import * as THREE from "three";
import type { Vec3 } from "./animation.ts";

export type SubInfo = { key: string; label: string; objects: THREE.Object3D[] };

const REST = new WeakMap<THREE.Object3D, THREE.Matrix4>();
const TOUCHED = new Set<THREE.Object3D>();
const PIVOTS = new WeakMap<THREE.Object3D, Map<string, Vec3>>();

export const SUB_SEPARATOR = "|";
export const subTargetId = (pieceId: string | number, key: string) =>
  `${pieceId}${SUB_SEPARATOR}${key}`;
export const splitSubTargetId = (id: string) => {
  const at = id.indexOf(SUB_SEPARATOR);
  return at < 0 ? { pieceId: id, key: "" } : { pieceId: id.slice(0, at), key: id.slice(at + 1) };
};

const prettyLabel = (key: string, duplicates: number) => {
  const name = key.slice(key.indexOf(":") + 1).replace(/\.dat$/i, "");
  return duplicates > 1 ? `${name} #${key.slice(0, key.indexOf(":"))}` : name;
};

/** Sub-parts of a piece (empty when the part was not loaded with sub-parts split). */
export function listSubparts(root: THREE.Object3D): SubInfo[] {
  const byKey = new Map<string, THREE.Object3D[]>();
  root.traverse((object) => {
    const key = object.userData?.sub;
    if (typeof key !== "string") return;
    const list = byKey.get(key) ?? [];
    list.push(object);
    byKey.set(key, list);
  });
  const names = new Map<string, number>();
  byKey.forEach((_, key) => {
    const name = key.slice(key.indexOf(":") + 1);
    names.set(name, (names.get(name) ?? 0) + 1);
  });
  return [...byKey.entries()].map(([key, objects]) => ({
    key,
    label: prettyLabel(key, names.get(key.slice(key.indexOf(":") + 1)) ?? 1),
    objects,
  }));
}

const restMatrix = (object: THREE.Object3D) => {
  let rest = REST.get(object);
  if (!rest) {
    if (!object.matrixAutoUpdate === false) object.updateMatrix();
    rest = object.matrix.clone();
    REST.set(object, rest);
  }
  return rest;
};

/** Product of the local matrices between `root` (excluded) and `object.parent`. */
const parentChain = (object: THREE.Object3D, root: THREE.Object3D) => {
  const chain = new THREE.Matrix4();
  const parents: THREE.Object3D[] = [];
  for (let node = object.parent; node && node !== root; node = node.parent) parents.push(node);
  for (let i = parents.length - 1; i >= 0; i--) {
    if (parents[i].matrixAutoUpdate) parents[i].updateMatrix();
    chain.multiply(parents[i].matrix);
  }
  return chain;
};

/** Centre of the sub-part's bounds in the piece's local frame (rest pose). */
export function subPivot(root: THREE.Object3D, info: SubInfo): Vec3 {
  let cache = PIVOTS.get(root);
  if (!cache) PIVOTS.set(root, (cache = new Map()));
  const cached = cache.get(info.key);
  if (cached) return cached;
  const box = new THREE.Box3(),
    part = new THREE.Box3();
  for (const object of info.objects) {
    const geometry = (object as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!geometry) continue;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingBox) continue;
    const matrix = parentChain(object, root).multiply(restMatrix(object));
    part.copy(geometry.boundingBox).applyMatrix4(matrix);
    box.union(part);
  }
  const centre = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3()),
    pivot: Vec3 = [centre.x, centre.y, centre.z];
  cache.set(info.key, pivot);
  return pivot;
}

/**
 * Poses one sub-part. `offset` (studs) and `rotation` (quaternion) are relative
 * to the rest pose, in the piece's local frame, rotating about `pivot`.
 */
export function poseSubpart(
  root: THREE.Object3D,
  info: SubInfo,
  pivot: Vec3,
  offset: THREE.Vector3,
  rotation: THREE.Quaternion,
) {
  const pivotVector = new THREE.Vector3().fromArray(pivot),
    delta = new THREE.Matrix4()
      .makeTranslation(pivotVector.x + offset.x, pivotVector.y + offset.y, pivotVector.z + offset.z)
      .multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation))
      .multiply(new THREE.Matrix4().makeTranslation(-pivotVector.x, -pivotVector.y, -pivotVector.z));
  for (const object of info.objects) {
    const chain = parentChain(object, root),
      local = chain.clone().invert().multiply(delta).multiply(chain).multiply(restMatrix(object));
    object.matrixAutoUpdate = false;
    object.matrix.copy(local);
    object.matrixWorldNeedsUpdate = true;
    TOUCHED.add(object);
  }
}

/** Puts every posed sub-part back to its original matrix. */
export function restoreSubparts() {
  TOUCHED.forEach((object) => {
    const rest = REST.get(object);
    if (rest) {
      object.matrix.copy(rest);
      object.matrixWorldNeedsUpdate = true;
    }
  });
  TOUCHED.clear();
}
