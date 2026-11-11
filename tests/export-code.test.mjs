import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import { animationModule } from "../app/export-code.ts";
import { sampleTrack } from "../app/animation.ts";

const keys = [
  { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "easeInOut" },
  { t: 2, p: [1, 2, 0], r: [0, 90, 0], e: "linear" },
  { t: 4, p: [0, 0, 3], r: [0, 270, 0], e: "step" },
  { t: 5, p: [0, 0, 0], r: [0, 0, 0], e: "linear" },
];

test("generated animation module matches the editor sampler", async () => {
  const code = animationModule({
    duration: 5, loop: true, fps: 30, file: "m.glb",
    tracks: [{ node: "Group_Arm", kind: "group", label: "Arm", keys }],
  });
  const dir = mkdtempSync(join(tmpdir(), "anim-"));
  // resolve "three" from the repo
  const file = join(process.cwd(), `.tmp-animation-${process.pid}.mjs`);
  writeFileSync(file, code);
  const mod = await import(pathToFileURL(file).href);
  const root = new THREE.Group();
  const node = new THREE.Group();
  node.name = "Group_Arm";
  node.position.set(3, 1, 2);
  root.add(node);
  const animator = mod.createAnimator(root);
  for (const t of [0, 0.7, 1.5, 2, 3.1, 4.2, 5]) {
    animator.setTime(t);
    const want = sampleTrack({ id: "x", target: { kind: "group", id: "g" }, keys }, t);
    assert.ok(Math.abs(node.position.x - (3 + want.p.x)) < 1e-4, `x@${t}`);
    assert.ok(Math.abs(node.position.z - (2 + want.p.z)) < 1e-4, `z@${t}`);
    assert.ok(Math.abs(node.quaternion.angleTo(want.q)) < 1e-4, `q@${t}`);
  }
  const clip = mod.createClip(root);
  assert.equal(clip.tracks.length, 2);
  assert.equal(clip.duration, 5);
  (await import("node:fs")).unlinkSync(file);
});
