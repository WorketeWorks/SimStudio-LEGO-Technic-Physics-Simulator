/** Zero-copy hand-off of Object3D.toJSON() geometry (worker -> main thread). */
type ArrayJson = { type?: string; array?: ArrayLike<number> };
export type GeometryJson = {
  data?: { attributes?: Record<string, ArrayJson>; index?: ArrayJson };
};

/**
 * Object3D.toJSON writes every vertex as a plain number in a JS array, which is
 * slow to clone and slower for ObjectLoader to turn back into typed arrays.
 * Putting typed arrays back (and transferring their buffers) makes the hand-off
 * to the main thread a zero-copy move, so big parts no longer stall the UI.
 */
export function typedGeometryArrays(json: { geometries?: GeometryJson[] }) {
  const transfer: ArrayBuffer[] = [];
  const convert = (entry: ArrayJson | undefined) => {
    if (!entry || !Array.isArray(entry.array)) return;
    const Ctor = (globalThis as unknown as Record<string, new (data: ArrayLike<number>) => ArrayBufferView>)[
      entry.type ?? "Float32Array"
    ];
    if (typeof Ctor !== "function") return;
    const typed = new Ctor(entry.array);
    entry.array = typed as unknown as ArrayLike<number>;
    transfer.push(typed.buffer as ArrayBuffer);
  };
  for (const geometry of json.geometries ?? []) {
    Object.values(geometry.data?.attributes ?? {}).forEach(convert);
    convert(geometry.data?.index);
  }
  return transfer;
}

