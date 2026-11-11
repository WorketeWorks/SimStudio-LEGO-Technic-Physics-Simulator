/**
 * Editor-side groups and animation preview.
 *
 * Groups are plain ids stored on pieces (`piece.groupId`) plus a GroupDef with
 * a name and rotation pivot. The preview never edits the model: rest poses are
 * captured first and restored on exit.
 */
import * as THREE from "three";
import type { Piece } from "./editor/types";
import { listSubparts, poseSubpart, restoreSubparts, splitSubTargetId, subPivot } from "./subparts.ts";
import {
  sampleTrack,
  type AnimationDoc,
  type GroupDef,
  type Track,
  type Vec3,
} from "./animation.ts";

export type RestPose = { position: THREE.Vector3; quaternion: THREE.Quaternion };

let groupCounter = 0;
export const newGroupId = () => `group-${Date.now().toString(36)}-${groupCounter++}`;

export const groupMembers = (pieces: Piece[], groupId: string) =>
  pieces.filter((piece) => piece.groupId === groupId);

/** World-space centre of the bounding box of the given pieces. */
export function piecesCentre(pieces: Piece[]): Vec3 {
  const box = new THREE.Box3();
  pieces.forEach((piece) => {
    piece.mesh.updateMatrixWorld(true);
    box.expandByPoint(piece.mesh.getWorldPosition(new THREE.Vector3()));
  });
  if (box.isEmpty()) return [0, 0, 0];
  const centre = box.getCenter(new THREE.Vector3());
  return [centre.x, centre.y, centre.z];
}

/**
 * Groups the given pieces. Pieces already in another group are moved out of it
 * (groups do not nest). Returns the new group definition.
 */
export function createGroup(
  pieces: Piece[],
  groups: GroupDef[],
  name?: string,
): GroupDef | undefined {
  if (pieces.length < 2) return undefined;
  const id = newGroupId(),
    group: GroupDef = {
      id,
      name: name?.trim() || `Group ${groups.length + 1}`,
      pivot: piecesCentre(pieces),
    };
  pieces.forEach((piece) => {
    piece.groupId = id;
  });
  groups.push(group);
  return group;
}

/** Removes the group of `piece`; its parts stay in place. Returns removed id. */
export function ungroupPiece(piece: Piece, pieces: Piece[], groups: GroupDef[]) {
  const id = piece.groupId;
  if (!id) return undefined;
  pieces.forEach((member) => {
    if (member.groupId === id) member.groupId = undefined;
  });
  const index = groups.findIndex((group) => group.id === id);
  if (index >= 0) groups.splice(index, 1);
  return id;
}

/**
 * Drops empty / single-part groups and tracks whose target no longer exists.
 * Mutates `groups` and `animation`; returns true if anything changed.
 */
export function pruneGroupsAndTracks(
  pieces: Piece[],
  groups: GroupDef[],
  animation: AnimationDoc,
) {
  let changed = false;
  const counts = new Map<string, number>();
  pieces.forEach((piece) => {
    if (piece.groupId) counts.set(piece.groupId, (counts.get(piece.groupId) ?? 0) + 1);
  });
  for (let i = groups.length - 1; i >= 0; i--) {
    if ((counts.get(groups[i].id) ?? 0) >= 2) continue;
    const id = groups[i].id;
    pieces.forEach((piece) => {
      if (piece.groupId === id) piece.groupId = undefined;
    });
    groups.splice(i, 1);
    changed = true;
  }
  const groupIds = new Set(groups.map((group) => group.id)),
    pieceIds = new Set(pieces.map((piece) => String(piece.id)));
  const keep = animation.tracks.filter((track) =>
    track.target.kind === "group"
      ? groupIds.has(track.target.id)
      : pieceIds.has(
          track.target.kind === "sub"
            ? splitSubTargetId(track.target.id).pieceId
            : track.target.id,
        ),
  );
  if (keep.length !== animation.tracks.length) {
    animation.tracks = keep;
    changed = true;
  }
  return changed;
}

