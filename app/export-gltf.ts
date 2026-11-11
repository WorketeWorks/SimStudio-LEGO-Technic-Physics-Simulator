/**
 * Export the model as a compact glTF binary (.glb) that loads in any Three.js
 * app with GLTFLoader.
 *
 * - Groups become named parent nodes (children keep their local transforms).
 * - Identical parts (same part number + colour) share ONE mesh: the geometry is
 *   stored once and instanced through glTF node references.
 * - Geometry is reduced to position + normal, welded into an indexed mesh and
 *   merged per colour, so files are far lighter than the editor's raw LDraw
 *   triangles (no UVs, no per-triangle duplicates, no outline lines unless asked).
 * - The keyframe animation is exported as a glTF animation targeting the group
 *   (or part) nodes by name.
 */
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { Piece } from "./editor/types";
import { buildNodeTracks, type AnimationDoc, type GroupDef, type Track } from "./animation.ts";
import { animationModule } from "./export-code.ts";
import { listSubparts, splitSubTargetId, subPivot, subTargetId } from "./subparts.ts";

export type ExportOptions = {
  /** "studs": 1 unit = 1 stud. "meters": real size (1 stud = 8 mm). */
  units: "studs" | "meters";
  animation: boolean;
  /** Add LDraw edge lines (heavier, rarely needed). */
  outlines: boolean;
};

export type ExportStats = {
  parts: number;
  groups: number;
  uniqueMeshes: number;
  triangles: number;
  vertices: number;
  tracks: number;
  bytes: number;
};

export type ExportResult = {
  glb: ArrayBuffer;
  stats: ExportStats;
  /** Node names by group id, for the usage snippet. */
  groupNames: { id: string; name: string; node: string }[];
  clipName: string | null;
};

export const STUD_METERS = 0.008;
const CLIP_NAME = "BrickReel";

type Prototype = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  lines?: THREE.LineSegments;
  triangles: number;
  vertices: number;
};

const safeName = (value: string) =>
  THREE.PropertyBinding.sanitizeNodeName(value.replace(/\s+/g, "_")).replace(/[^\w.-]/g, "") ||
  "node";

/** Reverses triangle winding of a non-indexed geometry (mirrored matrices). */
function flipWinding(geometry: THREE.BufferGeometry) {
  for (const name of ["position", "normal"]) {
    const attribute = geometry.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!attribute) continue;
    const a = attribute.array as Float32Array;
    for (let i = 0; i + 8 < a.length; i += 9)
      for (let k = 0; k < 3; k++) {
        const t = a[i + 3 + k];
        a[i + 3 + k] = a[i + 6 + k];
        a[i + 6 + k] = t;
      }
    attribute.needsUpdate = true;
  }
}

/** One triangle soup per source mesh/material range: position + normal only. */
function* meshTriangleRanges(mesh: THREE.Mesh) {
  const geometry = mesh.geometry,
    materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  if (!geometry.getAttribute("position")) return;
  const source = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const total = source.getAttribute("position").count;
  const groups =
    Array.isArray(mesh.material) && geometry.groups.length
      ? geometry.groups
      : [{ start: 0, count: total, materialIndex: 0 }];
  for (const group of groups) {
    const material = materials[group.materialIndex ?? 0];
    if (!material) continue;
    const start = Math.max(0, group.start),
      count = Math.min(total - start, group.count === Infinity ? total : group.count);
    if (count < 3) continue;
    const part = new THREE.BufferGeometry();
    for (const name of ["position", "normal"] as const) {
      const attribute = source.getAttribute(name) as THREE.BufferAttribute | undefined;
      if (!attribute) continue;
      part.setAttribute(
        name,
        new THREE.BufferAttribute(
          (attribute.array as Float32Array).slice(start * 3, (start + count) * 3),
          3,
        ),
      );
    }
    yield { geometry: part, material: material as THREE.Material };
  }
  source.dispose();
}

const materialKey = (material: THREE.Material) => {
  const m = material as THREE.MeshStandardMaterial;
  return [
    m.color ? m.color.getHexString() : "ffffff",
    (m.opacity ?? 1).toFixed(3),
    m.transparent ? 1 : 0,
    (m.metalness ?? 0).toFixed(2),
    (m.roughness ?? 0.5).toFixed(2),
    m.side === THREE.DoubleSide ? 2 : 1,
  ].join("|");
};

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

const exportMaterial = (material: THREE.Material) => {
  const key = materialKey(material);
  let result = materialCache.get(key);
  if (!result) {
    const m = material as THREE.MeshStandardMaterial;
    result = new THREE.MeshStandardMaterial({
      color: m.color ? m.color.clone() : new THREE.Color(0xcccccc),
      metalness: Math.min(1, m.metalness ?? 0),
      roughness: Math.min(1, Math.max(0.05, m.roughness ?? 0.5)),
      opacity: m.opacity ?? 1,
      transparent: !!m.transparent || (m.opacity ?? 1) < 1,
      side: m.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide,
    });
    result.name = `LDraw_${(m.color ? m.color.getHexString() : "ffffff")}${
      result.transparent ? "_t" : ""
    }`;
    materialCache.set(key, result);
  }
  return result;
};

