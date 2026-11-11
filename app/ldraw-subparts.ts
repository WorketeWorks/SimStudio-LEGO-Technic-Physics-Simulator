/**
 * Connectors read from the LDraw sub-parts a model is built from.
 *
 * The LDraw loader merges primitives (peghole, connhole, axlehol…) into their
 * parent mesh, so complex parts such as the Spike motors lose the exact hole
 * positions and the mesh based detector (ray casts with a time budget) can miss
 * them. The worker walks the file tree instead and reports every placement of a
 * hole primitive; this module turns those placements into connectors.
 *
 * Everything here is pure data (no THREE objects) so it can run in the worker.
 */

export type SubpartHit = { fileName: string; matrix: number[] };

export type SubpartConnector = {
  /** Position in the part's editor frame (studs). */
  local: [number, number, number];
  /** Unit axis in the part's editor frame. */
  axis: [number, number, number];
  kind: "round" | "axle";
  role: "socket";
  diameter: number;
  length: number;
};

const baseName = (fileName: string) =>
  fileName
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/\.dat$/, "");

const GEOMETRIC = /^(\d+-\d+|\d+\w*-\d+|stud\d*|box\d|rect\d|ring\d|cyli|cylo|disc|edge|chrd|ndis|tang|tri\d|sphe|tors|torus|con\d|rin\d)/;
const ROUND_HOLE = /^(connhole|connhol\d|npeghole|npeghol\d+\w*)$/;
const AXLE_HOLE = /^(axlehole|axlehol\d|axl\dhole|axl\dhol\d+|axl\dho\d+)$/;
const PEG_END = /^peghole$/;

/** 'hit' = report this placement, 'skip' = ignore, 'walk' = look inside. */
export function classifySubpart(fileName: string): "hit" | "skip" | "walk" {
  const name = baseName(fileName);
  if (ROUND_HOLE.test(name) || AXLE_HOLE.test(name) || PEG_END.test(name)) return "hit";
  if (GEOMETRIC.test(name) || /^(axle|axleend|confric|connect|stud)/.test(name)) return "skip";
  return "walk";
}

const STUD_PER_LDU = 0.05;

/**
 * LDraw (Y down) to the editor wrapper frame: the model is rotated by PI about X
 * and scaled by 0.05 (see prepareModel in page.tsx).
 */
const toEditor = (x: number, y: number, z: number): [number, number, number] => [
  x * STUD_PER_LDU,
  -y * STUD_PER_LDU,
  -z * STUD_PER_LDU,
];

const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Column-major Matrix4 array: origin and (normalised) local +Y direction. */
function placement(matrix: number[]) {
  const origin = toEditor(matrix[12], matrix[13], matrix[14]),
    raw: [number, number, number] = [matrix[4], matrix[5], matrix[6]],
    length = Math.hypot(raw[0], raw[1], raw[2]) || 1,
    axis = toEditor(raw[0] / length, raw[1] / length, raw[2] / length);
  // toEditor scales by 0.05; renormalise.
  const axisLength = Math.hypot(axis[0], axis[1], axis[2]) || 1;
  return {
    origin,
    axis: [axis[0] / axisLength, axis[1] / axisLength, axis[2] / axisLength] as [
      number,
      number,
      number,
    ],
  };
}

const sameHole = (a: SubpartConnector, b: SubpartConnector) => {
  if (Math.abs(dot(a.axis, b.axis)) < 0.98) return false;
  const d = [b.local[0] - a.local[0], b.local[1] - a.local[1], b.local[2] - a.local[2]],
    along = Math.abs(dot(d, a.axis)),
    lateral = Math.sqrt(Math.max(0, dot(d, d) - along * along));
  return lateral < 0.12 && along < 1.05;
};

export function subpartConnectors(hits: SubpartHit[]): SubpartConnector[] {
  const result: SubpartConnector[] = [],
    ends: { origin: [number, number, number]; axis: [number, number, number] }[] = [];
  const add = (connector: SubpartConnector) => {
    if (!result.some((existing) => sameHole(existing, connector))) result.push(connector);
  };
  for (const hit of hits) {
    const name = baseName(hit.fileName),
      { origin, axis } = placement(hit.matrix);
    if (ROUND_HOLE.test(name))
      add({ local: origin, axis, kind: "round", role: "socket", diameter: 0.8, length: 1 });
    else if (AXLE_HOLE.test(name))
      add({ local: origin, axis, kind: "axle", role: "socket", diameter: 0.6, length: 1 });
    else if (PEG_END.test(name)) ends.push({ origin, axis });
  }
  // Two facing peg-hole ends on one line form a through hole.
  const used = new Set<number>();
  for (let i = 0; i < ends.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < ends.length; j++) {
      if (used.has(j) || dot(ends[i].axis, ends[j].axis) > -0.98) continue;
      const d = [
          ends[j].origin[0] - ends[i].origin[0],
          ends[j].origin[1] - ends[i].origin[1],
          ends[j].origin[2] - ends[i].origin[2],
        ],
        span = Math.abs(dot(d, ends[i].axis)),
        lateral = Math.sqrt(Math.max(0, dot(d, d) - span * span));
      if (lateral > 0.1 || span < 0.2 || span > 3.2) continue;
      used.add(i);
      used.add(j);
      add({
        local: [
          (ends[i].origin[0] + ends[j].origin[0]) / 2,
          (ends[i].origin[1] + ends[j].origin[1]) / 2,
          (ends[i].origin[2] + ends[j].origin[2]) / 2,
        ],
        axis: ends[i].axis,
        kind: "round",
        role: "socket",
        diameter: 0.8,
        length: span,
      });
      break;
    }
  }
  return result;
}

/**
 * Adds the sub-part connectors that the mesh based detector did not find (same
 * axis and position within tolerance counts as found).
 */
export function mergeSubpartConnectors<
  T extends { local: { x: number; y: number; z: number }; axis: { x: number; y: number; z: number } },
>(existing: T[], extra: SubpartConnector[]) {
  return extra.filter(
    (candidate) =>
      !existing.some((connector) =>
        sameHole(
          { ...candidate, local: [connector.local.x, connector.local.y, connector.local.z], axis: [connector.axis.x, connector.axis.y, connector.axis.z] },
          candidate,
        ),
      ),
  );
}
