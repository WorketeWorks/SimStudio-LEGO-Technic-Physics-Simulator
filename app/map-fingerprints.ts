export const MAP_UPDATE_LAYERS = [
  "connectors",
  "colliders",
  "gearColliders",
  "specialGear",
] as const;

export type MapUpdateLayer = (typeof MAP_UPDATE_LAYERS)[number];

export type MapFingerprintSnapshot = Partial<Record<MapUpdateLayer, string>>;

export type PartMapBundle = {
  connectors?: unknown;
  colliders?: unknown;
  gearColliders?: unknown;
  specialGear?: boolean;
};

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "number")
    return Number.isFinite(value) ? JSON.stringify(value) : "null";
  if (typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value !== "object") return "null";
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
};

/** Fast deterministic FNV-1a fingerprint; this is change detection, not security. */
export const mapFingerprint = (value: unknown) => {
  const text = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(36)}:${text.length.toString(36)}`;
};

export const fingerprintMapBundle = (bundle: PartMapBundle): MapFingerprintSnapshot =>
  Object.fromEntries(
    MAP_UPDATE_LAYERS.flatMap((layer) =>
      bundle[layer] === undefined ? [] : [[layer, mapFingerprint(bundle[layer])]],
    ),
  );

export const changedMapLayers = (
  previousPreloaded: MapFingerprintSnapshot | undefined,
  currentPreloaded: MapFingerprintSnapshot,
  actual: MapFingerprintSnapshot,
): MapUpdateLayer[] =>
  MAP_UPDATE_LAYERS.filter(
    (layer) =>
      currentPreloaded[layer] !== undefined &&
      actual[layer] !== undefined &&
      actual[layer] !== currentPreloaded[layer] &&
      previousPreloaded?.[layer] !== currentPreloaded[layer],
  );

/** Every locally/project-stored layer whose content differs from the package. */
export const differentMapLayers = (
  currentPreloaded: MapFingerprintSnapshot,
  actual: MapFingerprintSnapshot,
): MapUpdateLayer[] =>
  MAP_UPDATE_LAYERS.filter(
    (layer) =>
      currentPreloaded[layer] !== undefined &&
      actual[layer] !== undefined &&
      actual[layer] !== currentPreloaded[layer],
  );

export const mapLayerCounts = (bundle: PartMapBundle) => ({
  connectors: Array.isArray(bundle.connectors) ? bundle.connectors.length : 0,
  colliders: Array.isArray(bundle.colliders) ? bundle.colliders.length : 0,
  gearColliders: Array.isArray(bundle.gearColliders) ? bundle.gearColliders.length : 0,
  specialGear: bundle.specialGear === true ? 1 : 0,
});
