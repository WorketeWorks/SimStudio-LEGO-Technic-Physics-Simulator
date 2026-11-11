import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { defaultStlSettings, prepareStlGeometry, stlStats, volumeCentroid } from "../app/stl-import.ts";

const near = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
// 16 x 16 x 24 mm block (Z up) whose corner sits at the file origin.
const block = () => new THREE.BoxGeometry(16, 16, 24).toNonIndexed().translate(8, 8, 12);

test("units, up axis and origin presets", () => {
  const s = { ...defaultStlSettings() };
  let g = prepareStlGeometry(block(), s); // mm, Z-up, centre-bottom
  let st = stlStats(g);
  near(st.studs[0], 2); near(st.studs[1], 3); near(st.studs[2], 2); // 16/8, 24/8 high after Z->Y
  near(g.boundingBox.min.y, 0); near(g.boundingBox.min.x, -1); near(g.boundingBox.max.z, 1);
  g = prepareStlGeometry(block(), { ...s, origin: "center" });
  near(g.boundingBox.min.y, -1.5); near(g.boundingBox.max.y, 1.5);
  g = prepareStlGeometry(block(), { ...s, origin: "top" });
  near(g.boundingBox.max.y, 0);
  g = prepareStlGeometry(block(), { ...s, origin: "file" });
  near(g.boundingBox.min.x, 1 - 1 - 1 + 1 - 0); // min x stays 8-8 = 0 mm -> 0 studs
  near(g.boundingBox.min.y, 0);
  g = prepareStlGeometry(block(), { ...s, origin: "mass" });
  near(g.boundingBox.min.y, -1.5); near(g.boundingBox.min.x, -1); // box: mass centre = centre
});

test("scale, fit, rotation and offset", () => {
  const s = defaultStlSettings();
  near(stlStats(prepareStlGeometry(block(), { ...s, percent: 200 })).studs[1], 6);
  near(Math.max(...stlStats(prepareStlGeometry(block(), { ...s, unit: "fit", fitStuds: 12 })).studs), 12);
  const turned = prepareStlGeometry(block(), { ...s, rotate: [90, 0, 0] }); // tall block lies down
  near(stlStats(turned).studs[1], 2);
  const moved = prepareStlGeometry(block(), { ...s, origin: "center", offset: [0, 2, 0] });
  near(moved.boundingBox.min.y, 0.5);
});

test("volume centroid of an off-centre solid", () => {
  const g = new THREE.BoxGeometry(2, 2, 2).toNonIndexed().translate(5, 1, -3);
  const c = volumeCentroid(g);
  near(c.x, 5); near(c.y, 1); near(c.z, -3);
});
