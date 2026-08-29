import * as THREE from "three";

export const quaternionFromAxisPairs = (
  localPrimary: THREE.Vector3,
  localSecondary: THREE.Vector3,
  worldPrimary: THREE.Vector3,
  worldSecondary: THREE.Vector3,
) => {
  const orthonormalPair = (primary: THREE.Vector3, secondary: THREE.Vector3) => {
      const first = primary.clone().normalize(),
        second = secondary
          .clone()
          .addScaledVector(first, -secondary.dot(first))
          .normalize(),
        third = first.clone().cross(second).normalize();
      return { first, second, third };
    },
    local = orthonormalPair(localPrimary, localSecondary),
    world = orthonormalPair(worldPrimary, worldSecondary),
    localBasis = new THREE.Matrix4().makeBasis(local.first, local.second, local.third),
    worldBasis = new THREE.Matrix4().makeBasis(world.first, world.second, world.third);
  return new THREE.Quaternion()
    .setFromRotationMatrix(worldBasis.multiply(localBasis.invert()))
    .normalize();
};

/** Resolves the second cross axis from the two universal-joint constraints. */
export const cardanSecondaryAxis = (
  firstHingeAxis: THREE.Vector3,
  outputShaftDirection: THREE.Vector3,
  orientationSign: number,
) => {
  const axis = firstHingeAxis.clone().cross(outputShaftDirection);
  if (axis.lengthSq() <= 1.0e-6) return undefined;
  return axis.normalize().multiplyScalar(orientationSign < 0 ? -1 : 1);
};

export type CardanEditorCoordinates = {
  aimX: number;
  aimZ: number;
  roll: number;
};

export const cardanReferenceFrame = (inputDirection: THREE.Vector3) => {
  const y = inputDirection.clone().normalize(),
    seed = Math.abs(y.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1),
    x = seed.addScaledVector(y, -seed.dot(y)).normalize(),
    z = x.clone().cross(y).normalize();
  return { x, y, z };
};

export const cardanEditorCoordinates = (
  inputDirection: THREE.Vector3,
  outputDirection: THREE.Vector3,
  firstHingeAxis: THREE.Vector3,
): CardanEditorCoordinates => {
  const frame = cardanReferenceFrame(inputDirection),
    output = outputDirection.clone().normalize(),
    hinge = firstHingeAxis
      .clone()
      .addScaledVector(frame.y, -firstHingeAxis.dot(frame.y))
      .normalize();
  return {
    aimX: Math.asin(THREE.MathUtils.clamp(output.dot(frame.z), -1, 1)),
    aimZ: Math.atan2(-output.dot(frame.x), output.dot(frame.y)),
    roll: Math.atan2(frame.y.dot(frame.x.clone().cross(hinge)), frame.x.dot(hinge)),
  };
};

export const cardanDirectionsFromCoordinates = (
  inputDirection: THREE.Vector3,
  coordinates: CardanEditorCoordinates,
) => {
  const frame = cardanReferenceFrame(inputDirection),
    cosX = Math.cos(coordinates.aimX),
    outputDirection = frame.y
      .clone()
      .multiplyScalar(cosX * Math.cos(coordinates.aimZ))
      .addScaledVector(frame.z, Math.sin(coordinates.aimX))
      .addScaledVector(frame.x, -cosX * Math.sin(coordinates.aimZ))
      .normalize(),
    firstHingeAxis = frame.x
      .clone()
      .applyAxisAngle(frame.y, coordinates.roll)
      .normalize();
  return { inputDirection: frame.y, outputDirection, firstHingeAxis };
};
