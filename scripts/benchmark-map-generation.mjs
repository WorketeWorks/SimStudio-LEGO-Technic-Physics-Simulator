import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import * as THREE from "three";
import { detectConnectorHoles } from "../app/connectors.ts";

const catalog = JSON.parse(await readFile(new URL("../app/preloaded-catalog.json", import.meta.url), "utf8"));
const directory = resolve(process.argv[2] ?? "tests/fixtures/map-corrections");
let expectedCount = 0, matches = 0, generatedCount = 0;
for (const file of (await readdir(directory)).sort()) {
  if (!file.endsWith("-connections.json")) continue;
  const expected = JSON.parse(await readFile(resolve(directory, file), "utf8"));
  const part = catalog.parts[expected.part];
  const asset = Object.entries(catalog.assets).find(([key]) => key.startsWith(`${part?.modelPart ?? expected.part}-`))?.[1];
  if (!asset) continue;
  const root = new THREE.Group();
  const object = new THREE.ObjectLoader().parse(JSON.parse(await readFile(new URL(`../public/${asset.geometry}`, import.meta.url), "utf8")));
  object.rotation.x = Math.PI;
  object.scale.setScalar(0.05);
  root.add(object);
  const generated = detectConnectorHoles(root);
  const sockets = expected.connectors.filter(c => c.role === "socket");
  if (!sockets.length) continue;
  let matched = 0;
  const used = new Set();
  for (const socket of sockets) {
    const index = generated.findIndex((c, i) => !used.has(i)
      && c.local.distanceTo(new THREE.Vector3(...socket.local)) < 0.15
      && Math.abs(c.axis.dot(new THREE.Vector3(...socket.axis).normalize())) > 0.98
      && (c.kind === socket.kind || c.kind === "round" && socket.kind === "half"));
    if (index >= 0) { used.add(index); matched++; }
  }
  expectedCount += sockets.length; matches += matched; generatedCount += generated.length;
  console.log(`${expected.part}: ${matched}/${sockets.length} matched, ${generated.length} generated`);
}
console.log(JSON.stringify({ expectedCount, matches, generatedCount,
  recall: matches / expectedCount, precision: matches / generatedCount }));
