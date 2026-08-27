import { preloadedConnectionMaps } from "./connection-maps";
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

export const preloadedMapBundle = (part: string): PartMapBundle => {
  const key = part.toLowerCase();
  return {
    connectors: preloadedConnectionMaps[key],
    colliders: preloadedCollisionMaps[key],
    gearColliders: preloadedGearCollisionMaps[key],
    specialGear:
      preloadedConnectionMaps[key] ||
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
