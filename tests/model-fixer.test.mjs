import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  latticeRotations,
  snapToLattice,
  seatingCorrection,
  applySeat,
  distanceToLine,
  motorSpinKeys,
} from "../app/model-fixer.ts";
import { subpartConnectors, classifySubpart, mergeSubpartConnectors } from "../app/ldraw-subparts.ts";

test("lattice has 24 rotations and snaps near-misses only", () => {
  assert.equal(latticeRotations().length, 24);
  const near = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(91.5));
  const snapped = snapToLattice(near, 3);
  assert.ok(snapped);
  assert.ok(Math.abs(snapped.dot(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2))) > 0.9999);
  const far = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(45));
  assert.equal(snapToLattice(far, 3), undefined);
  assert.equal(snapToLattice(new THREE.Quaternion(), 3), undefined);
});

test("seating turns the axis parallel and centres on the target axis", () => {
  const object = new THREE.Object3D();
  object.position.set(1, 0.2, 0);
  object.updateMatrixWorld(true);
  const point = new THREE.Vector3(1, 0.2, 0),
    axis = new THREE.Vector3(0.05, 1, 0).normalize(),
    seat = seatingCorrection(point, axis, new THREE.Vector3(1.1, 5, 0), new THREE.Vector3(0, 1, 0), true);
  applySeat(object, seat, point);
  const newAxis = axis.clone().applyQuaternion(object.quaternion);
  assert.ok(newAxis.dot(new THREE.Vector3(0, 1, 0)) > 0.99999);
  assert.ok(Math.abs(object.position.x - 1.1) < 1e-6);
  assert.ok(Math.abs(object.position.y - 0.2) < 1e-6, "sliding keeps the axial position");
});

test("distanceToLine and motor spins", () => {
  assert.ok(Math.abs(distanceToLine(new THREE.Vector3(3, 4, 0), new THREE.Vector3(), new THREE.Vector3(1, 0, 0)) - 4) < 1e-9);
  const keys = motorSpinKeys([0, 1, 0], Math.PI, 4);
  assert.equal(keys.length, 2);
  assert.ok(Math.abs(keys[1].r[1] - 720) < 1e-6);
  assert.ok(motorSpinKeys([0, 1, 0], -0.01, 2)[1].r[1] < 0);
});

test("sub-part holes become connectors and are merged without duplicates", () => {
  assert.equal(classifySubpart("s/connhole.dat"), "hit");
  assert.equal(classifySubpart("4-4cyli.dat"), "skip");
  assert.equal(classifySubpart("3001s01.dat"), "walk");
  // connhole at LDraw (20, 0, 0) pointing along +Y, and a duplicate of it.
  const m = (x, y, z, flip = 1) => [1, 0, 0, 0, 0, flip, 0, 0, 0, 0, flip, 0, x, y, z, 1];
  const found = subpartConnectors([
    { fileName: "connhole.dat", matrix: m(20, 0, 0) },
    { fileName: "connhole.dat", matrix: m(20, 0, 0) },
    { fileName: "axlehole.dat", matrix: m(0, 0, 0) },
  ]);
  assert.equal(found.length, 2);
  assert.deepEqual(found[0].local.map((v) => +v.toFixed(3)), [1, -0, -0].map((v) => +v.toFixed(3)));
  assert.equal(found[1].kind, "axle");
  const existing = [{ local: new THREE.Vector3(1, 0, 0), axis: new THREE.Vector3(0, 1, 0) }];
  assert.equal(mergeSubpartConnectors(existing, found).length, 1);
  // Two facing peg-hole ends 1 stud apart make one through hole.
  const pair = subpartConnectors([
    { fileName: "peghole.dat", matrix: m(0, -10, 0) },
    { fileName: "peghole.dat", matrix: m(0, 10, 0, -1) },
  ]);
  assert.equal(pair.length, 1);
  assert.ok(Math.abs(pair[0].length - 1) < 1e-6);
});
