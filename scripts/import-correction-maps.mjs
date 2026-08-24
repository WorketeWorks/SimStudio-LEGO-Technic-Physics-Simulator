import { access, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
  if (kind === "connections") {
    if (!Array.isArray(payload.connectors))
      throw new Error(`${file} does not contain a connectors array`);
    connectionMaps[part] = payload.connectors;
  } else {
    if (!Array.isArray(payload.colliders))
      throw new Error(`${file} does not contain a colliders array`);
    collisionMaps[part] = payload.colliders.map(normalizeCollisionPrimitive);
    if (Array.isArray(payload.gearColliders))
      gearCollisionMaps[part] = payload.gearColliders.map(normalizeCollisionPrimitive);
    else delete gearCollisionMaps[part];
    if (payload.specialGear === true || payload.especialGear === true)
      specialGearParts.add(part);
    else if (payload.specialGear === false || payload.especialGear === false)
      specialGearParts.delete(part);
  }
}

const connectionSource = `export type StoredConnector = {
  local: [number, number, number];
  axis: [number, number, number];
  kind: "round" | "axle" | "half";
  role: "socket" | "shaft";
  diameter: number;
  length?: number;
  rotationOnly?: boolean;
};

// Generated from the reviewed maps exported by Sim Studio's map editor.
export const preloadedConnectionMaps: Record<string, StoredConnector[]> = ${JSON.stringify(connectionMaps, null, 2)};
`;

const collisionSource = `export type StoredCollisionPrimitive = {
  shape: "box" | "cylinder";
  center: [number, number, number];
  size?: [number, number, number];
  radius?: number;
  halfHeight?: number;
  rotation: [number, number, number, number];
  gearCollision?: boolean;
  gearRatio?: number;
};

// Generated from the reviewed maps exported by Sim Studio's collider editor.
export const preloadedCollisionMaps: Record<string, StoredCollisionPrimitive[]> = ${JSON.stringify(collisionMaps, null, 2)};

// Optional second layer used exclusively for gear-to-gear contacts.
export const preloadedGearCollisionMaps: Record<string, StoredCollisionPrimitive[]> = ${JSON.stringify(gearCollisionMaps, null, 2)};

export const preloadedSpecialGearParts = new Set(${JSON.stringify([...specialGearParts])});
`;

await Promise.all([
  writeFile(resolve(outputDir, "connection-maps.ts"), connectionSource),
  writeFile(resolve(outputDir, "collision-maps.ts"), collisionSource),
]);

console.log(
  `Applied ${selected.size} latest corrections. Preserved ${Object.keys(connectionMaps).length} connection maps, ${Object.keys(collisionMaps).length} collision maps and ${Object.keys(gearCollisionMaps).length} gear collision maps.`,
);
