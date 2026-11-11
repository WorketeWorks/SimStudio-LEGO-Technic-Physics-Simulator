import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createGroup } from "../app/animation-runtime.ts";
import { sanitizeAnimation, spinKeys } from "../app/animation.ts";
import { buildExportScene, exportGLB, exampleViewerHtml, usageSnippet } from "../app/export-gltf.ts";

// GLTFExporter needs FileReader (browser API).
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((r) => { this.result = "data:application/octet-stream;base64," + Buffer.from(r).toString("base64"); this.onloadend?.(); }); }
};

const makePiece = (id, part, color, x, { mirror = false } = {}) => {
  const mesh = new THREE.Group();
  mesh.position.set(x, 0, 0);
  // Same shape as the editor: LDraw model flipped and scaled by prepareModel().
  const model = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color });
  const box = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 40).toNonIndexed(), material);
  box.scale.x = mirror ? -1 : 1;
  model.add(box);
  model.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]), new THREE.LineBasicMaterial()));
  model.rotation.x = Math.PI; model.scale.setScalar(0.05);
  mesh.add(model);
  mesh.updateMatrixWorld(true);
  return { id, part, name: `Part ${part}`, color, mesh };
};

const parse = (glb) => new Promise((resolve, reject) => new GLTFLoader().parse(glb, "", resolve, reject));

test("groups, shared meshes and the animation survive a GLB round trip", async () => {
  const pieces = [makePiece(1, "3713", 4, 0), makePiece(2, "3713", 4, 2), makePiece(3, "3713", 4, 4), makePiece(4, "99999", 1, 6)];
  const groups = [];
  const wheel = createGroup([pieces[0], pieces[1]], groups, "Front wheel");
  const animation = sanitizeAnimation({ duration: 2, tracks: [
    { id: "a", target: { kind: "group", id: wheel.id }, keys: spinKeys([0, 0, 1], 1, 2) },
    { id: "b", target: { kind: "piece", id: "3" }, keys: [
      { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "easeInOut" }, { t: 1, p: [0, 3, 0], r: [0, 0, 0], e: "linear" } ] },
  ]});
  const result = await exportGLB({ pieces, groups, animation }, { units: "studs", animation: true, outlines: false });
  assert.equal(result.stats.parts, 4);
  assert.equal(result.stats.groups, 1);
  assert.equal(result.stats.uniqueMeshes, 2, "three identical parts share one geometry");
  assert.equal(result.stats.tracks, 2);
  assert.ok(result.stats.bytes < 9000, `tiny file, got ${result.stats.bytes}`);
  assert.ok(result.stats.vertices <= 48, "vertices are welded/indexed");

  const gltf = await parse(result.glb);
  const group = gltf.scene.getObjectByName(result.groupNames[0].node);
  assert.ok(group, "group node exists");
  assert.equal(group.children.length, 2, "group keeps its parts as children");
  near(group.position.x, 1); // pivot = centre of the two parts
  near(group.children[0].position.x, -1);
  assert.equal(gltf.animations.length, 1);
  assert.equal(gltf.animations[0].name, "BrickReel");
  assert.equal(gltf.animations[0].tracks.length, 4);
  const spin = gltf.animations[0].tracks.find((t) => t.name.startsWith(group.name) && t.name.endsWith("quaternion"));
  assert.ok(spin.times.length >= 9);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  mixer.clipAction(gltf.animations[0]).play();
  mixer.setTime(1); // half a turn about Z through the pivot
  gltf.scene.updateMatrixWorld(true);
  const world = group.children[0].getWorldPosition(new THREE.Vector3());
  near(world.x, 2); near(world.y, 0);
  const lifted = gltf.scene.getObjectByName(`3713_3`);
  near(lifted.position.y, 3);
  assert.equal(group.children[0].userData.simStudio?.part ?? "3713", "3713");
  assert.equal(gltf.scene.children[0].userData.simStudio.generator, "BrickReel");
  assert.match(usageSnippet(result, "model.glb"), /AnimationMixer/);
  assert.match(exampleViewerHtml("model.glb", true), /GLTFLoader/);
});

test("meters option scales the root and mirrored parts keep outward faces", async () => {
  const flipped = makePiece(1, "6538", 2, 0, { mirror: true }), normal = makePiece(2, "6538", 2, 5);
  const { root } = buildExportScene({ pieces: [flipped], groups: [], animation: sanitizeAnimation({}) }, { units: "meters", animation: false, outlines: false });
  near(root.scale.x, 0.008);
  const geometry = root.getObjectByProperty("isMesh", true).geometry;
  const p = geometry.getAttribute("position"), index = geometry.index;
  let inward = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    a.fromBufferAttribute(p, index.getX(i)); b.fromBufferAttribute(p, index.getX(i + 1)); c.fromBufferAttribute(p, index.getX(i + 2));
    const n = b.clone().sub(a).cross(c.clone().sub(a)), centre = a.clone().add(b).add(c).divideScalar(3);
    if (n.dot(centre) < 0) inward++;
  }
  assert.equal(inward, 0, "every triangle faces away from the centre of the box");
  void normal;
});

test("outlines are optional and add geometry", async () => {
  const pieces = [makePiece(1, "1", 4, 0)];
  const base = { pieces, groups: [], animation: sanitizeAnimation({}) };
  const without = await exportGLB(base, { units: "studs", animation: false, outlines: false });
  const withLines = await exportGLB(base, { units: "studs", animation: false, outlines: true });
  assert.ok(withLines.stats.bytes > without.stats.bytes);
});

function near(a, b, eps = 1e-4) { assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`); }
