import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import {
  approximateCollisionPrimitives,
  approximateGearCollisionPrimitives,
  detectConnectorHoles,
  straightAxleCollisionPrimitives,
  straightAxleConnectors,
} from "../app/connectors.ts";
import { annularCollisionSegments } from "../app/collision-primitives.ts";
import { preloadedConnectionMaps } from "../app/connection-maps.ts";
import {
  automaticConnectorMatchIsBetter,
  connectorAcceptsAdditionalConnection,
  connectorPoliciesCompatible,
} from "../app/connector-policy.ts";
import {
  cardanAssemblyLayout,
  editorAssemblyMembers,
  restoreLegacyCardanEditorAssemblies,
} from "../app/editor-assembly.ts";
import { forceDragTarget } from "../app/editor/force-drag.ts";
import {
  cardanDirectionsFromCoordinates,
  cardanEditorCoordinates,
  cardanSecondaryAxis,
  quaternionFromAxisPairs,
} from "../app/cardan-kinematics.ts";
import {
  preloadedCollisionMaps,
  preloadedGearCollisionMaps,
  preloadedSpecialGearParts,
} from "../app/collision-maps.ts";
import {
  buildConnectorContactExclusions,
  contactPairKey,
} from "../app/physics-contact-filter.ts";

const loadPart = (asset) => {
  const exact = new THREE.ObjectLoader().parse(
    JSON.parse(readFileSync(`public/catalog/geometry/${asset}.json`, "utf8")),
  );
  exact.rotation.x = Math.PI;
  exact.scale.setScalar(0.05);
  const root = new THREE.Group();
  root.add(exact);
  root.updateMatrixWorld(true);
  return root;
};

const connectorAt = (connectors, position) =>
  connectors.find(
    (connector) => connector.local.distanceTo(new THREE.Vector3(...position)) < 0.05,
  );

test("hollow and arc colliders preserve their bore with configurable sweeps", () => {
  const base = {
      center: new THREE.Vector3(),
      radius: 2,
      innerRadius: 1,
      halfHeight: 0.25,
      rotation: new THREE.Quaternion(),
    },
    ring = annularCollisionSegments({
      ...base,
      shape: "hollowCylinder",
      segments: 24,
    }),
    arc = annularCollisionSegments({
      ...base,
      shape: "arc",
      startAngle: 0,
      arcAngle: 90,
      segments: 6,
    }),
    reverseArc = annularCollisionSegments({
      ...base,
      shape: "arc",
      startAngle: 0,
      arcAngle: -90,
      segments: 6,
    }),
    threePointArc = annularCollisionSegments({
      ...base,
      shape: "arc",
      arcPoints: [
        [2, 0],
        [Math.SQRT2, -Math.SQRT2],
        [0, -2],
      ],
      arcThickness: 0.4,
      segments: 6,
    });
  assert.equal(ring.length, 24);
  assert.equal(arc.length, 6);
  assert.equal(reverseArc.length, 6);
  assert.equal(threePointArc.length, 6);
  for (const segment of ring) {
    assert.ok(Math.abs(segment.center.length() - 1.5) < 1e-12);
    assert.equal(segment.size.x, 1);
    assert.equal(segment.size.y, 0.5);
  }
  assert.ok(arc.at(-1).center.z < 0);
  assert.ok(reverseArc.at(-1).center.z > 0);
  assert.ok(Math.abs(threePointArc[0].center.length() - 2) < 1e-12);
  assert.equal(threePointArc[0].size.x, 0.4);
});

test("detects round and cross holes on the small L beam", () => {
  const connectors = detectConnectorHoles(loadPart("32056-72"));
  for (const position of [
    [0, 0, 0],
    [2, 0, 0],
    [0, 0, -2],
  ])
    assert.equal(connectorAt(connectors, position)?.kind, "axle");
  for (const position of [
    [1, 0, 0],
    [0, 0, -1],
  ])
    assert.equal(connectorAt(connectors, position)?.kind, "round");
  assert.equal(connectors.length, 5);
});

