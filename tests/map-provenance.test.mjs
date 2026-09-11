import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { automaticMapProvenance, canRegenerateMap, isStaleAutomaticMap,
  normalizeMapProvenanceSnapshot, readMapProvenance, writeMapProvenance } from "../app/map-provenance.ts";

test("only explicitly automatic maps may be regenerated", () => {
  for (const value of [undefined, { origin: "manual" }, { origin: "unknown" }]) {
    assert.equal(canRegenerateMap(value), false);
    assert.equal(isStaleAutomaticMap(value), false);
  }
  assert.equal(canRegenerateMap(automaticMapProvenance()), true);
  assert.equal(isStaleAutomaticMap(automaticMapProvenance()), false);
  assert.equal(isStaleAutomaticMap({ origin: "automatic", generatorVersion: "geometry-v2" }), true);
  assert.equal(isStaleAutomaticMap({ origin: "manual", generatorVersion: "geometry-v2" }), false);
});

test("origins persist independently for every map layer", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(readMapProvenance(storage, "Beam").colliders.origin, "unknown");
  writeMapProvenance(storage, "Beam", { connectors: { origin: "manual" }, colliders: automaticMapProvenance() });
  writeMapProvenance(storage, "beam", { gearColliders: { origin: "manual" } });
  const restored = readMapProvenance(storage, "BEAM");
  assert.equal(restored.connectors.origin, "manual");
  assert.equal(restored.colliders.origin, "automatic");
  assert.equal(restored.gearColliders.origin, "manual");
  assert.equal(restored.specialGear.origin, "unknown");
  assert.equal(normalizeMapProvenanceSnapshot({ connectors: { origin: "invalid" } }).connectors.origin, "unknown");
  const broken = { getItem: () => "not json" };
  assert.equal(readMapProvenance(broken, "beam").connectors.origin, "unknown");
});

test("correction imports preserve origins, advanced shapes and omitted gear maps", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sim-map-test-"));
  try {
    const input = join(directory, "input"), output = join(directory, "output");
    await mkdir(input); await mkdir(output);
    const run = () => execFileSync(process.execPath,
      [resolve("scripts/import-correction-maps.mjs"), input, output], { encoding: "utf8" });
    const arc = { shape: "arc", center: [0, 0, 0], rotation: [0, 0, 0, 1], radius: 2,
      innerRadius: 1, halfHeight: 0.5, startAngle: 20, arcAngle: 90, segments: 8, gearCollision: true };
    await writeFile(join(input, "Demo-collisions.json"), JSON.stringify({ part: "Demo", colliders: [arc], gearColliders: [arc] }));
    await writeFile(join(input, "Demo-connections.json"), JSON.stringify({ part: "Demo", connectors: [],
      mapProvenance: { connectors: automaticMapProvenance() } }));
    run();
    await writeFile(join(input, "Demo-collisions.json"), JSON.stringify({ part: "Demo", colliders: [] }));
    run();
    const origins = JSON.parse(await readFile(join(output, "preloaded-map-provenance.json"), "utf8"));
    assert.equal(origins.demo.connectors.origin, "automatic");
    assert.equal(origins.demo.colliders.origin, "manual");
    assert.equal(origins.demo.gearColliders.origin, "manual");
    const maps = await import(pathToFileURL(join(output, "collision-maps.ts")).href);
    assert.deepEqual(maps.preloadedCollisionMaps.demo, []);
    assert.deepEqual(maps.preloadedGearCollisionMaps.demo, [arc]);
  } finally {
    // mkdtemp provides the exact, isolated directory owned by this test.
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + "\\"));
    await rm(directory, { recursive: true, force: true });
  }
});