const prototypeKey = (piece: Piece) =>
  [
    piece.part,
    piece.modelPart ?? "",
    piece.color,
    piece.sourceColor ?? "",
    piece.embeddedGeometry ? (piece.projectAssetKey ?? "embedded") : "",
  ].join("|");

type PrototypeFilter = {
  /** Only these objects contribute (sub-part export). */
  include?: (object: THREE.Object3D) => boolean;
  /** Geometry is re-centred on this point (the sub-part pivot). */
  shift?: THREE.Vector3;
};

function buildPrototype(
  piece: Piece,
  outlines: boolean,
  filter: PrototypeFilter = {},
): Prototype | undefined {
  piece.mesh.updateMatrixWorld(true);
  const recentre = filter.shift
      ? new THREE.Matrix4().makeTranslation(-filter.shift.x, -filter.shift.y, -filter.shift.z)
      : new THREE.Matrix4(),
    inverse = recentre.multiply(piece.mesh.matrixWorld.clone().invert()),
    buckets = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[] }>(),
    linePositions: number[] = [];
  piece.mesh.traverse((object) => {
    if ((object as THREE.InstancedMesh).isInstancedMesh) return;
    if (filter.include && !filter.include(object)) return;
    if (object instanceof THREE.Mesh) {
      const matrix = inverse.clone().multiply(object.matrixWorld),
        mirrored = matrix.determinant() < 0;
      for (const { geometry, material } of meshTriangleRanges(object)) {
        geometry.applyMatrix4(matrix);
        if (mirrored) flipWinding(geometry);
        if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
        const exported = exportMaterial(material),
          key = materialKey(exported);
        const bucket = buckets.get(key) ?? { material: exported, geometries: [] };
        bucket.geometries.push(geometry);
        buckets.set(key, bucket);
      }
    } else if (outlines && object instanceof THREE.LineSegments) {
      const material = object.material as THREE.Material & { isLDrawConditionalLineMaterial?: boolean };
      const position = object.geometry.getAttribute("position");
      if (!position || material.isLDrawConditionalLineMaterial || !(material as any).color) return;
      const matrix = inverse.clone().multiply(object.matrixWorld),
        point = new THREE.Vector3();
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(matrix);
        linePositions.push(point.x, point.y, point.z);
      }
    }
  });
  if (!buckets.size) return undefined;
  const parts: THREE.BufferGeometry[] = [],
    materials: THREE.Material[] = [];
  buckets.forEach((bucket) => {
    const merged = mergeGeometries(bucket.geometries, false);
    bucket.geometries.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    // Weld duplicate vertices: LDraw triangles are fully unindexed.
    const welded = mergeVertices(merged, 1e-4);
    merged.dispose();
    parts.push(welded);
    materials.push(bucket.material);
  });
  if (!parts.length) return undefined;
  const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts, true);
  if (!geometry) return undefined;
  if (parts.length > 1) parts.forEach((part) => part.dispose());
  geometry.name = safeName(`${piece.part}_${piece.color}`);
  const triangles = (geometry.index ? geometry.index.count : geometry.getAttribute("position").count) / 3,
    result: Prototype = {
      geometry,
      material: materials.length === 1 ? materials[0] : materials,
      triangles,
      vertices: geometry.getAttribute("position").count,
    };
  if (linePositions.length) {
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    result.lines = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0x202428 }),
    );
  }
  return result;
}

export type ExportInput = {
  pieces: Piece[];
  groups: GroupDef[];
  animation: AnimationDoc;
  /** Rubber-band visuals are exported as static meshes. */
  extras?: THREE.Object3D[];
};

