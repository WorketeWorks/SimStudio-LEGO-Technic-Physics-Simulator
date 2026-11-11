/**
 * Keyframe animation for groups and parts.
 *
 * A track targets a group (or a single part) and stores keyframes made of a
 * position offset (scene units = studs) and a rotation vector in degrees
 * (axis x angle). Offsets are relative to the rest pose, so the model itself is
 * never modified by the animation. The same data drives the in-editor preview
 * and the exported glTF/GLB animation.
 */
import * as THREE from "three";

export type Ease = "linear" | "easeInOut" | "step";

export type Vec3 = [number, number, number];

export type Keyframe = {
  /** Seconds from the start of the animation. */
  t: number;
  /** Position offset from the rest pose, in studs. */
  p: Vec3;
  /** Rotation vector in degrees: direction = axis, length = angle. */
  r: Vec3;
  /** How this key blends into the NEXT key. */
  e: Ease;
};

/**
 * "sub" targets one sub-part of a piece: id = `<pieceId>|<subKey>` (see
 * subparts.ts). Its pose is relative to the piece, in the piece's local frame.
 */
export type TrackTarget = { kind: "group" | "piece" | "sub"; id: string };

export type Track = {
  id: string;
  target: TrackTarget;
  keys: Keyframe[];
};

export type AnimationDoc = {
  duration: number;
  loop: boolean;
  fps: number;
  tracks: Track[];
};

export type GroupDef = {
  id: string;
  name: string;
  /** World pivot (rest pose) the group rotates about. */
  pivot: Vec3;
};

export const MIN_DURATION = 0.1;
export const MAX_DURATION = 600;

export const emptyAnimation = (): AnimationDoc => ({
  duration: 5,
  loop: true,
  fps: 30,
  tracks: [],
});

export const cloneAnimation = (doc: AnimationDoc): AnimationDoc => ({
  ...doc,
  tracks: doc.tracks.map((track) => ({
    ...track,
    target: { ...track.target },
    keys: track.keys.map((key) => ({ ...key, p: [...key.p], r: [...key.r] }) as Keyframe),
  })),
});

export const cloneGroups = (groups: GroupDef[]): GroupDef[] =>
  groups.map((group) => ({ ...group, pivot: [...group.pivot] as Vec3 }));

const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const tuple3 = (value: unknown): Vec3 => {
  const source = Array.isArray(value) ? value : [];
  return [finite(source[0], 0), finite(source[1], 0), finite(source[2], 0)];
};

const EASES: Ease[] = ["linear", "easeInOut", "step"];

/** Validates untrusted data (project files) into a well-formed document. */
export function sanitizeAnimation(value: unknown): AnimationDoc {
  const source = (value && typeof value === "object" ? value : {}) as Partial<AnimationDoc>;
  const duration = Math.min(
    MAX_DURATION,
    Math.max(MIN_DURATION, finite(source.duration, 5)),
  );
  const tracks: Track[] = [];
  for (const raw of Array.isArray(source.tracks) ? source.tracks : []) {
    const track = raw as Partial<Track>;
    const kind =
        track.target?.kind === "piece" ? "piece" : track.target?.kind === "sub" ? "sub" : "group",
      id = typeof track.target?.id === "string" ? track.target.id : "";
    if (!id) continue;
    const keys = (Array.isArray(track.keys) ? track.keys : [])
      .map((rawKey) => {
        const key = rawKey as Partial<Keyframe>;
        return {
          t: Math.min(duration, Math.max(0, finite(key.t, 0))),
          p: tuple3(key.p),
          r: tuple3(key.r),
          e: EASES.includes(key.e as Ease) ? (key.e as Ease) : "linear",
        } satisfies Keyframe;
      })
      .sort((a, b) => a.t - b.t);
    if (!keys.length) continue;
    tracks.push({
      id: typeof track.id === "string" && track.id ? track.id : `track-${tracks.length + 1}`,
      target: { kind, id },
      keys,
    });
  }
  return {
    duration,
    loop: source.loop !== false,
    fps: Math.min(120, Math.max(1, Math.round(finite(source.fps, 30)))),
    tracks,
  };
}

