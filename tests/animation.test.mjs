import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  bakeTrackTimes,
  buildNodeTracks,
  keyAt,
  sampleTrack,
  sanitizeAnimation,
  sanitizeGroups,
  spinKeys,
  upsertKey,
} from "../app/animation.ts";
import {
  applyPose,
  captureRest,
  createGroup,
  pruneGroupsAndTracks,
  restoreRest,
  ungroupPiece,
} from "../app/animation-runtime.ts";
import { editorAssemblyMembers } from "../app/editor-assembly.ts";

const piece = (id, x, y = 0, z = 0) => {
  const mesh = new THREE.Object3D();
  mesh.position.set(x, y, z);
  return { id, part: "x", mesh };
};
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test("sampleTrack interpolates and holds outside the key range", () => {
  const track = {
    id: "t",
    target: { kind: "group", id: "g" },
    keys: [
      { t: 1, p: [0, 0, 0], r: [0, 0, 0], e: "linear" },
      { t: 3, p: [4, 0, 0], r: [0, 180, 0], e: "linear" },
    ],
  };
  near(sampleTrack(track, 0).p.x, 0);
  near(sampleTrack(track, 2).p.x, 2);
  near(sampleTrack(track, 9).p.x, 4);
  const mid = sampleTrack(track, 2).q;
  const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  near(mid.angleTo(expected), 0, 1e-6);
});

test("a 720 degree spin survives with only two keys (rotation vector, not quaternion)", () => {
  const keys = spinKeys([0, 0, 1], 2, 4);
  const track = { id: "t", target: { kind: "group", id: "g" }, keys };
  const q = sampleTrack(track, 1).q; // 180 degrees about Z
  near(q.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)), 0);
  const quarter = sampleTrack(track, 0.5).q; // 90 degrees
  near(quarter.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)), 0);
});

test("easeInOut and step segments are baked into enough glTF samples", () => {
  const eased = {
    id: "t", target: { kind: "group", id: "g" },
    keys: [
      { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "easeInOut" },
      { t: 1, p: [1, 0, 0], r: [0, 0, 0], e: "linear" },
    ],
  };
  assert.ok(bakeTrackTimes(eased).length >= 9);
  const spin = { id: "t", target: { kind: "group", id: "g" }, keys: spinKeys([0, 1, 0], 1, 2) };
  assert.ok(bakeTrackTimes(spin).length >= 9, "360 degrees needs <=45 degree steps");
  const step = {
    id: "t", target: { kind: "group", id: "g" },
    keys: [
      { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "step" },
      { t: 1, p: [1, 0, 0], r: [0, 0, 0], e: "linear" },
    ],
  };
  const times = bakeTrackTimes(step);
  assert.equal(times.length, 3);
  near(sampleTrack(step, 0.5).p.x, 0);
});

test("buildNodeTracks keeps quaternions continuous through a full turn", () => {
  const track = { id: "t", target: { kind: "group", id: "g" }, keys: spinKeys([0, 1, 0], 1, 2) };
  const built = buildNodeTracks("G", track, new THREE.Vector3(1, 2, 3), new THREE.Quaternion(), false);
  const v = built.quaternion.values;
  for (let i = 4; i < v.length; i += 4) {
    const dot = v[i] * v[i - 4] + v[i + 1] * v[i - 3] + v[i + 2] * v[i - 2] + v[i + 3] * v[i - 1];
    assert.ok(dot > 0.5, "consecutive quaternions stay in one hemisphere");
  }
  assert.deepEqual([...built.position.values.slice(0, 3)], [1, 2, 3]);
});