test("does not confuse the perpendicular cross hole with a round hole", () => {
  const connectors = detectConnectorHoles(loadPart("32013-71"));
  assert.equal(connectorAt(connectors, [0, 0, 0])?.kind, "round");
  assert.equal(connectorAt(connectors, [0, 0, 1])?.kind, "axle");
  assert.equal(connectors.length, 2);
});

test("builds the small L collider from two orthogonal boxes", () => {
  const root = loadPart("32056-72"),
    connectors = preloadedConnectionMaps["32056"].map((connector) => ({
      ...connector,
      local: new THREE.Vector3().fromArray(connector.local),
      axis: new THREE.Vector3().fromArray(connector.axis),
    })),
    colliders = approximateCollisionPrimitives(
      root,
      "Technic Beam 3 x 3 x 0.5 Bent 90°",
      connectors,
    ),
    boxes = colliders.filter((collider) => collider.shape === "box");
  assert.equal(boxes.length, 2);
  assert.ok(
    connectorAt(
      boxes.map((box) => ({ local: box.center })),
      [1, 0, 0],
    ),
  );
  assert.ok(
    connectorAt(
      boxes.map((box) => ({ local: box.center })),
      [0, 0, -1],
    ),
  );
  boxes.forEach((box) => {
    assert.equal(box.size.y, 0.5);
    assert.equal(box.size.z, 0.9);
  });
  colliders
    .filter((collider) => collider.shape === "cylinder")
    .forEach((cylinder) => {
      assert.equal(cylinder.radius, 0.45);
      assert.equal(cylinder.halfHeight, 0.25);
    });
});

test("full beams use a 0.45 radial collision envelope", () => {
  const root = loadPart("32523-71"),
    connectors = detectConnectorHoles(root),
    colliders = approximateCollisionPrimitives(root, "Technic Beam 3", connectors);
  colliders
    .filter((item) => item.shape === "box")
    .forEach((box) => {
      assert.equal(box.size.y, 1);
      assert.equal(box.size.z, 0.9);
    });
  colliders
    .filter((item) => item.shape === "cylinder")
    .forEach((cylinder) => {
      assert.equal(cylinder.radius, 0.45);
      assert.equal(cylinder.halfHeight, 0.5);
    });
  const singleRoot = loadPart("18654-71"),
    single = approximateCollisionPrimitives(
      singleRoot,
      "Technic Beam 1",
      detectConnectorHoles(singleRoot),
    );
  assert.equal(single.length, 1);
  assert.equal(single[0].radius, 0.45);
  assert.equal(single[0].halfHeight, 0.5);
});

test("scales the reviewed cross-axle template by stud length", () => {
  for (const studs of [2, 4, 12]) {
    const name = `Technic Axle ${studs}${studs === 2 ? " Notched" : ""}`,
      connectors = straightAxleConnectors(name),
      colliders = straightAxleCollisionPrimitives(name);
    assert.equal(connectors.length, 1);
    assert.equal(connectors[0].length, studs);
    assert.equal(connectors[0].diameter, 0.6);
    assert.deepEqual(connectors[0].axis.toArray(), [1, 0, 0]);
    assert.equal(colliders.length, 2);
    assert.deepEqual(colliders[0].size.toArray(), [studs, 0.2, 0.6]);
    assert.deepEqual(colliders[1].size.toArray(), [studs, 0.6, 0.2]);
  }
  assert.equal(straightAxleCollisionPrimitives("Technic Axle 4 with Stop"), undefined);
});

test("gear contact colliders sit inside the normal tooth envelope", () => {
  const normal = [
      {
        shape: "cylinder",
        center: new THREE.Vector3(),
        radius: 2,
        halfHeight: 0.5,
        rotation: new THREE.Quaternion(),
      },
    ],
    gear = approximateGearCollisionPrimitives(normal);
  assert.equal(gear.length, 1);
  assert.ok(gear[0].radius < normal[0].radius);
  assert.ok(gear[0].halfHeight < normal[0].halfHeight);
});