export const sanitizeGroups = (value: unknown): GroupDef[] => {
  const seen = new Set<string>();
  const groups: GroupDef[] = [];
  for (const raw of Array.isArray(value) ? value : []) {
    const group = raw as Partial<GroupDef>;
    if (typeof group.id !== "string" || !group.id || seen.has(group.id)) continue;
    seen.add(group.id);
    groups.push({
      id: group.id,
      name:
        typeof group.name === "string" && group.name.trim()
          ? group.name.trim().slice(0, 40)
          : `Group ${groups.length + 1}`,
      pivot: tuple3(group.pivot),
    });
  }
  return groups;
};

export const easeValue = (ease: Ease, u: number) => {
  if (ease === "step") return 0;
  if (ease === "easeInOut") return u * u * (3 - 2 * u);
  return u;
};

const rotationFromVector = (r: Vec3, target = new THREE.Quaternion()) => {
  const angle = Math.hypot(r[0], r[1], r[2]);
  if (angle < 1e-9) return target.identity();
  return target.setFromAxisAngle(
    new THREE.Vector3(r[0] / angle, r[1] / angle, r[2] / angle),
    THREE.MathUtils.degToRad(angle),
  );
};

export type Pose = { p: THREE.Vector3; q: THREE.Quaternion };

/** Pose offset of one track at time `t` (holds first/last key outside the range). */
export function sampleTrack(track: Track, t: number): Pose {
  const keys = track.keys,
    pose: Pose = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  if (!keys.length) return pose;
  const set = (p: Vec3, r: Vec3) => {
    pose.p.set(p[0], p[1], p[2]);
    rotationFromVector(r, pose.q);
    return pose;
  };
  if (t <= keys[0].t) return set(keys[0].p, keys[0].r);
  const last = keys[keys.length - 1];
  if (t >= last.t) return set(last.p, last.r);
  let index = 0;
  while (index < keys.length - 2 && t >= keys[index + 1].t) index++;
  const a = keys[index],
    b = keys[index + 1],
    span = b.t - a.t,
    u = span > 1e-9 ? easeValue(a.e, (t - a.t) / span) : 1;
  return set(
    [
      a.p[0] + (b.p[0] - a.p[0]) * u,
      a.p[1] + (b.p[1] - a.p[1]) * u,
      a.p[2] + (b.p[2] - a.p[2]) * u,
    ],
    [
      a.r[0] + (b.r[0] - a.r[0]) * u,
      a.r[1] + (b.r[1] - a.r[1]) * u,
      a.r[2] + (b.r[2] - a.r[2]) * u,
    ],
  );
}

export const findTrack = (doc: AnimationDoc, target: TrackTarget) =>
  doc.tracks.find(
    (track) => track.target.kind === target.kind && track.target.id === target.id,
  );

let trackCounter = 0;
export const newTrackId = () => `track-${Date.now().toString(36)}-${trackCounter++}`;

/** Adds (or replaces, if one already exists at ~the same time) a key. */
export function upsertKey(track: Track, key: Keyframe) {
  const existing = track.keys.findIndex((candidate) => Math.abs(candidate.t - key.t) < 1e-3);
  if (existing >= 0) track.keys[existing] = key;
  else {
    track.keys.push(key);
    track.keys.sort((a, b) => a.t - b.t);
  }
}