test("grouping moves rotation about the pivot and restores the rest pose", () => {
  const a = piece(1, 0), b = piece(2, 2);
  const pieces = [a, b], groups = [];
  const group = createGroup(pieces, groups, "Wheel");
  assert.deepEqual(group.pivot, [1, 0, 0]);
  assert.equal(a.groupId, group.id);
  assert.deepEqual(editorAssemblyMembers(pieces, a), pieces, "a group selects all its parts");

  const doc = sanitizeAnimation({
    duration: 2,
    tracks: [{ id: "x", target: { kind: "group", id: group.id }, keys: spinKeys([0, 0, 1], 0.5, 2) }],
  });
  const rest = captureRest(pieces);
  applyPose(pieces, rest, groups, doc, 2); // 180 degrees about Z through (1,0,0)
  near(a.mesh.position.x, 2); near(b.mesh.position.x, 0);
  near(a.mesh.position.y, 0, 1e-6);
  applyPose(pieces, rest, groups, doc, 0);
  near(a.mesh.position.x, 0); near(b.mesh.position.x, 2);
  applyPose(pieces, rest, groups, doc, 1);
  near(a.mesh.position.x, 1); near(a.mesh.position.y, -1, 1e-6);
  restoreRest(rest);
  near(a.mesh.position.y, 0); near(b.mesh.position.x, 2);
});

test("a part track inside a group composes in the group frame", () => {
  const a = piece(1, 0), b = piece(2, 2);
  const pieces = [a, b], groups = [];
  const group = createGroup(pieces, groups);
  const doc = sanitizeAnimation({
    duration: 1,
    tracks: [
      { id: "g", target: { kind: "group", id: group.id }, keys: [
        { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "linear" },
        { t: 1, p: [0, 5, 0], r: [0, 0, 0], e: "linear" } ] },
      { id: "p", target: { kind: "piece", id: "1" }, keys: [
        { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "linear" },
        { t: 1, p: [0, 0, 3], r: [0, 0, 0], e: "linear" } ] },
    ],
  });
  const rest = captureRest(pieces);
  applyPose(pieces, rest, groups, doc, 1);
  near(a.mesh.position.y, 5); near(a.mesh.position.z, 3);
  near(b.mesh.position.y, 5); near(b.mesh.position.z, 0);
});

test("ungrouping, pruning and sanitising", () => {
  const a = piece(1, 0), b = piece(2, 2), c = piece(3, 4);
  const pieces = [a, b, c], groups = [];
  const group = createGroup([a, b], groups);
  const doc = sanitizeAnimation({ tracks: [
    { id: "x", target: { kind: "group", id: group.id }, keys: [{ t: 0 }] },
    { id: "y", target: { kind: "piece", id: "99" }, keys: [{ t: 0 }] },
    { id: "z", target: { kind: "piece", id: "3" }, keys: [{ t: -4, p: ["a", 1, 2], e: "bad" }] },
    { id: "w", target: { kind: "piece", id: "3" }, keys: [] },
  ]});
  assert.equal(doc.tracks.length, 3);
  assert.equal(doc.tracks[2].keys[0].t, 0);
  assert.deepEqual(doc.tracks[2].keys[0].p, [0, 1, 2]);
  assert.equal(doc.tracks[2].keys[0].e, "linear");
  assert.ok(pruneGroupsAndTracks(pieces, groups, doc));
  assert.deepEqual(doc.tracks.map((t) => t.id), ["x", "z"]);
  ungroupPiece(a, pieces, groups);
  assert.equal(groups.length, 0);
  assert.equal(b.groupId, undefined);
  pruneGroupsAndTracks(pieces, groups, doc);
  assert.deepEqual(doc.tracks.map((t) => t.id), ["z"]);
  assert.deepEqual(sanitizeGroups([{ id: "g", name: "  ", pivot: [1, "x", 3] }, { id: "g" }, 5]).map((g) => g.pivot), [[1, 0, 3]]);
});

test("keyAt reproduces the current pose and upsertKey replaces near-equal times", () => {
  const track = { id: "t", target: { kind: "group", id: "g" }, keys: spinKeys([1, 0, 0], 1, 4) };
  const key = keyAt(track, 1);
  near(key.r[0], 90);
  upsertKey(track, key);
  assert.equal(track.keys.length, 3);
  upsertKey(track, { ...key, p: [1, 1, 1] });
  assert.equal(track.keys.length, 3);
});
