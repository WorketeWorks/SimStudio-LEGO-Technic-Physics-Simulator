/**
 * Main-thread side of the project worker. Every call falls back to the
 * synchronous implementation when workers are unavailable (tests, old
 * browsers) so behaviour never depends on the worker.
 */
import {
  decodeProjectFile,
  encodeProjectFile,
  loadBrowserProject,
  loadRecoveryProject,
  saveBrowserProject,
  saveRecoveryProject,
  type SimStudioProjectDocument,
} from "./project-format";

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };

let worker: Worker | null = null,
  broken = typeof Worker === "undefined",
  nextId = 1;
const pending = new Map<number, Pending>();

const ensureWorker = () => {
  if (broken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./workers/project.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      if (event.data.error !== undefined) entry.reject(new Error(event.data.error));
      else entry.resolve(event.data.result);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      broken = true;
      const failed = [...pending.values()];
      pending.clear();
      worker?.terminate();
      worker = null;
      failed.forEach((entry) => entry.reject(new Error("PROJECT_WORKER_FAILED")));
    };
    return worker;
  } catch {
    broken = true;
    return null;
  }
};

async function call<T>(
  message: Record<string, unknown>,
  fallback: () => Promise<T> | T,
  transfer: Transferable[] = [],
): Promise<T> {
  const target = ensureWorker();
  if (!target) return fallback();
  const id = nextId++;
  try {
    return await new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      try {
        target.postMessage({ id, ...message }, transfer);
      } catch (error) {
        pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  } catch (error) {
    // A broken worker means "run it here"; a real error (invalid file) is the caller's.
    if (error instanceof Error && error.message === "PROJECT_WORKER_FAILED") return fallback();
    throw error;
  }
}

export const decodeProjectAsync = (buffer: ArrayBuffer) =>
  call<SimStudioProjectDocument>({ op: "decode", buffer }, () => decodeProjectFile(buffer), []);
export const encodeProjectAsync = (document: SimStudioProjectDocument) =>
  call<Uint8Array>({ op: "encode", document }, () => encodeProjectFile(document));
export const saveRecoveryAsync = (document: SimStudioProjectDocument) =>
  call<boolean>({ op: "saveRecovery", document }, async () => (await saveRecoveryProject(document), true));
export const saveProjectAsync = (document: SimStudioProjectDocument) =>
  call<boolean>({ op: "saveProject", document }, async () => (await saveBrowserProject(document), true));
export const loadProjectAsync = (projectId: string) =>
  call<SimStudioProjectDocument | undefined>({ op: "loadProject", projectId }, () => loadBrowserProject(projectId));
export const loadRecoveryAsync = () =>
  call<SimStudioProjectDocument | undefined>({ op: "loadRecovery" }, () => loadRecoveryProject());
