import * as THREE from "three";

/**
 * LDrawLoader keeps many type-1 subfile transforms in matrixWorld while the
 * corresponding local Object3D matrices remain identity. Object3D.toJSON()
 * only serializes local transforms, and cloning that hierarchy can therefore
 * collapse repeated teeth/subparts onto one another.
 *
 * Flatten renderable objects into the root coordinate system while preserving
 * the exact affine matrix (including reflections and shear). Keeping the
 * matrix instead of decomposing it is important for BFC mirrored subfiles:
 * Three.js uses the matrix determinant to select the correct front face.
 */
/**
 * With `tagSubparts`, every renderable that lives inside a separate sub-part
 * group (the LDraw loader keeps those apart when `separateSubparts` is on)
 * gets `userData.sub = "<index>:<file>"`, so the editor can animate that
 * sub-part on its own (a motor rotor, a shaft...).
 */
export function flattenLDrawRenderables(source: THREE.Object3D, tagSubparts = false) {
  source.updateMatrixWorld(true);
  // The model is usually a one-line wrapper around the real part file.
  let partRoot: THREE.Object3D = source;
  for (let depth = 0; depth < 4; depth++) {
    const groups = partRoot.children.filter((child) => child.type === "Group"),
      direct = partRoot.children.some(
        (child) => child instanceof THREE.Mesh || child instanceof THREE.Line,
      );
    if (groups.length === 1 && !direct) partRoot = groups[0];
    else break;
  }
  const flattened = new THREE.Group(),
    inverseRoot = source.matrixWorld.clone().invert();
  flattened.name = source.name;
  flattened.userData = structuredClone(source.userData);

  source.traverse((object) => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Line))
      return;
    const renderable = object.clone(false),
      relativeMatrix = inverseRoot.clone().multiply(object.matrixWorld);
    if (tagSubparts) {
      let node: THREE.Object3D = object;
      while (node.parent && node.parent !== partRoot) node = node.parent;
      if (node !== object && node.parent === partRoot) {
        const file = (node.name || String(node.userData.fileName ?? "sub"))
          .replace(/\\/g, "/")
          .split("/")
          .pop()!;
        renderable.userData = { ...renderable.userData, sub: `${partRoot.children.indexOf(node)}:${file}` };
      }
    }
    renderable.matrixAutoUpdate = false;
    renderable.matrix.copy(relativeMatrix);
    renderable.matrixWorld.copy(relativeMatrix);
    flattened.add(renderable);
  });
  flattened.updateMatrixWorld(true);
  return flattened;
}