test("gears, tyres and axle connector shells use a 0.95 envelope", () => {
  for (const [asset, name] of [
    ["6589-19", "Technic Gear 12 Tooth Bevel"],
    ["4185-71", "Technic Wedge Belt Wheel"],
  ]) {
    const root = loadPart(asset),
      size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()),
      dimensions = size.toArray(),
      thicknessAxis = dimensions.indexOf(Math.min(...dimensions)),
      radialDiameter = Math.max(
        ...dimensions.filter((_, index) => index !== thicknessAxis),
      ),
      [collider] = approximateCollisionPrimitives(root, name, []);
    assert.ok(Math.abs((collider.radius * 2) / radialDiameter - 0.95) < 1e-6);
    assert.ok(
      Math.abs((collider.halfHeight * 2) / dimensions[thicknessAxis] - 0.95) < 1e-6,
    );
  }
  const joiner = approximateCollisionPrimitives(
    loadPart("6538c-71"),
    "Technic Axle Joiner Inline Smooth",
    [],
  );
  assert.equal(joiner[0].radius, 0.475);
});

test("keeps every restored correction map preloaded", () => {
  for (const part of [
    "3713",
    "32016",
    "32034",
    "32192",
    "55615",
    "4265c",
    "11478",
    "32062",
    "45590",
    "62462",
    "99773",
  ])
    assert.ok(preloadedConnectionMaps[part]?.length, `${part} connection map`);
  for (const part of [
    "32013",
    "32016",
    "32034",
    "32192",
    "3713",
    "87408",
    "18654",
    "2825",
    "32062",
    "32184",
    "32271",
    "4265c",
    "45590",
    "55615",
    "60484",
    "64179",
    "3649",
    "10928",
    "32498",
    "94925",
    "99773",
  ])
    assert.ok(preloadedCollisionMaps[part]?.length, `${part} collision map`);
});

test("loads the downloaded connection corrections", () => {
  assert.deepEqual(preloadedConnectionMaps["18947"], [
    {
      local: [0, 0, 0],
      axis: [0, 0, 1],
      kind: "axle",
      role: "socket",
      diameter: 0.8,
      length: 1,
    },
  ]);
  assert.deepEqual(preloadedConnectionMaps["35188"], preloadedConnectionMaps["18947"]);
  assert.deepEqual(preloadedConnectionMaps["6539"], preloadedConnectionMaps["18947"]);
  assert.equal(preloadedConnectionMaps["4159"].length, 3);
  assert.equal(preloadedConnectionMaps["6538"].length, 2);
  assert.equal(preloadedConnectionMaps["6542"][0].kind, "round");
});

test("loads the downloaded 6589 gear collision correction", () => {
  const colliders = preloadedGearCollisionMaps["6589"];
  assert.equal(colliders.length, 3);
  assert.deepEqual(
    colliders.map((collider) => collider.radius),
    [0.49, 0.805, 0.79],
  );
  assert.deepEqual(
    colliders.map((collider) => collider.halfHeight),
    [0.25, 0.02, 0.029],
  );
});

test("the 6573 differential exposes lateral sockets, a rotation-only axle stud and two gear volumes", () => {
  const sockets = preloadedConnectionMaps["6573"];
  assert.equal(sockets.length, 3);
  assert.deepEqual(
    sockets.slice(0, 2).map((socket) => socket.kind),
    ["round", "round"],
  );
  assert.deepEqual(
    sockets.slice(0, 2).map((socket) => socket.local[2]),
    [-1.5, 1.5],
  );
  assert.equal(sockets[2].kind, "axle");
  assert.equal(sockets[2].role, "shaft");
  assert.equal(sockets[2].rotationOnly, true);
  assert.equal(sockets[2].length, undefined);
  assert.deepEqual(sockets[2].local, [0, -0.75, 0]);
  const gearVolumes = preloadedGearCollisionMaps["6573"];
  assert.equal(gearVolumes.length, 2);
  assert.deepEqual(
    gearVolumes.map((volume) => volume.center[2]),
    [-1.5, 1.5],
  );
  assert.deepEqual(
    gearVolumes.map((volume) => volume.radius),
    [1.3, 0.8],
  );
  assert.ok(preloadedSpecialGearParts.has("6573"));
  const normalVolumes = preloadedCollisionMaps["6573"];
  assert.equal(normalVolumes.length, 8);
  assert.deepEqual(
    normalVolumes.filter((volume) => volume.gearRatio).map((volume) => volume.gearRatio),
    [1.5, 1],
  );
  assert.equal(normalVolumes.filter((volume) => volume.gearCollision).length, 6);
});

