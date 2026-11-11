/**
 * Main-thread side of the LDraw worker: a small pool of module workers that
 * parse parts off-thread. `load` resolves with the parsed Three.js object, or
 * rejects with a WorkerUnavailable error when workers cannot be used, so the
 * caller can fall back to parsing on the main thread.
 */
import * as THREE from "three";

export class WorkerUnavailable extends Error {
  constructor(message = "LDraw worker unavailable") {
    super(message);
    this.name = "WorkerUnavailable";
  }
}

type Pending = {
  resolve: (value: THREE.Object3D) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export function createLDrawWorkerPool(options: {
  size: number;
  libraries: string[];
  fileMap: Promise<Record<string, string> | null>;
  configUrl: string;
  timeout: number;
}) {
  let broken = typeof Worker === "undefined";
  const workers: Worker[] = [],
    pending = new Map<number, Pending>(),
    owner = new Map<number, Worker>();
  let nextId = 1,
    cursor = 0;

  const fail = (worker: Worker | undefined, error: Error) => {
    broken = true;
    pending.forEach((entry, id) => {
      if (!worker || owner.get(id) === worker) {
        clearTimeout(entry.timer);
        entry.reject(error);
        pending.delete(id);
      }
    });
  };

  const start = (fileMap: Record<string, string> | null) => {
    if (broken || workers.length) return;
    try {
      for (let i = 0; i < options.size; i++) {
        const worker = new Worker(new URL("./workers/ldraw.worker.ts", import.meta.url), {
          type: "module",
        });
        worker.onmessage = (event: MessageEvent) => {
          const { id, json, missing, error } = event.data as {
            id: number;
            json?: object;
            missing?: number;
            error?: string;
          };
          const entry = pending.get(id);
          if (!entry) return;
          pending.delete(id);
          owner.delete(id);
          clearTimeout(entry.timer);
          if (error || !json) return entry.reject(new Error(error ?? "Empty worker result"));
          try {
            const object = new THREE.ObjectLoader().parse(json);
            object.userData.missingSubfiles = missing ?? 0;
            entry.resolve(object);
          } catch (parseError) {
            entry.reject(parseError instanceof Error ? parseError : new Error(String(parseError)));
          }
        };
        worker.onerror = (event) => {
          event.preventDefault();
          fail(worker, new WorkerUnavailable(event.message));
        };
        workers.push(worker);
        // Posted before any "load" so the worker always knows the file map,
        // library list and colour config before it parses its first part.
        worker.postMessage({
          type: "init",
          fileMap,
          libraries: options.libraries,
          configUrl: options.configUrl,
        });
      }
    } catch (error) {
      broken = true;
      workers.splice(0).forEach((worker) => worker.terminate());
      throw new WorkerUnavailable(error instanceof Error ? error.message : undefined);
    }
  };

  return {
    get available() {
      return !broken;
    },
    reset() {
      workers.forEach((worker) => worker.postMessage({ type: "reset" }));
    },
    async load(base: string, source: string, label: string, name?: string, split = false) {
      const fileMap = await options.fileMap;
      start(fileMap);
      if (broken || !workers.length) throw new WorkerUnavailable();
      const id = nextId++,
        // A given library always goes to the same worker lane order, but spread
        // load across workers so independent parts parse in parallel.
        worker = workers[cursor++ % workers.length];
      return new Promise<THREE.Object3D>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          owner.delete(id);
          reject(new Error(`${label} exceeded ${Math.round(options.timeout / 1000)} s`));
        }, options.timeout);
        pending.set(id, { resolve, reject, timer });
        owner.set(id, worker);
        worker.postMessage({ type: "load", id, base, source, name, split });
      });
    },
  };
}
