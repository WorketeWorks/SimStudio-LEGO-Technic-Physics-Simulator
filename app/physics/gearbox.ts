import * as THREE from "three";
import type { Connection, Piece, RuntimeGearLink } from "../editor/types";

const referencesFor = (piece: Piece) =>
  new Set(
    [piece.part, piece.modelPart, piece.resolvedPart]
      .filter(Boolean)
      .map((reference) => reference!.toLowerCase().replace(/\.dat$/, "")),
  );

const hasReference = (piece: Piece, references: readonly string[]) => {
  const available = referencesFor(piece);
  return references.some((reference) => available.has(reference));
};

type GearboxSpec = {
  rings: readonly string[];
  carriers: readonly string[];
  targets: readonly string[];
  targetDistance: number;
};

const gearboxSpecs: readonly GearboxSpec[] = [
  {
    rings: ["6539"],
    carriers: ["6538", "6538a"],
    targets: ["32187", "6542", "6542a", "35185"],
    targetDistance: 1.5,
  },
  {
    rings: ["18947"],
    carriers: ["26287"],
    targets: ["6542", "6542a", "35185"],
    targetDistance: 2,
  },
];

const specForRing = (piece: Piece) =>
  gearboxSpecs.find((spec) => hasReference(piece, spec.rings));

const axleAxis = (piece: Piece) => {
  piece.mesh.updateMatrixWorld(true);
  const connector = piece.connectors.find((candidate) => candidate.kind === "axle"),
    cylinder = [...piece.colliders, ...piece.gearColliders].find(
      (candidate) => candidate.shape === "cylinder",
    ),
    local = connector
      ? connector.axis.clone()
      : new THREE.Vector3(0, 1, 0).applyQuaternion(
          cylinder?.rotation ?? new THREE.Quaternion(),
        );
  return local.transformDirection(piece.mesh.matrixWorld).normalize();
};

const centre = (piece: Piece) => {
  piece.mesh.updateMatrixWorld(true);
  return piece.mesh.localToWorld(new THREE.Vector3());
};

export const isGearboxRing = (piece: Piece) => specForRing(piece) !== undefined;

export const hasGearboxRing = (pieces: Piece[]) => pieces.some(isGearboxRing);

export const isGearboxCarrierPair = (left: Piece, right: Piece) =>
  gearboxSpecs.some(
    (spec) =>
      (hasReference(left, spec.rings) && hasReference(right, spec.carriers)) ||
      (hasReference(right, spec.rings) && hasReference(left, spec.carriers)),
  );

export const isGearboxRigidExtensionPair = (left: Piece, right: Piece) =>
  hasReference(left, ["35186"]) && hasReference(right, ["35186"]);

export const isGearboxRotatingExtensionPair = (left: Piece, right: Piece) =>
  (hasReference(left, ["32187"]) && hasReference(right, ["35186"])) ||
  (hasReference(right, ["32187"]) && hasReference(left, ["35186"])) ||
  (hasReference(left, ["35186"]) &&
    hasReference(right, ["6542", "6542a", "35185"])) ||
  (hasReference(right, ["35186"]) &&
    hasReference(left, ["6542", "6542a", "35185"]));

export type GearboxSelectorPair = {
  ring: Piece;
  selector: Piece;
  layout: "coaxial" | "parallel";
};

/**
 * The 35188 wave selector is carried by an axle, but its rim sits in the
 * driving-ring groove. This is a cam contact rather than an editor joint.
 * Accept both official mounting layouts: in-line and on a nearby parallel
 * axle. A selector may operate one ring on either side.
 */
export const detectGearboxSelectorPairs = (
  pieces: Piece[],
): GearboxSelectorPair[] =>
  pieces
    .filter((piece) => hasReference(piece, ["35188"]))
    .flatMap((selector) => {
      const selectorCenter = centre(selector),
        selectorAxis = axleAxis(selector);
      return pieces.flatMap((ring) => {
        if (ring === selector || !isGearboxRing(ring)) return [];
        const ringCenter = centre(ring),
          ringAxis = axleAxis(ring),
          alignment = Math.abs(selectorAxis.dot(ringAxis)),
          offset = alignedAxialOffset(selectorCenter, selectorAxis, ringCenter),
          axialDistance = Math.abs(offset.along);
        if (alignment < 0.985) return [];
        if (offset.radial <= 0.18 && axialDistance >= 0.35 && axialDistance <= 2.25)
          return [{ ring, selector, layout: "coaxial" as const }];
        if (axialDistance <= 0.2 && offset.radial >= 1.25 && offset.radial <= 2.5)
          return [{ ring, selector, layout: "parallel" as const }];
        return [];
      });
    });

