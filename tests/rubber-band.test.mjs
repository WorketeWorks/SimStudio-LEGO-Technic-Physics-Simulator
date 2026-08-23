import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import { sampleRubberBand } from "../app/physics/rubber-band.ts";

test("capped rubber sampling keeps the complete loop uniformly represented", () => {
  const guides = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(10, 0, 10),
    new THREE.Vector3(0, 0, 10),
  ];
  const nodes = sampleRubberBand(guides, 0, 12);
  const gaps = nodes.map((node, index) =>
    node.distanceTo(nodes[(index + 1) % nodes.length]),
  );
  assert.equal(nodes.length, 12);
  assert.ok(Math.max(...gaps) < 3.34, `loop contains a truncated jump: ${gaps}`);
  assert.ok(nodes.some((node) => node.equals(guides[2])), "sampling must reach the far side");
});
