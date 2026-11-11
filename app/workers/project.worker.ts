/// <reference lib="webworker" />
/**
 * Project file work off the main thread: gzip/gunzip, JSON, validation and the
 * IndexedDB writes of saves and autosaves. Large models used to freeze the
 * editor for a second or more while these ran.
 */
import {
  decodeProjectFile,
  encodeProjectFile,
  loadBrowserProject,
  loadRecoveryProject,
  saveBrowserProject,
  saveRecoveryProject,
} from "../project-format";

type Request = { id: number } & (
  | { op: "decode"; buffer: ArrayBuffer }
  | { op: "encode"; document: never }
  | { op: "saveRecovery"; document: never }
  | { op: "saveProject"; document: never }
  | { op: "loadProject"; projectId: string }
  | { op: "loadRecovery" }
);

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = async (event: MessageEvent<Request>) => {
  const message = event.data;
  try {
    switch (message.op) {
      case "decode":
        return scope.postMessage({ id: message.id, result: decodeProjectFile(message.buffer) });
      case "encode": {
        const bytes = encodeProjectFile(message.document);
        return scope.postMessage({ id: message.id, result: bytes }, [bytes.buffer as ArrayBuffer]);
      }
      case "saveRecovery":
        await saveRecoveryProject(message.document);
        return scope.postMessage({ id: message.id, result: true });
      case "saveProject":
        await saveBrowserProject(message.document);
        return scope.postMessage({ id: message.id, result: true });
      case "loadProject":
        return scope.postMessage({ id: message.id, result: await loadBrowserProject(message.projectId) });
      case "loadRecovery":
        return scope.postMessage({ id: message.id, result: await loadRecoveryProject() });
    }
  } catch (error) {
    scope.postMessage({ id: message.id, error: error instanceof Error ? error.message : String(error) });
  }
};
