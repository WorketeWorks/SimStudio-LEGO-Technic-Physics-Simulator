import * as THREE from "three";
import type { CollisionPrimitive } from "./connectors";

export type AnnularCollisionSegment = {
  center: THREE.Vector3;
  size: THREE.Vector3;
  rotation: THREE.Quaternion;
};

export type ArcControlPoints = [[number, number], [number, number], [number, number]];

const pointOnArc = (radius: number, angle: number): [number, number] => [
  Math.cos(angle) * radius,
  -Math.sin(angle) * radius,
];

/** Returns explicit points, or derives three editable points from a legacy arc. */
export const arcCollisionControlPoints = (
  primitive: CollisionPrimitive,
): ArcControlPoints => {
  if (
    primitive.arcPoints?.length === 3 &&
    primitive.arcPoints.every(
      (point) =>
        point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]),
    )
  )
    return primitive.arcPoints.map((point) => [...point]) as ArcControlPoints;
  const outerRadius = Math.max(0.02, primitive.radius ?? 0.6),
    innerRadius = THREE.MathUtils.clamp(
      primitive.innerRadius ?? outerRadius * 0.55,
      0.01,
      outerRadius - 0.01,
    ),
    radius = (outerRadius + innerRadius) / 2,
    start = THREE.MathUtils.degToRad(primitive.startAngle ?? 0),
    sweep = THREE.MathUtils.degToRad(
      Math.sign(primitive.arcAngle ?? 90) *
        THREE.MathUtils.clamp(Math.abs(primitive.arcAngle ?? 90), 1, 359.9),
    );
  return [
    pointOnArc(radius, start),
    pointOnArc(radius, start + sweep / 2),
    pointOnArc(radius, start + sweep),
  ];
};

const threePointArc = (primitive: CollisionPrimitive) => {
  const points = arcCollisionControlPoints(primitive),
    [[x1, z1], [x2, z2], [x3, z3]] = points,
    divisor = 2 * (x1 * (z2 - z3) + x2 * (z3 - z1) + x3 * (z1 - z2));
  if (Math.abs(divisor) < 1e-7) return undefined;
  const square1 = x1 * x1 + z1 * z1,
    square2 = x2 * x2 + z2 * z2,
    square3 = x3 * x3 + z3 * z3,
    centerX = (square1 * (z2 - z3) + square2 * (z3 - z1) + square3 * (z1 - z2)) / divisor,
    centerZ = (square1 * (x3 - x2) + square2 * (x1 - x3) + square3 * (x2 - x1)) / divisor,
    angleFor = (x: number, z: number) => Math.atan2(-(z - centerZ), x - centerX),
    start = angleFor(x1, z1),
    middle = angleFor(x2, z2),
    end = angleFor(x3, z3),
    fullTurn = Math.PI * 2,
    modulo = (value: number) => ((value % fullTurn) + fullTurn) % fullTurn,
    endForward = modulo(end - start),
    middleForward = modulo(middle - start),
    sweep = middleForward <= endForward + 1e-7 ? endForward : endForward - fullTurn,
    radius = Math.hypot(x1 - centerX, z1 - centerZ);
  if (!Number.isFinite(radius) || radius < 0.01 || Math.abs(sweep) < 1e-5)
    return undefined;
  return { centerX, centerZ, radius, start, sweep };
};

/**
 * Converts a hollow cylinder or annular arc into tangent boxes. Rapier treats
 * each box as one member of the same compound body, preserving the empty bore.
 */
export const annularCollisionSegments = (
  primitive: CollisionPrimitive,
): AnnularCollisionSegment[] => {
  if (primitive.shape !== "hollowCylinder" && primitive.shape !== "arc") return [];
  const pointArc = primitive.shape === "arc" ? threePointArc(primitive) : undefined;
  if (primitive.shape === "arc" && primitive.arcPoints && !pointArc) {
    const points = arcCollisionControlPoints(primitive),
      thickness = Math.max(0.01, primitive.arcThickness ?? 0.25),
      height = Math.max(0.02, (primitive.halfHeight ?? 0.5) * 2);
    return [
      [points[0], points[1]],
      [points[1], points[2]],
    ].flatMap(([from, to]) => {
      const deltaX = to[0] - from[0],
        deltaZ = to[1] - from[1],
        length = Math.hypot(deltaX, deltaZ);
      if (length < 1e-6) return [];
      return [
        {
          center: new THREE.Vector3((from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2),
          size: new THREE.Vector3(thickness, height, length),
          rotation: new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            Math.atan2(deltaX, deltaZ),
          ),
        },
      ];
    });
  }
  const legacyOuterRadius = Math.max(0.02, primitive.radius ?? 0.5),
    legacyInnerRadius = THREE.MathUtils.clamp(
      primitive.innerRadius ?? legacyOuterRadius * 0.55,
      0.01,
      legacyOuterRadius - 0.01,
    ),
    radialThickness = Math.max(
      0.01,
      pointArc
        ? (primitive.arcThickness ?? legacyOuterRadius - legacyInnerRadius)
        : legacyOuterRadius - legacyInnerRadius,
    ),
    middleRadius = pointArc?.radius ?? (legacyOuterRadius + legacyInnerRadius) / 2,
    outerRadius = middleRadius + radialThickness / 2,
    halfHeight = Math.max(0.01, primitive.halfHeight ?? 0.5),
    start =
      pointArc?.start ??
      (primitive.shape === "arc"
        ? THREE.MathUtils.degToRad(primitive.startAngle ?? 0)
        : 0),
    sweepDegrees =
      primitive.shape === "arc"
        ? pointArc
          ? THREE.MathUtils.radToDeg(pointArc.sweep)
          : Math.sign(primitive.arcAngle ?? 90) *
            THREE.MathUtils.clamp(Math.abs(primitive.arcAngle ?? 90), 1, 360)
        : 360,
    sweep = THREE.MathUtils.degToRad(sweepDegrees),
    requestedSegments = Math.round(
      primitive.segments ?? Math.ceil(Math.abs(sweepDegrees) / 15),
    ),
    segments = THREE.MathUtils.clamp(requestedSegments, 1, 64),
    step = sweep / segments,
    // Use the outer chord so neighbouring boxes overlap slightly rather than
    // leaving collision leaks along the outside of the curve.
    tangentLength = Math.max(0.01, 2 * outerRadius * Math.abs(Math.sin(step / 2))),
    centerX = pointArc?.centerX ?? 0,
    centerZ = pointArc?.centerZ ?? 0;
  return Array.from({ length: segments }, (_, index) => {
    const angle = start + (index + 0.5) * step;
    return {
      center: new THREE.Vector3(
        centerX + Math.cos(angle) * middleRadius,
        0,
        centerZ - Math.sin(angle) * middleRadius,
      ),
      size: new THREE.Vector3(radialThickness, halfHeight * 2, tangentLength),
      rotation: new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        angle,
      ),
    };
  });
};
