/**
 * STL import settings and the geometry preparation behind the import dialog.
 *
 * Pure THREE code (no DOM) so it is shared by the live preview and the final
 * import, and covered by tests. Order of operations:
 *   1. up axis (CAD files are Z-up, the editor is Y-up)
 *   2. rotation in 90 degree steps
 *   3. unit / size scale
 *   4. origin: the chosen point of the shape becomes the piece origin, which is
 *      also where it rotates and where animation pivots start
 *   5. extra offset in studs
 */
import * as THREE from "three";

export type StlUnit = "mm" | "cm" | "in" | "stud" | "fit";
export type StlOrigin = "center" | "bottom" | "top" | "mass" | "file";

export type StlSettings = {
  unit: StlUnit;
  /** Extra scale in percent (100 = unchanged). */
  percent: number;
  /** Longest side in studs when unit = "fit". */
  fitStuds: number;
  up: "z" | "y";
  origin: StlOrigin;
  /** Degrees, multiples of 90, applied about the file origin. */
  rotate: [number, number, number];
  /** Offset in studs added after the origin is set. */
  offset: [number, number, number];
  color: string;
};

export const defaultStlSettings = (): StlSettings => ({
  unit: "mm",
  percent: 100,
  fitStuds: 8,
  up: "z",
  origin: "bottom",
  rotate: [0, 0, 0],
  offset: [0, 0, 0],
  color: "#9ba0a8",
});

/** Studs per source unit (1 stud = 8 mm). */
const UNIT_STUDS: Record<Exclude<StlUnit, "fit">, number> = {
  mm: 1 / 8,
  cm: 10 / 8,
  in: 25.4 / 8,
  stud: 1,
};

/** Centre of volume of a closed triangle mesh (signed tetrahedra). */
export function volumeCentroid(geometry: THREE.BufferGeometry): THREE.Vector3 | null {
  const position = geometry.getAttribute("position");
  if (!position) return null;
  const index = geometry.index,
    count = index ? index.count : position.count,
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    sum = new THREE.Vector3();
  let volume = 0;
  const vertex = (target: THREE.Vector3, i: number) =>
    target.fromBufferAttribute(position, index ? index.getX(i) : i);
  for (let i = 0; i + 2 < count; i += 3) {
    vertex(a, i);
    vertex(b, i + 1);
    vertex(c, i + 2);
    const signed = a.dot(b.clone().cross(c)) / 6;
    volume += signed;
    sum.add(a.clone().add(b).add(c).multiplyScalar(signed / 4));
  }
  return Math.abs(volume) < 1e-9 ? null : sum.divideScalar(volume);
}

const quarterTurns = (degrees: number) => Math.round(degrees / 90) * (Math.PI / 2);

export function prepareStlGeometry(source: THREE.BufferGeometry, settings: StlSettings) {
  const geometry = source.clone();
  if (settings.up === "z") geometry.rotateX(-Math.PI / 2);
  const [rx, ry, rz] = settings.rotate;
  if (rx % 360) geometry.rotateX(quarterTurns(rx));
  if (ry % 360) geometry.rotateY(quarterTurns(ry));
  if (rz % 360) geometry.rotateZ(quarterTurns(rz));

  geometry.computeBoundingBox();
  let factor: number;
  if (settings.unit === "fit") {
    const size = geometry.boundingBox!.getSize(new THREE.Vector3()),
      longest = Math.max(size.x, size.y, size.z, 1e-9);
    factor = Math.max(0.01, settings.fitStuds) / longest;
  } else factor = UNIT_STUDS[settings.unit];
  factor *= Math.max(0.01, settings.percent) / 100;
  geometry.scale(factor, factor, factor);

  geometry.computeBoundingBox();
  const box = geometry.boundingBox!,
    centre = box.getCenter(new THREE.Vector3());
  let origin = new THREE.Vector3();
  switch (settings.origin) {
    case "center":
      origin = centre;
      break;
    case "bottom":
      origin.set(centre.x, box.min.y, centre.z);
      break;
    case "top":
      origin.set(centre.x, box.max.y, centre.z);
      break;
    case "mass":
      origin = volumeCentroid(geometry) ?? centre;
      break;
    case "file":
      break;
  }
  geometry.translate(
    -origin.x + settings.offset[0],
    -origin.y + settings.offset[1],
    -origin.z + settings.offset[2],
  );
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function stlStats(geometry: THREE.BufferGeometry) {
  const box = geometry.boundingBox ?? new THREE.Box3().setFromBufferAttribute(geometry.getAttribute("position") as THREE.BufferAttribute),
    size = box.getSize(new THREE.Vector3());
  const position = geometry.getAttribute("position");
  return {
    triangles: Math.round((geometry.index ? geometry.index.count : position.count) / 3),
    studs: [size.x, size.y, size.z] as [number, number, number],
    mm: [size.x * 8, size.y * 8, size.z * 8] as [number, number, number],
    /** Height of the lowest point above the origin (negative = below). */
    lowest: box.min.y,
  };
}