export const captureRest = (pieces: Piece[]) =>
  new Map<Piece, RestPose>(
    pieces.map((piece) => [
      piece,
      { position: piece.mesh.position.clone(), quaternion: piece.mesh.quaternion.clone() },
    ]),
  );

export function restoreRest(rest: Map<Piece, RestPose>) {
  restoreSubparts();
  rest.forEach((pose, piece) => {
    piece.mesh.position.copy(pose.position);
    piece.mesh.quaternion.copy(pose.quaternion);
    piece.mesh.updateMatrixWorld(true);
  });
}

/**
 * Poses every piece for time `t`:
 *   world = pivot + groupOffset + groupRotation * (restLocal + pieceOffset)
 * with the piece rotation `pieceRotation * restRotation` expressed in the
 * group's frame. The exporter produces exactly the same hierarchy.
 */
export function applyPose(
  pieces: Piece[],
  rest: Map<Piece, RestPose>,
  groups: GroupDef[],
  doc: AnimationDoc,
  t: number,
) {
  const groupTracks = new Map<string, Track>(),
    pieceTracks = new Map<string, Track>(),
    groupById = new Map(groups.map((group) => [group.id, group]));
  const subTracks: Track[] = [];
  doc.tracks.forEach((track) => {
    if (track.target.kind === "sub") subTracks.push(track);
    else (track.target.kind === "group" ? groupTracks : pieceTracks).set(track.target.id, track);
  });
  const groupPose = new Map<string, { origin: THREE.Vector3; position: THREE.Vector3; q: THREE.Quaternion }>();
  groupTracks.forEach((track, id) => {
    const group = groupById.get(id);
    if (!group) return;
    const pose = sampleTrack(track, t),
      origin = new THREE.Vector3().fromArray(group.pivot);
    groupPose.set(id, { origin, position: origin.clone().add(pose.p), q: pose.q });
  });
  const local = new THREE.Vector3(),
    localQuat = new THREE.Quaternion();
  for (const piece of pieces) {
    const base = rest.get(piece);
    if (!base) continue;
    const group = piece.groupId ? groupById.get(piece.groupId) : undefined,
      gPose = group ? groupPose.get(group.id) : undefined,
      pTrack = pieceTracks.get(String(piece.id));
    if (!gPose && !pTrack) {
      piece.mesh.position.copy(base.position);
      piece.mesh.quaternion.copy(base.quaternion);
      continue;
    }
    // Position/rotation in the parent frame (group-local, or world if ungrouped).
    local.copy(base.position);
    localQuat.copy(base.quaternion);
    if (group) local.sub(new THREE.Vector3().fromArray(group.pivot));
    if (pTrack) {
      const pose = sampleTrack(pTrack, t);
      local.add(pose.p);
      localQuat.premultiply(pose.q);
    }
    if (gPose) {
      piece.mesh.position.copy(local).applyQuaternion(gPose.q).add(gPose.position);
      piece.mesh.quaternion.copy(gPose.q).multiply(localQuat);
    } else {
      // Ungrouped (or group without a track): `local` was never made pivot-relative.
      piece.mesh.position.copy(local);
      piece.mesh.quaternion.copy(localQuat);
      if (group) piece.mesh.position.add(new THREE.Vector3().fromArray(group.pivot));
    }
  }
  // Sub-parts: posed inside their piece, after the piece itself has moved.
  if (subTracks.length || hadSubs) {
    restoreSubparts();
    const byId = new Map(pieces.map((piece) => [String(piece.id), piece]));
    for (const track of subTracks) {
      const { pieceId, key } = splitSubTargetId(track.target.id),
        piece = byId.get(pieceId);
      if (!piece) continue;
      const info = listSubparts(piece.mesh).find((sub) => sub.key === key);
      if (!info) continue;
      const pose = sampleTrack(track, t);
      poseSubpart(piece.mesh, info, subPivot(piece.mesh, info), pose.p, pose.q);
    }
  }
  hadSubs = subTracks.length > 0;
  pieces.forEach((piece) => piece.mesh.updateMatrixWorld(true));
}
let hadSubs = false;
