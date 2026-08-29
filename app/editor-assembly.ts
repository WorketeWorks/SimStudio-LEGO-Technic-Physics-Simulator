import type { Connection, Piece } from "./editor/types";

export const editorAssemblyMembers = (pieces: Piece[], selected: Piece) =>
  selected.editorAssemblyId
    ? pieces.filter((piece) => piece.editorAssemblyId === selected.editorAssemblyId)
    : [selected];

export const cardanAssemblyLayout = (members: Piece[], connections: Connection[]) => {
  const centre = members.find((member) => member.part.toLowerCase() === "62519"),
    ends = members.filter((member) => member.part.toLowerCase() === "62520");
  if (members.length !== 3 || !centre || ends.length !== 2) return undefined;
  const endForCentreConnector = (connectorIndex: number) => {
    const connector = centre.connectors[connectorIndex],
      connection = connections.find(
        (candidate) =>
          (candidate.a === centre &&
            candidate.socket === connector &&
            ends.includes(candidate.b)) ||
          (candidate.b === centre &&
            candidate.shaft === connector &&
            ends.includes(candidate.a)),
      );
    return connection
      ? connection.a === centre
        ? connection.b
        : connection.a
      : undefined;
  };
  const endByConnector = [
      endForCentreConnector(0) ?? ends[0],
      endForCentreConnector(1) ?? ends[1],
    ] as const,
    memberSet = new Set(members),
    hasExternalAxle = endByConnector.map((end) =>
      connections.some((connection) => {
        if (memberSet.has(connection.a) === memberSet.has(connection.b)) return false;
        if (connection.a === end)
          return connection.socket.kind === "axle" && connection.socket.role === "socket";
        if (connection.b === end)
          return connection.shaft.kind === "axle" && connection.shaft.role === "shaft";
        return false;
      }),
    ),
    singleExternalIndex =
      hasExternalAxle[0] !== hasExternalAxle[1]
        ? hasExternalAxle[0]
          ? 0
          : 1
        : undefined;
  if (singleExternalIndex !== undefined)
    centre.editorCardanReferenceConnector = singleExternalIndex;
  const referenceConnector = centre.editorCardanReferenceConnector ?? 0,
    first = endByConnector[referenceConnector],
    third = endByConnector[referenceConnector === 0 ? 1 : 0];
  return {
    centre,
    first,
    third,
    referenceConnector,
    referenceLockedBySingleAxle: singleExternalIndex !== undefined,
  };
};

/** Migrates Cardans saved before editorial grouping was introduced. */
export const restoreLegacyCardanEditorAssemblies = (
  pieces: Piece[],
  connections: Connection[],
) => {
  pieces
    .filter((piece) => piece.part.toLowerCase() === "62519")
    .forEach((centre) => {
      const ends = connections.flatMap((connection) => {
        if (connection.profile !== "pin-round") return [];
        const other =
          connection.a === centre
            ? connection.b
            : connection.b === centre
              ? connection.a
              : undefined;
        return other?.part.toLowerCase() === "62520" ? [other] : [];
      });
      const members = [centre, ...new Set(ends)];
      if (
        members.length !== 3 ||
        members.some((piece) => piece.editorAssemblyId || piece.editorAssemblyDetached)
      )
        return;
      const id = `cardan-${centre.id}`;
      members.forEach((piece) => {
        piece.editorAssemblyId = id;
      });
    });
};