test("the 61903 Cardan components expose two perpendicular free pivots", () => {
  const centre = preloadedConnectionMaps["62519"],
    end = preloadedConnectionMaps["62520"];
  assert.equal(centre.length, 2);
  assert.deepEqual(
    centre.map((connector) => connector.axis),
    [
      [1, 0, 0],
      [0, 1, 0],
    ],
  );
  assert.ok(
    centre.every(
      (connector) =>
        connector.role === "shaft" &&
        connector.kind === "round" &&
        connector.rotationOnly === true,
    ),
  );
  assert.equal(end.length, 2);
  assert.equal(end[0].kind, "axle");
  assert.deepEqual(end[0].local, [0, 0, -1]);
  assert.equal(end[1].kind, "round");
  assert.deepEqual(end[1].axis, [1, 0, 0]);
  assert.equal(end[1].rotationOnly, true);
  assert.ok(centre.every((connector) => connector.singleConnection === true));
  assert.ok(
    centre.every(
      (connector) =>
        connector.connectionTarget?.partId === "62520" &&
        connector.connectionTarget?.connectorId === 2,
    ),
  );
  assert.deepEqual(end[1].connectionTarget, { partId: "62519" });
  assert.equal(preloadedCollisionMaps["62519"].length, 2);
  assert.equal(preloadedCollisionMaps["62520"].length, 1);
});

test("connector target rules accept either free Cardan arm but reject other parts", () => {
  const centreConnectors = preloadedConnectionMaps["62519"],
    endConnectors = preloadedConnectionMaps["62520"],
    centre = { part: "62519", connectors: centreConnectors },
    end = { part: "62520", connectors: endConnectors },
    other = { part: "2780", connectors: [endConnectors[1]] };

  assert.equal(
    connectorPoliciesCompatible(centre, centreConnectors[0], end, endConnectors[1]),
    true,
  );
  assert.equal(
    connectorPoliciesCompatible(centre, centreConnectors[1], end, endConnectors[1]),
    true,
  );
  assert.equal(
    connectorPoliciesCompatible(centre, centreConnectors[0], end, endConnectors[0]),
    false,
  );
  assert.equal(
    connectorPoliciesCompatible(centre, centreConnectors[0], other, other.connectors[0]),
    false,
  );
});

test("the two official Cardan end poses align with different centre pivots", () => {
  const centre = preloadedConnectionMaps["62519"],
    endAxis = new THREE.Vector3().fromArray(preloadedConnectionMaps["62520"][1].axis),
    secondEndRotation = new THREE.Quaternion(Math.SQRT1_2, Math.SQRT1_2, 0, 0),
    firstAxis = endAxis.clone(),
    secondAxis = endAxis.clone().applyQuaternion(secondEndRotation);
  assert.ok(
    Math.abs(firstAxis.dot(new THREE.Vector3().fromArray(centre[0].axis))) > 0.999,
  );
  assert.ok(
    Math.abs(secondAxis.dot(new THREE.Vector3().fromArray(centre[1].axis))) > 0.999,
  );
  assert.ok(Math.abs(firstAxis.dot(secondAxis)) < 0.001);
});

