import type { MeshConnector } from "./connectors";

export type ConnectorOwner = {
  part: string;
  modelPart?: string;
  resolvedPart?: string;
  requestedPart?: string;
  connectors: MeshConnector[];
};

const ownerHasReference = (owner: ConnectorOwner, expected: string) =>
  [owner.part, owner.modelPart, owner.resolvedPart, owner.requestedPart]
    .filter((reference): reference is string => Boolean(reference))
    .some(
      (reference) =>
        reference.toLowerCase().replace(/\.dat$/, "") === expected,
    );

/** The 4159 fork occupies the outer groove of 6539, not its 6538 axle guide. */
export const isChangeoverForkRingConnection = (
  aPiece: ConnectorOwner,
  a: MeshConnector,
  bPiece: ConnectorOwner,
  b: MeshConnector,
) => {
  const matches = (
    forkPiece: ConnectorOwner,
    fork: MeshConnector,
    ringPiece: ConnectorOwner,
    ring: MeshConnector,
  ) =>
    ownerHasReference(forkPiece, "4159") &&
    ownerHasReference(ringPiece, "6539") &&
    fork.role === "shaft" &&
    fork.rotationOnly === true &&
    fork.connectionTarget?.partId.toLowerCase() === "6539" &&
    ring.role === "socket";
  return matches(aPiece, a, bPiece, b) || matches(bPiece, b, aPiece, a);
};

const connectorAllowsTarget = (
  sourceConnector: MeshConnector,
  targetPiece: ConnectorOwner,
  targetConnector: MeshConnector,
) => {
  const rule = sourceConnector.connectionTarget;
  if (!rule || !rule.partId.trim()) return true;
  const expectedPart = rule.partId.trim().toLowerCase(),
    targetReferences = [
      targetPiece.part,
      targetPiece.modelPart,
      targetPiece.resolvedPart,
      targetPiece.requestedPart,
    ]
      .filter((reference): reference is string => Boolean(reference))
      .map((reference) => reference.toLowerCase());
  if (!targetReferences.includes(expectedPart)) return false;
  return (
    rule.connectorId === undefined ||
    targetPiece.connectors.indexOf(targetConnector) + 1 === rule.connectorId
  );
};

export const connectorPoliciesCompatible = (
  aPiece: ConnectorOwner,
  a: MeshConnector,
  bPiece: ConnectorOwner,
  b: MeshConnector,
) =>
  isChangeoverForkRingConnection(aPiece, a, bPiece, b) ||
  (connectorAllowsTarget(a, bPiece, b) &&
    connectorAllowsTarget(b, aPiece, a));

export const connectorAcceptsAdditionalConnection = (
  connector: MeshConnector,
  occupied: boolean,
) =>
  !occupied ||
  (connector.role !== "socket" && connector.singleConnection !== true);

/** Distance wins normally; coincident candidates are resolved by parallel/opposite axes. */
export const automaticConnectorMatchIsBetter = (
  score: number,
  orientationError: number,
  best?: { score: number; orientationError: number },
) =>
  !best ||
  score < best.score - 1e-4 ||
  (Math.abs(score - best.score) <= 1e-4 &&
    orientationError < best.orientationError);
