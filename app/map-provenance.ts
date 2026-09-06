export const MAP_GENERATOR_VERSION = "geometry-v3-solid";
export const MAP_PROVENANCE_STORAGE_PREFIX = "sim-map-provenance-v1:";
export type MapOrigin = "automatic" | "manual" | "unknown";
export type MapProvenance = {
  origin: MapOrigin;
  generatorVersion?: string;
  source?: string;
};
export type MapProvenanceSnapshot = Partial<Record<
  "connectors" | "colliders" | "gearColliders" | "specialGear", MapProvenance
>>;
export const automaticMapProvenance = (): MapProvenance => ({
  origin: "automatic", generatorVersion: MAP_GENERATOR_VERSION,
});
export const normalizeMapProvenance = (value: unknown): MapProvenance => {
  if (!value || typeof value !== "object") return { origin: "unknown" };
  const data = value as Record<string, unknown>;
  return {
    origin: data.origin === "manual" || data.origin === "automatic" ? data.origin : "unknown",
    ...(typeof data.generatorVersion === "string" ? { generatorVersion: data.generatorVersion } : {}),
    ...(typeof data.source === "string" ? { source: data.source } : {}),
  };
};
export const normalizeMapProvenanceSnapshot = (value: unknown): MapProvenanceSnapshot => {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(["connectors", "colliders", "gearColliders", "specialGear"]
    .map(layer => [layer, normalizeMapProvenance(data[layer])]));
};
export const canRegenerateMap = (provenance: MapProvenance | undefined) =>
  provenance?.origin === "automatic";

export function readMapProvenance(storage: Pick<Storage, "getItem">, part: string): MapProvenanceSnapshot {
  try {
    return normalizeMapProvenanceSnapshot(JSON.parse(storage.getItem(MAP_PROVENANCE_STORAGE_PREFIX + part.toLowerCase()) ?? "null"));
  } catch { return normalizeMapProvenanceSnapshot(undefined); }
}
export function writeMapProvenance(
  storage: Pick<Storage, "getItem" | "setItem">, part: string,
  changes: MapProvenanceSnapshot,
) {
  storage.setItem(MAP_PROVENANCE_STORAGE_PREFIX + part.toLowerCase(),
    JSON.stringify({ ...readMapProvenance(storage, part), ...changes }));
}