test("autoconnect breaks coincident ties by axis orientation with 180 degrees equivalent", () => {
  const alignedError =
      1 - Math.abs(new THREE.Vector3(1, 0, 0).dot(new THREE.Vector3(-1, 0, 0))),
    perpendicularError =
      1 - Math.abs(new THREE.Vector3(1, 0, 0).dot(new THREE.Vector3(0, 1, 0)));
  assert.equal(alignedError, 0);
  assert.equal(
    automaticConnectorMatchIsBetter(0.2, alignedError, {
      score: 0.2,
      orientationError: perpendicularError,
    }),
    true,
  );
  assert.equal(
    automaticConnectorMatchIsBetter(0.21, alignedError, {
      score: 0.2,
      orientationError: perpendicularError,
    }),
    false,
  );
});

test("holes and single-use Cardan pivots reject a second connection", () => {
  const centre = preloadedConnectionMaps["62519"][0],
    endSocket = preloadedConnectionMaps["62520"][1],
    reusableShaft = { ...centre, singleConnection: undefined };
  assert.equal(connectorAcceptsAdditionalConnection(centre, true), false);
  assert.equal(connectorAcceptsAdditionalConnection(endSocket, true), false);
  assert.equal(connectorAcceptsAdditionalConnection(reusableShaft, true), true);
  assert.equal(connectorAcceptsAdditionalConnection(centre, false), true);
});

test("legacy Cardan components become one detachable editor assembly", () => {
  const centre = { id: 1, part: "62519" },
    endA = { id: 2, part: "62520" },
    endB = { id: 3, part: "62520" },
    pieces = [centre, endA, endB],
    connections = [
      { a: endA, b: centre, profile: "pin-round" },
      { a: endB, b: centre, profile: "pin-round" },
    ];
  restoreLegacyCardanEditorAssemblies(pieces, connections);
  assert.ok(centre.editorAssemblyId);
  assert.equal(endA.editorAssemblyId, centre.editorAssemblyId);
  assert.equal(endB.editorAssemblyId, centre.editorAssemblyId);
  assert.deepEqual(editorAssemblyMembers(pieces, endA), pieces);

  pieces.forEach((piece) => {
    piece.editorAssemblyId = undefined;
    piece.editorAssemblyDetached = true;
  });
  restoreLegacyCardanEditorAssemblies(pieces, connections);
  assert.ok(pieces.every((piece) => piece.editorAssemblyId === undefined));
});

test("Cardan reference follows a single external axle and stays stable with two", () => {
  const centre = {
      id: 1,
      part: "62519",
      connectors: preloadedConnectionMaps["62519"],
    },
    endA = { id: 2, part: "62520", connectors: preloadedConnectionMaps["62520"] },
    endB = { id: 3, part: "62520", connectors: preloadedConnectionMaps["62520"] },
    axleA = { id: 4, part: "axle-a", connectors: [] },
    axleB = { id: 5, part: "axle-b", connectors: [] },
    axleShaft = { kind: "axle", role: "shaft" },
    internal = [
      {
        a: endA,
        b: centre,
        socket: endA.connectors[1],
        shaft: centre.connectors[0],
      },
      {
        a: endB,
        b: centre,
        socket: endB.connectors[1],
        shaft: centre.connectors[1],
      },
    ],
    externalB = {
      a: endB,
      b: axleB,
      socket: endB.connectors[0],
      shaft: axleShaft,
    },
    externalA = {
      a: endA,
      b: axleA,
      socket: endA.connectors[0],
      shaft: axleShaft,
    };
  const automatic = cardanAssemblyLayout([centre, endA, endB], [...internal, externalB]);
  assert.equal(automatic.first, endB);
  assert.equal(automatic.referenceLockedBySingleAxle, true);
  assert.equal(centre.editorCardanReferenceConnector, 1);

  const retained = cardanAssemblyLayout(
    [centre, endA, endB],
    [...internal, externalA, externalB],
  );
  assert.equal(retained.first, endB);
  assert.equal(retained.referenceLockedBySingleAxle, false);
});

