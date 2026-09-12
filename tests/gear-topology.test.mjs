import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
import * as THREE from "three";

const source = readFileSync(
  new URL("../app/physics/gear-topology.ts", import.meta.url),
  "utf8",
);
const js = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
});
const module = { exports: {} };
const gearboxSource = readFileSync(
  new URL("../app/physics/gearbox.ts", import.meta.url),
  "utf8",
);
const gearboxJs = ts.transpile(gearboxSource, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
});
const gearboxModule = { exports: {} };
vm.runInNewContext(
  `(function(exports,module,require){${gearboxJs}\n})(module.exports,module,require);`,
  {
    module: gearboxModule,
    require: (request) => {
      if (request === "three") return THREE;
      throw new Error(`Unexpected gearbox dependency: ${request}`);
    },
  },
);
const gearSpecFor = (part) => {
  if (part === "6573") return { teeth: 24, kind: "bevel", pitchRadius: 1.5 };
  if (part === "94925") return { teeth: 16, kind: "spur", pitchRadius: 1 };
  if (part === "3648") return { teeth: 24, kind: "spur", pitchRadius: 1.5 };
};
const customRequire = (request) => {
  if (request === "three") return THREE;
  if (request === "../gears") return { gearSpecFor };
  if (request === "../physics-contact-filter")
    return { contactPairKey: (a, b) => [a.id, b.id].sort().join(":") };
  if (request === "./gearbox") return gearboxModule.exports;
  throw new Error(`Unexpected dependency: ${request}`);
};
vm.runInNewContext(
  `(function(exports,module,require){${js}\n})(module.exports,module,require);`,
  { module, require: customRequire },
);

const { detectGearLinks } = module.exports;
const {
  detectGearboxSelectorPairs,
  gearboxContactExclusionPairs,
} = gearboxModule.exports;
const sceneBuilderSource = readFileSync(
  new URL("../app/physics/rust-scene-builder.ts", import.meta.url),
  "utf8",
);
const sceneBuilderJs = ts.transpile(sceneBuilderSource, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
});
const sceneBuilderModule = { exports: {} };
const sceneBuilderRequire = (request) => {
  if (request === "three") return THREE;
  if (request === "../collision-primitives")
    return { annularCollisionSegments: () => [] };
  if (request === "./exact-collider") return { exactTriangleMeshForPiece: () => undefined };
  if (request === "./settings") return {
    COLLISION_GROUP_GEAR_MESH: 1,
    COLLISION_GROUP_GEAR_NORMAL: 2,
    COLLISION_GROUP_NON_GEAR: 4,
    COLLISION_GROUP_SPECIAL_GEAR_CONTACT: 8,
    CONTACT_FRICTION: { gearMesh: 0, piece: 0 },
  };
  if (request === "./rubber-band") return { sampleRubberBand: () => [] };
  if (request === "./gearbox") return gearboxModule.exports;
  throw new Error(`Unexpected scene-builder dependency: ${request}`);
};
vm.runInNewContext(
  `(function(exports,module,require){${sceneBuilderJs}\n})(module.exports,module,require);`,
  { module: sceneBuilderModule, require: sceneBuilderRequire },
);
const {
  buildRustDifferentialConfigs,
  buildRustGearConfigs,
  buildRustJointConfig,
} = sceneBuilderModule.exports;
const cylinder = (center, radius, ratio) => ({
  shape: "cylinder",
  center: new THREE.Vector3(...center),
  radius,
  halfHeight: 0.25,
  rotation: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    Math.PI / 2,
  ),
  gearRatio: ratio,
});

const gearboxPiece = (id, part, z) => {
  const mesh = new THREE.Object3D();
  mesh.position.set(0, 0, z);
  mesh.updateMatrixWorld(true);
  return {
    id,
    part,
    name: part,
    gear: part === "35185" || part === "6542",
    specialGear: false,
    mesh,
    connectors: [{
      role: part === "6538" || part === "26287" ? "shaft" : "socket",
      kind: "axle",
      local: new THREE.Vector3(),
      axis: new THREE.Vector3(0, 0, 1),
    }],
    colliders: [cylinder([0, 0, 0], 0.5)],
    gearColliders: [],
    dynamicAxleConnections: false,
    frictionPin: false,
  };
};