/** Runtime parameters for the sliding ring/catch joint. */
export const gearboxDetentForConnection = (connection: Connection) => {
  if (!isGearboxCarrierPair(connection.a, connection.b)) return undefined;
  const ring = specForRing(connection.a) ? connection.a : connection.b,
    carrier = ring === connection.a ? connection.b : connection.a,
    axis = axleAxis(carrier),
    initialOffset = centre(ring).sub(centre(carrier)).dot(axis);

  // Rapier measures B relative to A. Reverse the authored ring offset when the
  // ring is body A so all three absolute gearbox positions remain reachable,
  // even when a model starts already in first or third gear.
  const direction = ring === connection.a ? -1 : 1;
  return {
    positions: [-0.5, 0, 0.5].map((position) => {
      const offset = direction * (position - initialOffset);
      return Math.abs(offset) < 1e-9 ? 0 : offset;
    }),
    force: 18,
  };
};

const alignedAxialOffset = (
  origin: THREE.Vector3,
  axis: THREE.Vector3,
  candidate: THREE.Vector3,
) => {
  const delta = candidate.clone().sub(origin),
    along = delta.dot(axis),
    radial = delta.clone().addScaledVector(axis, -along).length();
  return { along, radial };
};

type GearboxAssembly = {
  spec: GearboxSpec;
  ring: Piece;
  ringCenter: THREE.Vector3;
  ringAxis: THREE.Vector3;
  carrier: Piece;
  carrierCenter: THREE.Vector3;
  carrierAxis: THREE.Vector3;
  offset: number;
};

const gearboxAssemblyForRing = (
  pieces: Piece[],
  ring: Piece,
): GearboxAssembly | undefined => {
  const spec = specForRing(ring);
  if (!spec) return undefined;
  const ringCenter = centre(ring),
    ringAxis = axleAxis(ring),
    carriers = pieces
      .filter((piece) => piece !== ring && hasReference(piece, spec.carriers))
      .flatMap((carrier) => {
        const carrierCenter = centre(carrier),
          carrierAxis = axleAxis(carrier),
          alignment = Math.abs(ringAxis.dot(carrierAxis)),
          offset = alignedAxialOffset(carrierCenter, carrierAxis, ringCenter);
        return alignment >= 0.985 && offset.radial <= 0.12 && Math.abs(offset.along) <= 0.72
          ? [{ carrier, carrierCenter, carrierAxis, offset: offset.along }]
          : [];
      })
      .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
  const assembly = carriers[0];
  return assembly
    ? { spec, ring, ringCenter, ringAxis, ...assembly }
    : undefined;
};

const gearboxTargets = (pieces: Piece[], assembly: GearboxAssembly) =>
  pieces.flatMap((target) => {
    if (
      target === assembly.ring ||
      target === assembly.carrier ||
      !hasReference(target, assembly.spec.targets)
    )
      return [];
    const targetCenter = centre(target),
      targetAxis = axleAxis(target),
      targetOffset = alignedAxialOffset(
        assembly.carrierCenter,
        assembly.carrierAxis,
        targetCenter,
      );
    return Math.abs(assembly.carrierAxis.dot(targetAxis)) >= 0.985 &&
      targetOffset.radial <= 0.12 &&
      Math.abs(Math.abs(targetOffset.along) - assembly.spec.targetDistance) <= 0.18
      ? [{ target, targetCenter, targetAxis, targetOffset }]
      : [];
  });

const extensionCouplingPairs = (pieces: Piece[]) => {
  const pairs: { a: Piece; b: Piece; expectedDistance: number }[] = [];
  for (let index = 0; index < pieces.length; index++)
    for (let otherIndex = index + 1; otherIndex < pieces.length; otherIndex++) {
      const a = pieces[index],
        b = pieces[otherIndex];
      if (!isGearboxRotatingExtensionPair(a, b)) continue;
      const extension = hasReference(a, ["35186"]) ? a : b,
        other = extension === a ? b : a,
        expectedDistance = hasReference(other, ["32187"]) ? 1 : 0.7,
        extensionCenter = centre(extension),
        extensionAxis = axleAxis(extension),
        otherCenter = centre(other),
        otherAxis = axleAxis(other),
        offset = alignedAxialOffset(extensionCenter, extensionAxis, otherCenter);
      if (
        Math.abs(extensionAxis.dot(otherAxis)) >= 0.985 &&
        offset.radial <= 0.12 &&
        Math.abs(Math.abs(offset.along) - expectedDistance) <= 0.2
      )
        pairs.push({ a: extension, b: other, expectedDistance });
    }
  return pairs;
};

