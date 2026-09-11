import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import * as THREE from "three";
import * as generator from "../app/connectors.ts";
import { preloadedConnectionMaps } from "../app/connection-maps.ts";
import { preloadedCollisionMaps, preloadedGearCollisionMaps } from "../app/collision-maps.ts";
import { automaticMapProvenance, canRegenerateMap, normalizeMapProvenanceSnapshot } from "../app/map-provenance.ts";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("app/preloaded-catalog.json", root), "utf8"));
const reviewed = JSON.parse(await readFile(new URL("app/preloaded-map-provenance.json", root), "utf8"));
const write = process.argv.includes("--write");
const legacyArg = process.argv.find(a => a.startsWith("--classify-against="));
let legacy;
if (legacyArg) {
  const ref = legacyArg.slice("--classify-against=".length);
  if (!/^[a-f0-9]{7,40}$/i.test(ref)) throw new Error("Use a commit hash for --classify-against");
  const source = execFileSync("git", ["show", `${ref}:app/connectors.ts`], { cwd: fileURLToPath(root), encoding: "utf8" });
  const exports = {};
  vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), {
    exports, require: name => { if (name === "three") return THREE; throw new Error(`Unsupported legacy dependency ${name}`); },
  });
  legacy = exports;
}
const serialize = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => {
  const canonical = x => {
    if (typeof x === "number") return Math.round(x * 1e5) / 1e5;
    if (Array.isArray(x)) return x.map(canonical);
    if (x && typeof x === "object") return Object.fromEntries(Object.keys(x).sort().filter(k => x[k] !== undefined).map(k => [k, canonical(x[k])]));
    return x;
  };
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
};
const connectorData = rows => rows.map(c => ({ ...c, local: c.local.toArray(), axis: c.axis.toArray() }));
const colliderData = rows => rows.map(c => ({ ...c, center: c.center.toArray(), size: c.size?.toArray(), rotation: c.rotation.toArray() }));
const vectors = rows => rows.map(c => ({ ...c, local: new THREE.Vector3(...c.local), axis: new THREE.Vector3(...c.axis) }));
const stats = { regenerated: 0, manual: 0, unknown: 0, classified: 0 };
for (const [part, data] of Object.entries(catalog.parts)) {
  const metadata = normalizeMapProvenanceSnapshot(data.mapProvenance);
  const asset = Object.entries(catalog.assets).find(([key]) => key.startsWith(`${data.modelPart ?? part}-`))?.[1];
  if (!asset) { data.mapProvenance = metadata; continue; }
  const mesh = new THREE.ObjectLoader().parse(JSON.parse(await readFile(new URL(`public/${asset.geometry}`, root), "utf8")));
  mesh.rotation.x = Math.PI; mesh.scale.setScalar(0.05);
  const object = new THREE.Group(); object.add(mesh); object.updateMatrixWorld(true);
  let oldConnectors;
  if (legacy) {
    oldConnectors = legacy.straightAxleConnectors(data.name);
    if (!oldConnectors && preloadedConnectionMaps[part]) oldConnectors = vectors(preloadedConnectionMaps[part]);
    if (!oldConnectors) {
      const pin = /^Technic (Axle )?Pin/i.test(data.name), axle = /^Technic Axle(?! Pin)/i.test(data.name);
      const sockets = legacy.detectConnectorHoles(object);
      const shafts = pin ? (/^Technic Axle Pin/i.test(data.name) ? legacy.hybridAxlePinConnectors(object) : legacy.rodConnectors(object, "round"))
        : axle ? legacy.rodConnectors(object, "axle") : [];
      oldConnectors = [...shafts, ...sockets.filter(c => !shafts.some(s => s.local.distanceTo(c.local) < 0.12))];
      if (!oldConnectors.length) oldConnectors = legacy.fallbackBeamConnectors(object, data.name);
      if (/^Technic (Beam|Panel)/i.test(data.name) && /(?:\bx\s*0\.5\b|\b0\.5\b|\bhalf\b)/i.test(data.name))
        oldConnectors = oldConnectors.map(c => c.role === "socket" && c.kind === "round" ? { ...c, kind: "half" } : c);
    }
  }
  for (const [layer, maps] of Object.entries({ connectors: preloadedConnectionMaps, colliders: preloadedCollisionMaps, gearColliders: preloadedGearCollisionMaps })) {
    if (maps[part] !== undefined && same(data[layer], maps[part])) metadata[layer] = reviewed[part]?.[layer] ?? { origin: "unknown" };
    if (legacy && metadata[layer].origin === "unknown" && maps[part] === undefined) {
      const old = layer === "connectors" ? connectorData(oldConnectors)
        : layer === "colliders" ? colliderData(legacy.straightAxleCollisionPrimitives(data.name)
          ?? legacy.approximateCollisionPrimitives(object, data.name, oldConnectors)) : undefined;
      if (old && same(data[layer], serialize(old))) {
        metadata[layer] = { origin: "automatic", generatorVersion: "legacy-verified" };
        stats.classified++;
      }
    }
    // Reviewed overlays also remain authoritative when the older cache differs.
    if (reviewed[part]?.[layer]?.origin === "manual") { stats.manual++; continue; }
    if (!canRegenerateMap(metadata[layer])) { stats.unknown++; continue; }
    const currentConnectors = vectors(reviewed[part]?.connectors?.origin === "manual"
      ? preloadedConnectionMaps[part] : data.connectors ?? []);
    data[layer] = serialize(layer === "connectors" ? connectorData(generator.generatePartConnectors(object, data.name))
      : layer === "colliders" ? colliderData(generator.straightAxleCollisionPrimitives(data.name)
        ?? generator.approximateCollisionPrimitives(object, data.name, currentConnectors))
        : colliderData(data.gear ? generator.approximateGearCollisionPrimitives(data.colliders.map(c => ({
          ...c, center: new THREE.Vector3(...c.center), size: c.size && new THREE.Vector3(...c.size), rotation: new THREE.Quaternion(...c.rotation),
        }))) : []));
    metadata[layer] = automaticMapProvenance();
    stats.regenerated++;
  }
  data.mapProvenance = metadata;
}
if (write) {
  const json = JSON.stringify(catalog, null, 2) + "\n";
  await writeFile(new URL("app/preloaded-catalog.json", root), json);
  await writeFile(new URL("public/catalog/manifest.json", root), json);
}
console.log(JSON.stringify({ ...stats, written: write }));