test("editor Cardan kinematics preserves both hinges and produces non-uniform phase", () => {
  const inputShaft = new THREE.Vector3(0, 0, 1),
    outputShaft = new THREE.Vector3(0, Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)),
    localHinge = new THREE.Vector3(1, 0, 0),
    localShaft = new THREE.Vector3(0, 0, -1),
    initialFirstHinge = new THREE.Vector3(1, 0, 0),
    initialSecondHinge = cardanSecondaryAxis(initialFirstHinge, outputShaft, 1);
  assert.ok(initialSecondHinge);
  const solve = (inputAngle) => {
      const firstHinge = initialFirstHinge.clone().applyAxisAngle(inputShaft, inputAngle),
        secondHinge = cardanSecondaryAxis(firstHinge, outputShaft, 1);
      assert.ok(secondHinge);
      const outputRotation = quaternionFromAxisPairs(
        localHinge,
        localShaft,
        secondHinge,
        outputShaft,
      );
      return { firstHinge, secondHinge, outputRotation };
    },
    start = solve(0),
    turned = solve(Math.PI / 4),
    outputReferenceStart = new THREE.Vector3(0, 1, 0).applyQuaternion(
      start.outputRotation,
    ),
    outputReferenceTurned = new THREE.Vector3(0, 1, 0).applyQuaternion(
      turned.outputRotation,
    ),
    outputAngle = Math.atan2(
      outputShaft.dot(outputReferenceStart.clone().cross(outputReferenceTurned)),
      outputReferenceStart.dot(outputReferenceTurned),
    );
  assert.ok(Math.abs(turned.firstHinge.dot(turned.secondHinge)) < 1e-12);
  assert.ok(Math.abs(turned.secondHinge.dot(outputShaft)) < 1e-12);
  assert.ok(Math.abs(outputAngle - Math.PI / 4) > 0.02);
});

test("Cardan inspector coordinates round-trip aim and independent input roll", () => {
  const inputDirection = new THREE.Vector3(0.1, 0.2, 1).normalize(),
    expected = { aimX: 0.31, aimZ: -0.27, roll: 0.83 },
    directions = cardanDirectionsFromCoordinates(inputDirection, expected),
    measured = cardanEditorCoordinates(
      directions.inputDirection,
      directions.outputDirection,
      directions.firstHingeAxis,
    );
  assert.ok(Math.abs(measured.aimX - expected.aimX) < 1e-12);
  assert.ok(Math.abs(measured.aimZ - expected.aimZ) < 1e-12);
  assert.ok(Math.abs(measured.roll - expected.roll) < 1e-12);
});

test("pointer force stays on the depth plane captured by the initial click", () => {
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -4),
    target = forceDragTarget(
      new THREE.Ray(
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0.3, 0.2, -1).normalize(),
      ),
      plane,
    );
  assert.ok(target);
  assert.ok(Math.abs(target.z - 4) < 1e-12);
});

test("a shaft ignores the full rigid host islands but not adjacent mobile islands", () => {
  const hostA = { id: 1 },
    hostAExtension = { id: 2 },
    hostB = { id: 3 },
    adjacentMobileGroup = { id: 4 },
    shaft = { id: 5 },
    otherShaft = { id: 6 },
    islands = new Map([
      [hostA, [hostA, hostAExtension]],
      [hostAExtension, [hostA, hostAExtension]],
      [hostB, [hostB]],
      [adjacentMobileGroup, [adjacentMobileGroup]],
      [shaft, [shaft]],
      [otherShaft, [otherShaft]],
    ]),
    exclusions = buildConnectorContactExclusions(
      [
        { a: hostA, b: shaft },
        { a: hostB, b: shaft },
        { a: hostA, b: otherShaft },
      ],
      islands,
    );
  assert.ok(exclusions.has(contactPairKey(shaft, hostA)));
  assert.ok(exclusions.has(contactPairKey(shaft, hostAExtension)));
  assert.ok(exclusions.has(contactPairKey(shaft, hostB)));
  assert.ok(!exclusions.has(contactPairKey(shaft, adjacentMobileGroup)));
  assert.ok(!exclusions.has(contactPairKey(shaft, otherShaft)));
});
