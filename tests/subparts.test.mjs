import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { applyPose, captureRest, restoreRest, createGroup } from "../app/animation-runtime.ts";
import { sanitizeAnimation } from "../app/animation.ts";
import { exportGLB } from "../app/export-gltf.ts";
import { listSubparts, subPivot, subTargetId } from "../app/subparts.ts";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((r) => { this.result = "data:application/octet-stream;base64," + Buffer.from(r).toString("base64"); this.onloadend?.(); }); }
};
const near = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

// A motor: a body box at x=-20 LDU and a long rotor box at x=+40 LDU (a tagged sub-part).
const motor = (id, x) => {
  const mesh = new THREE.Group();
  mesh.position.set(x, 0, 0);
  const model = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const put = (geometry, lx, sub) => {
    const object = new THREE.Mesh(geometry.toNonIndexed(), material);
    object.matrixAutoUpdate = false;
    object.matrix.makeTranslation(lx, 0, 0);
    if (sub) object.userData.sub = sub;
    model.add(object);
    return object;
  };
  const body = put(new THREE.BoxGeometry(40, 40, 40), -20);
  const rotor = put(new THREE.BoxGeometry(40, 10, 10), 40, "0:rotor.dat");
  model.rotation.x = Math.PI;
  model.scale.setScalar(0.05);
  mesh.add(model);
  mesh.updateMatrixWorld(true);
  return { id, part: "motor", name: "Motor", color: 4, mesh, body, rotor };
};

test("a sub-part turns about its own centre while the rest of the piece stays", () => {
  const piece = motor(1, 5);
  const [info] = listSubparts(piece.mesh);
  assert.equal(info.label, "rotor");
  const pivot = subPivot(piece.mesh, info);
  near(pivot[0], 2); near(pivot[1], 0); near(pivot[2], 0); // 40 LDU * 0.05 = 2 studs
  const rest = captureRest([piece]);
  const animation = sanitizeAnimation({ duration: 2, tracks: [{ id: "s", target: { kind: "sub", id: subTargetId(1, info.key) },
    keys: [{ t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "linear" }, { t: 2, p: [0, 1, 0], r: [0, 0, 90], e: "linear" }] }] });
  const rotorBox = () => new THREE.Box3().setFromObject(piece.rotor);
  const bodyBefore = new THREE.Box3().setFromObject(piece.body).getCenter(new THREE.Vector3());
  const before = rotorBox().getSize(new THREE.Vector3());
  near(before.x, 2); near(before.y, 0.5);
  applyPose([piece], rest, [], animation, 2);
  const size = rotorBox().getSize(new THREE.Vector3()), centre = rotorBox().getCenter(new THREE.Vector3());
  near(size.x, 0.5); near(size.y, 2); // 90 degrees about Z: long axis is now vertical
  near(centre.x, 5 + 2); near(centre.y, 1); // pivot (in the piece) + offset, piece itself at x=5
  const bodyAfter = new THREE.Box3().setFromObject(piece.body).getCenter(new THREE.Vector3());
  near(bodyAfter.x, bodyBefore.x); near(bodyAfter.y, bodyBefore.y);
  restoreRest(rest);
  near(rotorBox().getSize(new THREE.Vector3()).x, 2);
  near(rotorBox().getCenter(new THREE.Vector3()).y, 0);
});

test("a sub-part moves with its group and exports as its own animated node", async () => {
  const pieces = [motor(1, 0), motor(2, 6)];
  const groups = [];
  const arm = createGroup(pieces, groups, "Arm");
  const key = listSubparts(pieces[0].mesh)[0].key;
  const animation = sanitizeAnimation({ duration: 2, tracks: [
    { id: "g", target: { kind: "group", id: arm.id }, keys: [{ t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "linear" }, { t: 2, p: [0, 4, 0], r: [0, 0, 0], e: "linear" }] },
    { id: "s", target: { kind: "sub", id: subTargetId(1, key) }, keys: [{ t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "linear" }, { t: 2, p: [0, 0, 0], r: [0, 0, 180], e: "linear" }] },
  ] });
  const rest = captureRest(pieces);
  applyPose(pieces, rest, groups, animation, 2);
  const lifted = new THREE.Box3().setFromObject(pieces[0].rotor).getCenter(new THREE.Vector3());
  near(lifted.y, 4); // follows the group
  const spun = new THREE.Box3().setFromObject(pieces[0].rotor).getSize(new THREE.Vector3());
  near(spun.x, 2); // 180 degrees keeps the bar horizontal
  restoreRest(rest);

  const result = await exportGLB({ pieces, groups, animation }, { units: "studs", animation: true, outlines: false });
  assert.equal(result.stats.tracks, 2);
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(result.glb, "", resolve, reject));
  const sub = gltf.scene.getObjectByName("motor_1_Sub_rotor");
  assert.ok(sub, "sub-part node exists");
  near(sub.position.x, 2); // pivot, in the piece frame
  assert.equal(gltf.scene.getObjectByName("motor_2_Sub_rotor"), undefined, "the other motor stays one mesh");
  const mixer = new THREE.AnimationMixer(gltf.scene);
  mixer.clipAction(gltf.animations[0]).play();
  mixer.setTime(1); // 90 degrees about Z, group raised by 2
  gltf.scene.updateMatrixWorld(true);
  const bar = new THREE.Box3().setFromObject(sub);
  near(bar.getSize(new THREE.Vector3()).y, 2);
  near(bar.getCenter(new THREE.Vector3()).y, 2);
});
