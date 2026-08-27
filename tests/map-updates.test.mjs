import assert from "node:assert/strict";
import test from "node:test";

import {
  changedMapLayers,
  differentMapLayers,
  fingerprintMapBundle,
  mapFingerprint,
} from "../app/map-fingerprints.ts";

test("map fingerprints ignore object property order", () => {
  assert.equal(
    mapFingerprint([{ axis: [0, 1, 0], local: [1, 2, 3] }]),
    mapFingerprint([{ local: [1, 2, 3], axis: [0, 1, 0] }]),
  );
});

test("manual maps do not prompt until their packaged baseline changes", () => {
  const packaged = fingerprintMapBundle({ connectors: [{ local: [0, 0, 0] }] }),
    manual = fingerprintMapBundle({ connectors: [{ local: [1, 0, 0] }] });
  assert.deepEqual(changedMapLayers(packaged, packaged, manual), []);

  const newer = fingerprintMapBundle({ connectors: [{ local: [0, 1, 0] }] });
  assert.deepEqual(changedMapLayers(packaged, newer, manual), ["connectors"]);
});

test("already current maps do not appear as updates", () => {
  const old = fingerprintMapBundle({ colliders: [{ radius: 1 }] }),
    current = fingerprintMapBundle({ colliders: [{ radius: 2 }] });
  assert.deepEqual(changedMapLayers(old, current, current), []);
});

test("manual differences stay visible without becoming automatic updates", () => {
  const packaged = fingerprintMapBundle({ colliders: [{ radius: 0.8 }] }),
    manual = fingerprintMapBundle({ colliders: [{ radius: 0.805 }] });
  assert.deepEqual(differentMapLayers(packaged, manual), ["colliders"]);
  assert.deepEqual(changedMapLayers(packaged, packaged, manual), []);
});
