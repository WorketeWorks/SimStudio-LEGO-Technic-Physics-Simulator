import { access, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeMapProvenance } from "../app/map-provenance.ts";

const [correctionsArg, outputArg] = process.argv.slice(2);
if (!correctionsArg || !outputArg)
  throw new Error("Usage: node import-correction-maps.mjs <corrections> <output>");

const correctionsDir = resolve(correctionsArg),
  outputDir = resolve(outputArg),
  files = (await readdir(correctionsDir)).sort(),
  connectionMaps = {},
  collisionMaps = {},
  gearCollisionMaps = {},
  specialGearParts = new Set();
let mapProvenance = {};
try { mapProvenance = JSON.parse(await readFile(resolve(outputDir, "preloaded-map-provenance.json"), "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }

const readExport = async (file, name, fallback) => {
  const path = resolve(outputDir, file);
  try {
    await access(path);
  } catch {
    return fallback;
  }
  try {
    const module = await import(`${pathToFileURL(path).href}?v=${Date.now()}`);
    return module[name] ?? fallback;
  } catch (error) {
    // Never regenerate a partial file after silently failing to read the
    // existing maps. That was able to erase every map not present in the
    // current corrections directory.
    throw new Error(`Unable to preserve ${name} from ${file}`, { cause: error });
  }
};

Object.assign(connectionMaps, await readExport("connection-maps.ts", "preloadedConnectionMaps", {}));
Object.assign(collisionMaps, await readExport("collision-maps.ts", "preloadedCollisionMaps", {}));
Object.assign(gearCollisionMaps, await readExport("collision-maps.ts", "preloadedGearCollisionMaps", {}));
try {
  const existing = await readExport("collision-maps.ts", "preloadedSpecialGearParts", new Set());
  existing.forEach((part) => specialGearParts.add(part));
} catch {}

// Windows adds " (1)", " (2)", etc. when another correction for the same
// part is downloaded. Select by modification time, not alphabetic filename,
// and apply exactly one authoritative file per part and map type.
const selected = new Map();
const normalizeCollisionPrimitive = (primitive) => {
  if (!primitive || typeof primitive !== "object") return primitive;
  const normalized = { ...primitive };
  // Early map-editor exports used the Spanish single-l spelling. Keep those
  // reviewed files usable without leaking an unknown property into runtime.
  if (normalized.gearCollision === undefined && normalized.gearColision !== undefined)
    normalized.gearCollision = normalized.gearColision;
  delete normalized.gearColision;
  return normalized;
};
for (const file of files) {
  const match = file.match(/^(.+)-(connections|collisions)(?: \(\d+\))?\.json$/i);
  if (!match) continue;
  const path = resolve(correctionsDir, file),
    payload = JSON.parse(await readFile(path, "utf8")),
    part = String(payload.part ?? match[1]),
    kind = match[2].toLowerCase(),
    modified = (await stat(path)).mtimeMs,
    key = `${part.toLowerCase()}:${kind}`,
    previous = selected.get(key);
  if (!previous || modified > previous.modified)
    selected.set(key, { file, payload, part, kind, modified });
}

for (const { file, payload, part, kind } of [...selected.values()].sort((a, b) =>
  a.part.localeCompare(b.part, undefined, { numeric: true }) ||
  a.kind.localeCompare(b.kind),
)) {
  mapProvenance[part] ??= {};
  const provenance = (layer) => payload.mapProvenance?.[layer]
    ? normalizeMapProvenance(payload.mapProvenance[layer])
    : { origin: "manual", source: file };
  if (kind === "connections") {
    if (!Array.isArray(payload.connectors))
      throw new Error(`${file} does not contain a connectors array`);
    connectionMaps[part] = payload.connectors;
    mapProvenance[part].connectors = provenance("connectors");
  } else {
    if (!Array.isArray(payload.colliders))
      throw new Error(`${file} does not contain a colliders array`);
    collisionMaps[part] = payload.colliders.map(normalizeCollisionPrimitive);
    mapProvenance[part].colliders = provenance("colliders");
    if (Array.isArray(payload.gearColliders)) {
      gearCollisionMaps[part] = payload.gearColliders.map(normalizeCollisionPrimitive);
      mapProvenance[part].gearColliders = provenance("gearColliders");
    }
    if (payload.specialGear === true || payload.especialGear === true)
      specialGearParts.add(part);
    else if (payload.specialGear === false || payload.especialGear === false)
      specialGearParts.delete(part);
    if (typeof payload.specialGear === "boolean" || typeof payload.especialGear === "boolean")
      mapProvenance[part].specialGear = provenance("specialGear");
  }
}

// Preserve the current schemas, including arcs and connector target rules.
const typeHeader = async (file, declaration) => {
  let source;
  try { source = await readFile(resolve(outputDir, file), "utf8"); }
  catch { source = await readFile(new URL(`../app/${file}`, import.meta.url), "utf8"); }
  const index = source.indexOf(declaration);
  if (index < 0) throw new Error(`Missing schema declaration in ${file}`);
  return source.slice(0, index);
};
const connectionSource = (await typeHeader("connection-maps.ts", "export const preloadedConnectionMaps"))
  + `export const preloadedConnectionMaps: Record<string, StoredConnector[]> = ${JSON.stringify(connectionMaps, null, 2)};\n`;
const collisionSource = (await typeHeader("collision-maps.ts", "export const preloadedCollisionMaps"))
  + `export const preloadedCollisionMaps: Record<string, StoredCollisionPrimitive[]> = ${JSON.stringify(collisionMaps, null, 2)};\n\n`
  + `export const preloadedGearCollisionMaps: Record<string, StoredCollisionPrimitive[]> = ${JSON.stringify(gearCollisionMaps, null, 2)};\n\n`
  + `export const preloadedSpecialGearParts = new Set(${JSON.stringify([...specialGearParts])});\n`;

await Promise.all([
  writeFile(resolve(outputDir, "connection-maps.ts"), connectionSource),
  writeFile(resolve(outputDir, "collision-maps.ts"), collisionSource),
  writeFile(resolve(outputDir, "preloaded-map-provenance.json"), JSON.stringify(mapProvenance, null, 2) + "\n"),
]);

console.log(
  `Applied ${selected.size} latest corrections. Preserved ${Object.keys(connectionMaps).length} connection maps, ${Object.keys(collisionMaps).length} collision maps and ${Object.keys(gearCollisionMaps).length} gear collision maps.`,
);