const extensionCouplingLink = (
  a: Piece,
  b: Piece,
  expectedDistance: number,
): RuntimeGearLink => {
  const centerA = centre(a),
    centerB = centre(b),
    axisA = axleAxis(a),
    axisB = axleAxis(b);
  if (axisA.dot(axisB) < 0) axisB.negate();
  const inverseA = a.mesh.matrixWorld.clone().invert(),
    inverseB = b.mesh.matrixWorld.clone().invert();
  return {
    a: {
      value: a,
      spec: { teeth: 1, kind: "spur", pitchRadius: 0 },
      center: centerA.toArray(),
      axis: axisA.toArray(),
    },
    b: {
      value: b,
      spec: { teeth: 1, kind: "spur", pitchRadius: 0 },
      center: centerB.toArray(),
      axis: axisB.toArray(),
    },
    ratio: 1,
    centerDistance: centerA.distanceTo(centerB),
    expectedDistance,
    distanceError: Math.abs(centerA.distanceTo(centerB) - expectedDistance),
    axisA,
    axisB,
    localCenterA: centerA.clone().applyMatrix4(inverseA),
    localCenterB: centerB.clone().applyMatrix4(inverseB),
    localAxisA: axisA.clone().transformDirection(inverseA),
    localAxisB: axisB.clone().transformDirection(inverseB),
    signB: -1,
    perpendicular: false,
    coaxialClutch: true,
    // Eight equally-spaced tabs leave half the angular freedom of 6539.
    backlash: Math.PI / 8,
  };
};

/**
 * Collider pairs that overlap by design while a driving ring enters a clutch.
 * Their rotational contact is represented by the dog-clutch constraint, not
 * by Rapier's solid approximation of both detailed LDraw meshes.
 */
export const gearboxContactExclusionPairs = (pieces: Piece[]): [Piece, Piece][] =>
  [
    ...pieces.filter(isGearboxRing).flatMap((ring) => {
      const assembly = gearboxAssemblyForRing(pieces, ring);
      return assembly
        ? gearboxTargets(pieces, assembly).map(({ target }) =>
            [ring, target] as [Piece, Piece],
          )
        : [];
    }),
    ...detectGearboxSelectorPairs(pieces).map(
      ({ ring, selector }) => [ring, selector] as [Piece, Piece],
    ),
    ...extensionCouplingPairs(pieces).map(
      ({ a, b }) => [a, b] as [Piece, Piece],
    ),
  ];

/**
 * Finds engaged driving-ring dog clutches.
 *
 * The target is selected from its authored axial side, while the ring must be
 * in the matching ±0.5-stud detent. The returned 1:1 coaxial link is solved as
 * a four-dog clutch, so its tabs can move through ±45 degrees before contact.
 */
export const detectGearboxLinks = (
  pieces: Piece[],
  rigidIslandByPiece?: Map<Piece, Piece[]>,
): RuntimeGearLink[] => {
  const links: RuntimeGearLink[] = [];
  for (const ring of pieces.filter(isGearboxRing)) {
    const assembly = gearboxAssemblyForRing(pieces, ring);
    if (!assembly || Math.abs(assembly.offset) < 0.3) continue;
    const side = Math.sign(assembly.offset),
      axis = assembly.carrierAxis.clone();
    if (axis.dot(assembly.ringAxis) < 0) axis.negate();

    for (const { target, targetCenter, targetAxis, targetOffset } of gearboxTargets(
      pieces,
      assembly,
    )) {
      if (
        rigidIslandByPiece &&
        rigidIslandByPiece.get(ring) === rigidIslandByPiece.get(target)
      )
        continue;
      if (Math.sign(targetOffset.along) !== side) continue;
      const inverseRing = ring.mesh.matrixWorld.clone().invert(),
        inverseTarget = target.mesh.matrixWorld.clone().invert(),
        targetAxisAligned = targetAxis.clone();
      if (axis.dot(targetAxisAligned) < 0) targetAxisAligned.negate();
      links.push({
        a: {
          value: ring,
          spec: { teeth: 1, kind: "spur", pitchRadius: 0 },
          center: assembly.ringCenter.toArray(),
          axis: axis.toArray(),
        },
        b: {
          value: target,
          spec: { teeth: 1, kind: "spur", pitchRadius: 0 },
          center: targetCenter.toArray(),
          axis: targetAxisAligned.toArray(),
        },
        ratio: 1,
        centerDistance: assembly.ringCenter.distanceTo(targetCenter),
        expectedDistance: assembly.spec.targetDistance - 0.5,
        distanceError: Math.abs(
          Math.abs(targetOffset.along) - assembly.spec.targetDistance,
        ),
        axisA: axis,
        axisB: targetAxisAligned,
        localCenterA: assembly.ringCenter.clone().applyMatrix4(inverseRing),
        localCenterB: targetCenter.clone().applyMatrix4(inverseTarget),
        localAxisA: axis.clone().transformDirection(inverseRing),
        localAxisB: targetAxisAligned.clone().transformDirection(inverseTarget),
        signB: -1,
        perpendicular: false,
        coaxialClutch: true,
        backlash: Math.PI / 4,
      });
    }
  }
  for (const { a, b, expectedDistance } of extensionCouplingPairs(pieces)) {
    if (rigidIslandByPiece && rigidIslandByPiece.get(a) === rigidIslandByPiece.get(b))
      continue;
    links.push(extensionCouplingLink(a, b, expectedDistance));
  }
  return links;
};