test("6539 and 18947 engage only the clutch on their selected side", () => {
  for (const [ringRef, carrierRef, targetRef, targetDistance] of [
    ["6539", "6538", "6542", 1.5],
    ["18947", "26287", "35185", 2],
  ]) {
    const carrier = gearboxPiece(`${ringRef}-carrier`, carrierRef, 0),
      ring = gearboxPiece(`${ringRef}-ring`, ringRef, 0.5),
      right = gearboxPiece(`${ringRef}-right`, targetRef, targetDistance),
      left = gearboxPiece(`${ringRef}-left`, targetRef, -targetDistance);
    const excludedContacts = gearboxContactExclusionPairs([
      carrier,
      ring,
      right,
      left,
    ]);
    assert.equal(excludedContacts.length, 2);
    assert.ok(
      excludedContacts.some(([first, second]) => first === ring && second === right),
    );
    assert.ok(
      excludedContacts.some(([first, second]) => first === ring && second === left),
    );
    const links = detectGearLinks([carrier, ring, right, left]);
    assert.equal(links.length, 1);
    assert.equal(links[0].a.value, ring);
    assert.equal(links[0].b.value, right);
    assert.equal(links[0].coaxialClutch, true);
    assert.equal(links[0].backlash, Math.PI / 4);

    ring.mesh.position.z = 0;
    ring.mesh.updateMatrixWorld(true);
    assert.equal(detectGearLinks([carrier, ring, right, left]).length, 0);
    assert.equal(
      gearboxContactExclusionPairs([carrier, ring, right, left]).length,
      2,
    );
  }
});

test("a driving ring joint exports three force-loaded selector positions", () => {
  const ring = gearboxPiece("ring", "6539", 0),
    carrier = gearboxPiece("carrier", "6538", 0),
    connector = (role) => ({
      role,
      kind: "axle",
      local: new THREE.Vector3(),
      axis: new THREE.Vector3(0, 0, 1),
    }),
    connection = {
      id: "gearbox-selector",
      a: ring,
      b: carrier,
      mode: "linear",
      profile: "axle-cross",
      point: new THREE.Vector3(),
      axis: new THREE.Vector3(0, 0, 1),
      socket: connector("socket"),
      shaft: connector("shaft"),
      travel: 2,
      motorSpeed: 0,
      motorForce: 0,
    };
  const config = buildRustJointConfig(
    connection,
    new Map([[ring, 1], [carrier, 2]]),
    { frictionlessPinRotation: 0 },
  );
  assert.deepEqual(Array.from(config.linearDetents), [0.5, 0, -0.5]);
  assert.equal(config.detentForce, 18);
  assert.equal(config.travel, 1);
});

test("35188 wave selectors register their non-rigid contact with 18947 rings", () => {
  const ring = gearboxPiece("ring", "18947", 0),
    selector = gearboxPiece("selector", "35188", 1.5),
    carrier = gearboxPiece("carrier", "26287", 0);
  const pairs = detectGearboxSelectorPairs([ring, selector, carrier]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].ring, ring);
  assert.equal(pairs[0].selector, selector);
  assert.equal(pairs[0].layout, "coaxial");
  assert.ok(
    gearboxContactExclusionPairs([ring, selector, carrier]).some(
      ([first, second]) => first === ring && second === selector,
    ),
  );

  selector.mesh.position.set(4, 0, 1.5);
  selector.mesh.updateMatrixWorld(true);
  assert.equal(detectGearboxSelectorPairs([ring, selector, carrier]).length, 0);
});

test("6573 large 1.5-radius zone meshes with a 24-tooth gear at 3 studs", () => {
  const carrier = piece("carrier", "6573", 0, 0, [
    cylinder([0, 0, -1.5], 1.6, 1.5),
    cylinder([0, 0, 1.5], 1.1, 1),
  ], true);
  const gear24 = piece("gear-24", "3648", 3, -1.5, [
    cylinder([0, 0, 0], 1.55),
  ]);

  const links = detectGearLinks([carrier, gear24]);
  assert.equal(links.length, 1);
  assert.equal(links[0].ratioOverride, 1);
  assert.equal(links[0].expectedDistance, 3);
});
const piece = (id, part, x, z, colliders, specialGear = false) => {
  const mesh = new THREE.Object3D();
  mesh.position.set(x, 0, z);
  mesh.updateMatrixWorld(true);
  return {
    id,
    part,
    name: part,
    gear: true,
    specialGear,
    mesh,
    body: { id },
    connectors: [{
      role: "socket",
      kind: "axle",
      local: new THREE.Vector3(),
      axis: new THREE.Vector3(0, 0, 1),
    }],
    colliders,
    gearColliders: [],
  };
};

test("a 62519-to-62520 Cardan hinge remains free through a complete turn", () => {
  const cardanPiece = (id, part) => {
    const mesh = new THREE.Object3D();
    mesh.updateMatrixWorld(true);
    return {
      id, part, name: part, mesh,
      dynamicAxleConnections: false,
      frictionPin: false,
    };
  };
  const end = cardanPiece("end", "62520");
  const center = cardanPiece("center", "62519");
  const connector = (role) => ({
    role,
    kind: "round",
    local: new THREE.Vector3(),
    axis: new THREE.Vector3(0, 1, 0),
  });
  const connection = {
    id: "cardan-hinge",
    a: end,
    b: center,
    mode: "rotation",
    profile: "pin-round",
    point: new THREE.Vector3(),
    axis: new THREE.Vector3(0, 1, 0),
    socket: connector("socket"),
    shaft: connector("shaft"),
    travel: 0,
    motorSpeed: 0,
    motorForce: 0,
  };
  const bodyIds = new Map([[end, 1], [center, 2]]);
  const config = buildRustJointConfig(connection, bodyIds, {
    frictionlessPinRotation: 0,
  });

  assert.ok(config);
  assert.equal(config.angularLimit, undefined);

  const ordinaryEnd = cardanPiece("ordinary-end", "2780");
  const ordinaryConfig = buildRustJointConfig(
    { ...connection, id: "ordinary-pin", b: ordinaryEnd },
    new Map([[end, 1], [ordinaryEnd, 2]]),
    { frictionlessPinRotation: 0 },
  );
  assert.ok(ordinaryConfig);
  assert.equal(ordinaryConfig.angularLimit, undefined);
});

