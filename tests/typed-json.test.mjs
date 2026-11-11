import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { typedGeometryArrays } from "../app/typed-json.ts";

test("typed geometry arrays survive ObjectLoader and give transferable buffers", () => {
  const geometry = new THREE.BufferGeometry().copy(new THREE.BoxGeometry(2, 3, 4));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  const group = new THREE.Group();
  group.add(mesh);
  const json = group.toJSON();
  assert.ok(Array.isArray(json.geometries[0].data.attributes.position.array), "toJSON writes plain arrays");
  const transfer = typedGeometryArrays(json);
  assert.ok(transfer.length >= 3, "position, normal, uv, index");
  assert.ok(json.geometries[0].data.attributes.position.array instanceof Float32Array);
  const parsed = new THREE.ObjectLoader().parse(structuredClone(json));
  const box = new THREE.Box3().setFromObject(parsed);
  assert.deepEqual(box.getSize(new THREE.Vector3()).toArray(), [2, 3, 4]);
  assert.equal(parsed.children[0].geometry.index.count, geometry.index.count);
});
