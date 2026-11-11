/// <reference lib="webworker" />
/**
 * Parses LDraw parts off the main thread. The page sends a one-line model
 * (data URL) plus the library to read from; the worker downloads and parses
 * every sub-file, flattens the result and returns it as Three.js JSON together
 * with the hole primitives found in the file tree. The main thread only runs
 * ObjectLoader.parse, so large parts (Spike motors, hubs) no longer freeze it.
 */
import * as THREE from "three";
import { LDrawLoader, clearLDrawCaches } from "../vendor/LDrawLoader.js";
import { LDrawConditionalLineMaterial } from "three/addons/materials/LDrawConditionalLineMaterial.js";
import { flattenLDrawRenderables } from "../ldraw-geometry";
import { typedGeometryArrays, type GeometryJson } from "../typed-json";
import { classifySubpart } from "../ldraw-subparts";
import { generatePartConnectors } from "../connectors";
import * as connectorsModule from "../connectors";

type Init = {
  type: "init";
  fileMap: Record<string, string> | null;
  libraries: string[];
  configUrl?: string;
};
type Load = { type: "load"; id: number; base: string; source: string; name?: string; split?: boolean };
type Reset = { type: "reset" };
type Message = Init | Load | Reset;

const scope = self as unknown as DedicatedWorkerGlobalScope;
let fileMap: Record<string, string> | null = null,
  libraries: string[] = [],
  configUrl: string | undefined;

type Lane = { instance: LDrawLoader; ready: Promise<unknown>; tail: Promise<unknown> };
const lanes = new Map<string, Lane>();

const laneFor = (base: string, split = false): Lane => {
  const laneKey = split ? `${base}#split` : base;
  let lane = lanes.get(laneKey);
  if (lane) return lane;
  const instance = new LDrawLoader();
  // Sub-parts (s/*.dat) stay separate meshes so they can be animated alone.
  (instance as unknown as { separateSubparts: boolean }).separateSubparts = split;
  instance.setConditionalLineMaterial(LDrawConditionalLineMaterial);
  instance.setPartsLibraryPath(base);
  (instance as unknown as { fallbackLibraries: string[] }).fallbackLibraries = libraries.filter(
    (library) => library !== base,
  );
  if (fileMap) instance.setFileMap(fileMap);
  // Local copy first: library.ldraw.org sends no CORS headers.
  const ready = (configUrl ? instance.preloadMaterials(configUrl) : Promise.reject())
    .catch(() => (base.includes("library.ldraw.org") ? undefined : instance.preloadMaterials(base + "LDConfig.ldr")))
    .catch(() => undefined);
  lane = { instance, ready, tail: Promise.resolve() };
  lanes.set(laneKey, lane);
  return lane;
};

async function load(message: Load) {
  const lane = laneFor(message.base, !!message.split);
  await lane.ready;
  const tracker = lane.instance as unknown as { missingFiles?: Set<string> };
  tracker.missingFiles?.clear();
  const group = await lane.instance.loadAsync(message.source);
  const missing = tracker.missingFiles?.size ?? 0;
  let hits: { fileName: string; matrix: number[] }[] = [];
  try {
    const text = decodeURIComponent(message.source.slice(message.source.indexOf(",") + 1));
    hits = await (
      lane.instance as unknown as {
        collectSubparts: (
          text: string,
          classify: typeof classifySubpart,
        ) => Promise<{ fileName: string; matrix: number[] }[]>;
      }
    ).collectSubparts(text, classifySubpart);
  } catch {
    // Hole primitives are a bonus; the mesh is what matters.
  }
  const flat = flattenLDrawRenderables(group, !!message.split);
  flat.userData.subpartHits = hits;
  if (message.name) {
    // Hole search (ray casts, up to ~2 s on dense parts) runs here, not on the UI thread.
    try {
      const wrapper = new THREE.Group(),
        model = flat.clone(true);
      model.rotation.x = Math.PI;
      model.scale.setScalar(0.05);
      wrapper.add(model);
      wrapper.updateMatrixWorld(true);
      const list = generatePartConnectors(wrapper, message.name);
      flat.userData.workerConnectors = {
        expired: connectorsModule.lastDetectionExpired,
        list: list.map((c) => ({
          local: c.local.toArray(),
          axis: c.axis.toArray(),
          kind: c.kind,
          role: c.role,
          diameter: c.diameter,
          length: c.length,
        })),
      };
    } catch {
      // The main thread falls back to its own detection.
    }
  }
  const json = flat.toJSON() as { geometries?: GeometryJson[] };
  return { json, missing, transfer: typedGeometryArrays(json) };
}

scope.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === "init") {
    fileMap = message.fileMap;
    libraries = message.libraries;
    configUrl = message.configUrl;
    lanes.forEach((lane) => fileMap && lane.instance.setFileMap(fileMap));
    return;
  }
  if (message.type === "reset") {
    clearLDrawCaches();
    lanes.forEach((lane) =>
      (lane.instance as unknown as { resetCaches?: () => void }).resetCaches?.(),
    );
    return;
  }
  const lane = laneFor(message.base, !!message.split);
  lane.tail = lane.tail
    .then(() => load(message))
    .then(
      ({ transfer, ...result }) => scope.postMessage({ id: message.id, ...result }, transfer),
      (error: unknown) =>
        scope.postMessage({
          id: message.id,
          error: error instanceof Error ? error.message : String(error),
        }),
    );
};

// Keeps THREE referenced so bundlers do not drop the side-effect imports.
void THREE.REVISION;
