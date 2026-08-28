import type { Connection, Piece } from "./editor/types";

export const editorAssemblyMembers = (pieces: Piece[], selected: Piece) =>
  selected.editorAssemblyId
    ? pieces.filter((piece) => piece.editorAssemblyId === selected.editorAssemblyId)
    : [selected];

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
        members.some(
          (piece) => piece.editorAssemblyId || piece.editorAssemblyDetached,
        )
      )
        return;
      const id = `cardan-${centre.id}`;
      members.forEach((piece) => {
        piece.editorAssemblyId = id;
      });
    });
};