test("6573 exposes independent 1.5 and 1.0 external gear zones", () => {
  const carrier = piece("carrier", "6573", 0, 0, [
    cylinder([0, 0, -1.5], 1.6, 1.5),
    cylinder([0, 0, 1.5], 1.1, 1),
  ], true);
  const largeSide = piece("large-side", "94925", 2.5, -1.5, [
    cylinder([0, 0, 0], 1.05),
  ]);
  const smallSide = piece("small-side", "94925", 2, 1.5, [
    cylinder([0, 0, 0], 1.05),
  ]);

  const links = detectGearLinks([carrier, largeSide, smallSide]);
  assert.equal(links.length, 2);
  assert.deepEqual(
    Array.from(links, (link) => link.ratioOverride).sort((a, b) => a - b),
    [1, 1.5],
  );
  assert.deepEqual(
    Array.from(links, (link) => link.a.center[2]).sort((a, b) => a - b),
    [-1.5, 1.5],
  );
});

test("rebuilding one drivetrain follows each gear's current local engagement frame", () => {
  const left = piece("left", "94925", 0, 0, [cylinder([0, 0, 0], 1.05)]);
  const right = piece("right", "94925", 2, 0, [cylinder([0, 0, 0], 1.05)]);
  const [link] = detectGearLinks([left, right]);
  assert.ok(link?.localCenterA && link.localAxisA);

  const bodyIds = new Map([[left, 1], [right, 2]]);
  const initial = buildRustGearConfigs([link], bodyIds, [])[0];
  left.mesh.position.set(8, 3, -5);
  left.mesh.rotation.set(0.4, -0.7, 0.2);
  right.mesh.position.set(9.529684, 3.397339, -6.197173);
  right.mesh.rotation.copy(left.mesh.rotation);
  left.mesh.updateMatrixWorld(true);
  right.mesh.updateMatrixWorld(true);

  const rebuilt = buildRustGearConfigs([link], bodyIds, [])[0];
  const expectedA = left.mesh.localToWorld(link.localCenterA.clone());
  const expectedAxisA = link.localAxisA
    .clone()
    .transformDirection(left.mesh.matrixWorld)
    .normalize();
  assert.ok(new THREE.Vector3(...rebuilt.centerA).distanceTo(expectedA) < 1e-6);
  assert.ok(new THREE.Vector3(...rebuilt.axisA).distanceTo(expectedAxisA) < 1e-6);
  assert.ok(
    new THREE.Vector3(...rebuilt.centerA).distanceTo(new THREE.Vector3(...initial.centerA)) > 5,
    "a remote topology change must not rebuild this gear at its old world position",
  );
});

test("a 6573 differential exports its internal satellite mesh", () => {
  const carrier = piece("carrier", "6573", 0, 0, []);
  const left = piece("left", "6589", 0, -0.85, []);
  const right = piece("right", "6589", 0, 0.85, []);
  const satellite = piece("satellite", "6589", 0, 0, []);
  satellite.mesh.position.y = -0.85;
  satellite.mesh.updateMatrixWorld(true);
  const connections = [
    { a: carrier, b: left, profile: "axle-round", mode: "rotation-linear", axis: new THREE.Vector3(0, 0, 1), point: new THREE.Vector3(0, 0, -0.85) },
    { a: carrier, b: right, profile: "axle-round", mode: "rotation-linear", axis: new THREE.Vector3(0, 0, 1), point: new THREE.Vector3(0, 0, 0.85) },
    { a: carrier, b: satellite, profile: "axle-cross", mode: "rotation", axis: new THREE.Vector3(0, 1, 0), point: new THREE.Vector3() },
  ];
  const link = {
    a: { value: satellite, spec: { teeth: 12 }, center: [0, -0.85, 0] },
    b: { value: left, spec: { teeth: 12 }, center: [0, 0, -0.85] },
    axisA: new THREE.Vector3(0, 1, 0),
    axisB: new THREE.Vector3(0, 0, 1),
    signB: 1,
    perpendicular: true,
  };
  const bodyIds = new Map([[carrier, 1], [left, 2], [right, 3], [satellite, 4]]);
  const [config] = buildRustDifferentialConfigs(
    [carrier, left, right, satellite],
    connections,
    bodyIds,
    [link],
  );
  assert.equal(config.satellites.length, 1);
  assert.deepEqual(
    { body: config.satellites[0].body, sideBody: config.satellites[0].sideBody },
    { body: 4, sideBody: 2 },
  );
});
