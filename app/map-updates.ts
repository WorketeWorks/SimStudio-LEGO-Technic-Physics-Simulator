import { preloadedConnectionMaps } from "./connection-maps";
import preloadedCatalog from "./preloaded-catalog.json";
import reviewedProvenance from "./preloaded-map-provenance.json";
import { isStaleAutomaticMap, normalizeMapProvenanceSnapshot, type MapProvenanceSnapshot } from "./map-provenance";
import {
  preloadedCollisionMaps,
  preloadedGearCollisionMaps,
  preloadedSpecialGearParts,
} from "./collision-maps";
import {
  fingerprintMapBundle,
  type MapFingerprintSnapshot,
  type PartMapBundle,
} from "./map-fingerprints";
export {
  MAP_UPDATE_LAYERS,
  changedMapLayers,
  differentMapLayers,
  fingerprintMapBundle,
  mapFingerprint,
  mapLayerCounts,
  type MapFingerprintSnapshot,
  type MapUpdateLayer,
  type PartMapBundle,
} from "./map-fingerprints";

export const MAP_BASELINE_STORAGE_PREFIX = "sim-map-baseline-v1:";

const packagedParts = preloadedCatalog.parts as Record<
  string,
  PartMapBundle & { mapProvenance?: MapProvenanceSnapshot }
>;

export const correctionMapProvenance = (part: string): MapProvenanceSnapshot =>
  normalizeMapProvenanceSnapshot((reviewedProvenance as Record<string, MapProvenanceSnapshot>)[part.toLowerCase()]);

export const preloadedMapProvenance = (part: string): MapProvenanceSnapshot => {
  const key = part.toLowerCase();
  const packaged = normalizeMapProvenanceSnapshot(packagedParts[key]?.mapProvenance),
    reviewed = normalizeMapProvenanceSnapshot((reviewedProvenance as Record<string, MapProvenanceSnapshot>)[key]);
  for (const [layer, map] of Object.entries({ connectors: preloadedConnectionMaps[key],
    colliders: preloadedCollisionMaps[key], gearColliders: preloadedGearCollisionMaps[key],
    specialGear: preloadedSpecialGearParts.has(key) ? true : undefined })) {
    const field = layer as keyof MapProvenanceSnapshot;
    if (map !== undefined && !isStaleAutomaticMap(reviewed[field])) packaged[field] = reviewed[field];
  }
  return packaged;
};

export const preloadedMapBundle = (part: string): PartMapBundle => {
  const key = part.toLowerCase(),
    reviewed = normalizeMapProvenanceSnapshot((reviewedProvenance as Record<string, MapProvenanceSnapshot>)[key]),
    connectors = !isStaleAutomaticMap(reviewed.connectors)
      ? preloadedConnectionMaps[key] ?? packagedParts[key]?.connectors : packagedParts[key]?.connectors;
  return {
    connectors,
    colliders: !isStaleAutomaticMap(reviewed.colliders)
      ? preloadedCollisionMaps[key] ?? packagedParts[key]?.colliders : packagedParts[key]?.colliders,
    gearColliders: !isStaleAutomaticMap(reviewed.gearColliders)
      ? preloadedGearCollisionMaps[key] ?? packagedParts[key]?.gearColliders : packagedParts[key]?.gearColliders,
    specialGear:
      connectors ||
      preloadedCollisionMaps[key] ||
      preloadedGearCollisionMaps[key] ||
      preloadedSpecialGearParts.has(key)
        ? preloadedSpecialGearParts.has(key)
        : undefined,
  };
};

const preloadedFingerprintCache = new Map<string, MapFingerprintSnapshot>();

export const preloadedMapFingerprint = (part: string) => {
  const key = part.toLowerCase(),
    cached = preloadedFingerprintCache.get(key);
  if (cached) return cached;
  const fingerprint = fingerprintMapBundle(preloadedMapBundle(key));
  preloadedFingerprintCache.set(key, fingerprint);
  return fingerprint;
};