/** Builds the scene graph that is serialized (exported separately for tests). */
export function buildExportScene(input: ExportInput, options: ExportOptions) {
  materialCache.clear();
  const root = new THREE.Group();
  root.name = "BrickReelModel";
  const unitScale = options.units === "meters" ? STUD_METERS : 1;
  root.scale.setScalar(unitScale);
  const used = new Set<string>(["BrickReelModel"]);
  const unique = (base: string) => {
    let name = base,
      n = 2;
    while (used.has(name)) name = `${base}_${n++}`;
    used.add(name);
    return name;
  };
  const prototypes = new Map<string, Prototype | null>();
  const groupById = new Map(input.groups.map((group) => [group.id, group])),
    groupNodes = new Map<string, THREE.Object3D>(),
    pieceNodes = new Map<string, THREE.Object3D>(),
    subNodes = new Map<string, THREE.Object3D>(),
    groupNames: ExportResult["groupNames"] = [];
  // Sub-part tracks: pieceId -> animated sub-part keys.
  const animatedSubs = new Map<string, Set<string>>();
  if (options.animation)
    input.animation.tracks.forEach((track) => {
      if (track.target.kind !== "sub" || !track.keys.length) return;
      const { pieceId, key } = splitSubTargetId(track.target.id),
        keys = animatedSubs.get(pieceId) ?? new Set<string>();
      keys.add(key);
      animatedSubs.set(pieceId, keys);
    });
  const members = new Map<string, number>();
  input.pieces.forEach((piece) => {
    if (piece.groupId && groupById.has(piece.groupId))
      members.set(piece.groupId, (members.get(piece.groupId) ?? 0) + 1);
  });
  input.groups.forEach((group) => {
    if (!members.get(group.id)) return;
    const node = new THREE.Group();
    node.name = unique(`Group_${safeName(group.name)}`);
    node.position.fromArray(group.pivot);
    node.userData = { simStudio: { type: "group", id: group.id, name: group.name } };
    root.add(node);
    groupNodes.set(group.id, node);
    groupNames.push({ id: group.id, name: group.name, node: node.name });
  });
  let triangles = 0,
    vertices = 0,
    parts = 0;
  const countedPrototypes = new Set<Prototype>();
  for (const piece of input.pieces) {
    if (!piece.mesh.visible && !piece.renderBatched) continue;
    const animatedKeys = animatedSubs.get(String(piece.id));
    if (animatedKeys) {
      const infos = listSubparts(piece.mesh).filter((info) => animatedKeys.has(info.key));
      if (infos.length) {
        const holder = new THREE.Group(),
          groupOf = piece.groupId ? groupById.get(piece.groupId) : undefined,
          holderParent = groupOf ? groupNodes.get(groupOf.id) : undefined;
        holder.name = unique(`${safeName(piece.part)}_${piece.id}`);
        holder.userData = {
          simStudio: { type: "part", id: piece.id, part: piece.part, name: piece.name, color: piece.color },
        };
        holder.position.copy(piece.mesh.position);
        if (holderParent && groupOf) holder.position.sub(new THREE.Vector3().fromArray(groupOf.pivot));
        holder.quaternion.copy(piece.mesh.quaternion);
        holder.scale.copy(piece.mesh.scale);
        const body = buildPrototype(piece, options.outlines, {
          include: (object) => !(typeof object.userData?.sub === "string" && animatedKeys.has(object.userData.sub)),
        });
        if (body) {
          holder.add(new THREE.Mesh(body.geometry, body.material));
          triangles += body.triangles;
          vertices += body.vertices;
        }
        for (const info of infos) {
          const pivot = subPivot(piece.mesh, info),
            proto = buildPrototype(piece, options.outlines, {
              include: (object) => object.userData?.sub === info.key,
              shift: new THREE.Vector3().fromArray(pivot),
            });
          if (!proto) continue;
          const subNode = new THREE.Group();
          subNode.name = unique(`${holder.name}_Sub_${safeName(info.label)}`);
          subNode.position.fromArray(pivot);
          subNode.userData = { simStudio: { type: "sub", name: `${piece.part} › ${info.label}`, key: info.key } };
          subNode.add(new THREE.Mesh(proto.geometry, proto.material));
          holder.add(subNode);
          subNodes.set(subTargetId(piece.id, info.key), subNode);
          triangles += proto.triangles;
          vertices += proto.vertices;
        }
        (holderParent ?? root).add(holder);
        pieceNodes.set(String(piece.id), holder);
        parts++;
        continue;
      }
    }
    const key = prototypeKey(piece);
    if (!prototypes.has(key)) prototypes.set(key, buildPrototype(piece, options.outlines) ?? null);
    const prototype = prototypes.get(key);
    if (!prototype) continue;
    if (!countedPrototypes.has(prototype)) {
      countedPrototypes.add(prototype);
      triangles += prototype.triangles;
      vertices += prototype.vertices;
    }
    const node = new THREE.Mesh(prototype.geometry, prototype.material);
    node.name = unique(`${safeName(piece.part)}_${piece.id}`);
    node.userData = {
      simStudio: { type: "part", id: piece.id, part: piece.part, name: piece.name, color: piece.color },
    };
    const group = piece.groupId ? groupById.get(piece.groupId) : undefined,
      parent = group ? groupNodes.get(group.id) : undefined;
    node.position.copy(piece.mesh.position);
    if (parent && group) node.position.sub(new THREE.Vector3().fromArray(group.pivot));
    node.quaternion.copy(piece.mesh.quaternion);
    node.scale.copy(piece.mesh.scale);
    if (prototype.lines) node.add(new THREE.LineSegments(prototype.lines.geometry, prototype.lines.material));
    (parent ?? root).add(node);
    pieceNodes.set(String(piece.id), node);
    parts++;
  }
  input.extras?.forEach((extra) => root.add(extra));

  const clips: THREE.AnimationClip[] = [];
  const trackNodes: { node: string; kind: "group" | "piece" | "sub"; label: string; keys: Track["keys"] }[] = [];
  let trackCount = 0;
  if (options.animation) {
    const tracks: THREE.KeyframeTrack[] = [];
    input.animation.tracks.forEach((track) => {
      const node = (
        track.target.kind === "group"
          ? groupNodes
          : track.target.kind === "sub"
            ? subNodes
            : pieceNodes
      ).get(track.target.id);
      if (!node || !track.keys.length) return;
      const built = buildNodeTracks(
        node.name,
        track,
        node.position,
        node.quaternion,
        track.target.kind === "piece",
      );
      tracks.push(built.position, built.quaternion);
      trackNodes.push({
        node: node.name,
        kind: track.target.kind,
        label: String(node.userData?.simStudio?.name ?? node.name),
        keys: track.keys,
      });
      trackCount++;
    });
    if (tracks.length) {
      const clip = new THREE.AnimationClip(CLIP_NAME, input.animation.duration, tracks);
      clips.push(clip);
    }
  }
  root.userData = {
    simStudio: {
      generator: "BrickReel",
      units: options.units,
      unitMeters: unitScale,
      studUnit: 1,
      animation: clips.length
        ? {
            clip: CLIP_NAME,
            duration: input.animation.duration,
            loop: input.animation.loop,
            fps: input.animation.fps,
          }
        : null,
      groups: groupNames,
    },
  };
  return {
    root,
    clips,
    groupNames,
    trackNodes,
    stats: {
      parts,
      groups: groupNodes.size,
      uniqueMeshes: countedPrototypes.size,
      triangles,
      vertices,
      tracks: trackCount,
    },
  };
}