/** Key at `t` holding the pose the track currently produces there. */
export function keyAt(track: Track | undefined, t: number): Keyframe {
  if (!track || !track.keys.length) return { t, p: [0, 0, 0], r: [0, 0, 0], e: "linear" };
  // Re-express the interpolated pose as position + rotation vector, using the
  // same lerp the sampler uses so the new key does not change the motion.
  const keys = track.keys;
  let p: Vec3, r: Vec3, e: Ease = "linear";
  if (t <= keys[0].t) ({ p, r } = keys[0]);
  else if (t >= keys[keys.length - 1].t) ({ p, r } = keys[keys.length - 1]);
  else {
    let index = 0;
    while (index < keys.length - 2 && t >= keys[index + 1].t) index++;
    const a = keys[index],
      b = keys[index + 1],
      span = b.t - a.t,
      u = span > 1e-9 ? easeValue(a.e, (t - a.t) / span) : 1;
    p = [0, 1, 2].map((i) => a.p[i] + (b.p[i] - a.p[i]) * u) as Vec3;
    r = [0, 1, 2].map((i) => a.r[i] + (b.r[i] - a.r[i]) * u) as Vec3;
    e = a.e;
  }
  return { t, p: [...p], r: [...r], e };
}

/**
 * Keys for a constant-speed spin of `turns` full revolutions about a world axis
 * over the whole animation. Handy for gears, wheels and rotors.
 */
export function spinKeys(axis: Vec3, turns: number, duration: number): Keyframe[] {
  const length = Math.hypot(axis[0], axis[1], axis[2]) || 1,
    unit: Vec3 = [axis[0] / length, axis[1] / length, axis[2] / length],
    degrees = 360 * turns;
  return [
    { t: 0, p: [0, 0, 0], r: [0, 0, 0], e: "linear" },
    {
      t: duration,
      p: [0, 0, 0],
      r: [unit[0] * degrees, unit[1] * degrees, unit[2] * degrees],
      e: "linear",
    },
  ];
}

/**
 * Samples a track into the discrete times a glTF exporter needs. glTF only
 * interpolates linearly (or steps), so eased segments are subdivided and
 * rotations are split so that no step turns more than 45 degrees.
 */
export function bakeTrackTimes(track: Track): number[] {
  const times = new Set<number>(),
    round = (value: number) => Math.round(value * 1e5) / 1e5,
    keys = track.keys;
  keys.forEach((key) => times.add(round(key.t)));
  for (let i = 0; i + 1 < keys.length; i++) {
    const a = keys[i],
      b = keys[i + 1],
      span = b.t - a.t;
    if (span <= 1e-6) continue;
    if (a.e === "step") {
      times.add(round(Math.max(a.t, b.t - 1e-4)));
      continue;
    }
    const angle = Math.hypot(b.r[0] - a.r[0], b.r[1] - a.r[1], b.r[2] - a.r[2]);
    let divisions = Math.max(1, Math.ceil(angle / 45));
    if (a.e === "easeInOut") divisions = Math.max(divisions, 8);
    for (let step = 1; step < divisions; step++) times.add(round(a.t + (span * step) / divisions));
  }
  return [...times].sort((x, y) => x - y);
}

/** Builds THREE tracks (position + quaternion) for a node at rest `base`. */
export function buildNodeTracks(
  nodeName: string,
  track: Track,
  baseTranslation: THREE.Vector3,
  baseQuaternion: THREE.Quaternion,
  /** Whether the node's own rotation composes with the base (pieces) or not (group pivots). */
  composeRotation: boolean,
) {
  const times = bakeTrackTimes(track),
    positions: number[] = [],
    rotations: number[] = [],
    q = new THREE.Quaternion(),
    previous = new THREE.Quaternion();
  times.forEach((time, index) => {
    const pose = sampleTrack(track, time),
      p = baseTranslation.clone().add(pose.p);
    q.copy(composeRotation ? pose.q.clone().multiply(baseQuaternion) : pose.q);
    // Keep consecutive quaternions in the same hemisphere so glTF's shortest-path
    // slerp follows the intended direction.
    if (index > 0 && previous.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
    previous.copy(q);
    positions.push(p.x, p.y, p.z);
    rotations.push(q.x, q.y, q.z, q.w);
  });
  return {
    position: new THREE.VectorKeyframeTrack(`${nodeName}.position`, times, positions),
    quaternion: new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, rotations),
  };
}