export async function exportGLB(
  input: ExportInput,
  options: ExportOptions,
): Promise<ExportResult> {
  const { root, clips, groupNames, stats } = buildExportScene(input, options);
  const exporter = new GLTFExporter();
  const glb = (await exporter.parseAsync(root, {
    binary: true,
    animations: clips,
    onlyVisible: false,
    maxTextureSize: 256,
  })) as ArrayBuffer;
  return {
    glb,
    groupNames,
    clipName: clips.length ? CLIP_NAME : null,
    stats: { ...stats, bytes: glb.byteLength },
  };
}

/** Copy-paste Three.js usage for the exported file. */
export function usageSnippet(result: Pick<ExportResult, "groupNames" | "clipName">, file: string) {
  const groupLines = result.groupNames
    .slice(0, 6)
    .map((group) => `//   scene.getObjectByName("${group.node}")  // group "${group.name}"`)
    .join("\n");
  return `import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const gltf = await new GLTFLoader().loadAsync("${file}");
scene.add(gltf.scene);
${groupLines ? `\n// Groups are regular nodes you can move or rotate yourself:\n${groupLines}\n` : ""}${
    result.clipName
      ? `
// Play the exported timeline:
const mixer = new THREE.AnimationMixer(gltf.scene);
const clip = THREE.AnimationClip.findByName(gltf.animations, "${result.clipName}");
mixer.clipAction(clip).play();
// in your render loop: mixer.update(clock.getDelta());
`
      : ""
  }`;
}

/** A small stand-alone page that shows the model (animation included). */
export function exampleViewerHtml(file: string, hasAnimation: boolean) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BrickReel model</title>
<style>html,body{margin:0;height:100%;background:#dfe7ed;overflow:hidden}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.4));
const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(7, 10, 9); scene.add(sun);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
const gltf = await new GLTFLoader().loadAsync("${file}");
scene.add(gltf.scene);
const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3()).length() || 1;
controls.target.copy(box.getCenter(new THREE.Vector3()));
camera.position.copy(controls.target).add(new THREE.Vector3(1, 0.8, 1).multiplyScalar(size));
controls.update();
const mixer = new THREE.AnimationMixer(gltf.scene);
${hasAnimation ? "gltf.animations.forEach((clip) => mixer.clipAction(clip).play());" : "// no animation in this file"}
const clock = new THREE.Clock();
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.setAnimationLoop(() => { mixer.update(clock.getDelta()); controls.update(); renderer.render(scene, camera); });
</script></body></html>
`;
}

/** The timeline as a stand-alone Three.js module (see export-code.ts). */
export function exportAnimationCode(input: ExportInput, file: string) {
  const { trackNodes } = buildExportScene(input, { units: "studs", animation: true, outlines: false });
  return animationModule({
    duration: input.animation.duration,
    loop: input.animation.loop,
    fps: input.animation.fps,
    tracks: trackNodes,
    file,
  });
}
