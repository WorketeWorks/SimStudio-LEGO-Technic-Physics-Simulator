import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import init, { PhysicsEngine } from "../app/physics/wasm/sim_studio_physics.js";

const wasm = new URL(
  "../app/physics/wasm/sim_studio_physics_bg.wasm",
  import.meta.url,
);

await init({ module_or_path: await readFile(wasm) });

const settings = {
  solverIterations: 8,
  internalPgsIterations: 2,
  allowedLinearError: 0.005,
  maxCcdSubsteps: 1,
  largeSimulation: false,
  axleSlidingFriction: 0.08,
  axleRotationFriction: 0.02,
};

test("Rust/WASM advances a non-empty Rapier scene and returns packed transforms", () => {
  const engine = new PhysicsEngine({
    gravity: [0, -9.81, 0],
    settings,
    bodies: [
      {
        id: 1,
        fixed: false,
        position: [0, 3, 0],
        rotation: [0, 0, 0, 1],
        mass: 1,
        linearDamping: 0.1,
        angularDamping: 0.1,
        additionalSolverIterations: 1,
        ccd: true,
        colliders: [
          {
            ownerId: 101,
            center: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            friction: 0.2,
            density: 1,
            collisionGroup: 1,
            collisionMask: 3,
            shape: { kind: "box", halfExtents: [0.5, 0.5, 0.5] },
          },
        ],
      },
    ],
    joints: [],
    gears: [],
    differentials: [],
    excludedColliderPairs: [],
  });

  let transforms;
  transforms = engine.step(1 / 60, [
    {
      kind: "spring",
      body: 1,
      worldPoint: [0, 3, 0],
      target: [1, 3, 0],
      stiffness: 42,
      damping: 13,
      maxForce: 100,
    },
  ]);
  assert.ok(engine.stats().maxSpringForce > 0);
  for (let frame = 1; frame < 30; frame++) transforms = engine.step(1 / 60, []);
  assert.equal(engine.transform_stride(), 15);
  assert.equal(transforms.length, 15);
  assert.equal(transforms[0], 1);
  assert.ok(transforms[2] < 3, "gravity should move the body down");
  assert.equal(engine.stats().bodies, 1);
  engine.free();
});

test("gear ratios and motor joints are solved inside Rust", () => {
  const body = (id, fixed = false) => ({
    id,
    fixed,
    position: [id * 2, 3, 0],
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    additionalSolverIterations: 2,
    ccd: false,
    colliders: [
      {
        ownerId: id + 200,
        center: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        friction: 0,
        density: 1,
        collisionGroup: 1,
        collisionMask: 0,
        shape: { kind: "box", halfExtents: [0.25, 0.25, 0.25] },
      },
    ],
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [body(1), body(2), body(3, true), body(4)],
    joints: [
      {
        id: "motor",
        bodyA: 3,
        bodyB: 4,
        mode: "motor",
        worldAnchorA: [6, 3, 0],
        worldAnchorB: [6, 3, 0],
        worldAxisA: [0, 1, 0],
        worldAxisB: [0, 1, 0],
        travel: 0,
        motorSpeed: 4,
        motorForce: 100,
        passiveMotorForce: 0,
        dynamicAxle: false,
      },
    ],
    gears: [
      {
        id: "1:2",
        nodeA: 1,
        nodeB: 2,
        bodyA: 1,
        bodyB: 2,
        axisA: [0, 1, 0],
        axisB: [0, 1, 0],
        centerA: [2, 3, 0],
        centerB: [4, 3, 0],
        referenceA: [0, 0, 1],
        referenceB: [0, 0, 1],
        teethA: 20,
        teethB: 10,
        signB: 1,
        phaseLock: false,
      },
    ],
    differentials: [],
    excludedColliderPairs: [],
  });

  let transforms = engine.step(1 / 60, [
    { kind: "setAngularVelocity", body: 1, velocity: [0, 3, 0] },
  ]);
  for (let frame = 0; frame < 20; frame++) transforms = engine.step(1 / 60, []);
  const stride = engine.transform_stride();
  const gearA = transforms[12];
  const gearB = transforms[stride + 12];
  const contactVelocityA = transforms[10] - gearA * (4 / 3);
  const contactVelocityB = transforms[stride + 10] + gearB * (2 / 3);
  const motor = transforms[stride * 3 + 12];
  assert.ok(
    Math.abs(contactVelocityA - contactVelocityB) < 0.01,
    `the two pitch surfaces must have zero relative velocity: ${contactVelocityA} vs ${contactVelocityB}; ${JSON.stringify(Array.from(transforms))}`,
  );
  assert.ok(
    Math.abs(motor) > 0.1,
    `the native motor should rotate its body: ${JSON.stringify(Array.from(transforms))}`,
  );
  transforms = engine.step(1 / 60, [
    { kind: "setAngularVelocity", body: 1, velocity: [0, 60, 0] },
  ]);
  const limitedA = transforms[12];
  const limitedB = transforms[stride + 12];
  assert.ok(
    Math.abs(20 * limitedA + 10 * limitedB) < 0.02,
    `speed limiting must preserve the gear ratio: ${limitedA}, ${limitedB}`,
  );
  engine.free();
});

test("orbiting a meshed gear through a carrier produces axial rotation", () => {
  const body = (id, fixed, position) => ({
    id,
    fixed,
    position,
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    additionalSolverIterations: 2,
    ccd: false,
    colliders: [{
      ownerId: 300 + id,
      center: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      friction: 0,
      density: 1,
      collisionGroup: 1,
      collisionMask: 0,
      shape: { kind: "box", halfExtents: [0.25, 0.25, 0.25] },
    }],
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [body(1, true, [0, 0, 0]), body(2, false, [2, 0, 0])],
    joints: [],
    gears: [{
      id: "fixed:planet",
      nodeA: 1,
      nodeB: 2,
      bodyA: 1,
      bodyB: 2,
      axisA: [0, 0, 1],
      axisB: [0, 0, 1],
      centerA: [0, 0, 0],
      centerB: [2, 0, 0],
      referenceA: [1, 0, 0],
      referenceB: [1, 0, 0],
      teethA: 20,
      teethB: 20,
      signB: 1,
      phaseLock: false,
    }],
    differentials: [],
    excludedColliderPairs: [],
  });

  const transforms = engine.step(1 / 60, [
    { kind: "setLinearVelocity", body: 2, velocity: [0, 2, 0] },
  ]);
  const stride = engine.transform_stride();
  const orbitalRate = transforms[stride + 9] / transforms[stride + 1];
  const axialSpeed = transforms[stride + 13];
  assert.ok(
    Math.abs(axialSpeed - 2 * orbitalRate) < 0.02,
    `the carried gear must roll as its centre orbits: spin=${axialSpeed}, orbit=${orbitalRate}`,
  );
  assert.ok(
    Math.abs(axialSpeed) > 0.2,
    `orbital movement must not leave both gear meshes visually static: ${axialSpeed}`,
  );
  engine.free();
});

test("a carried bevel gear transmits motion across perpendicular axes", () => {
  const body = (id, fixed, position) => ({
    id, fixed, position, rotation: [0, 0, 0, 1], mass: 1,
    linearDamping: 0, angularDamping: 0, additionalSolverIterations: 2, ccd: false,
    colliders: [{ ownerId: 400 + id, center: [0, 0, 0], rotation: [0, 0, 0, 1],
      friction: 0, density: 1, collisionGroup: 1, collisionMask: 0,
      shape: { kind: "box", halfExtents: [0.25, 0.25, 0.25] } }],
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0], settings,
    bodies: [body(1, true, [0, 0, 0]), body(2, false, [1, 0, 1])],
    joints: [],
    gears: [{
      id: "fixed:carried-bevel", nodeA: 1, nodeB: 2, bodyA: 1, bodyB: 2,
      axisA: [0, 0, 1], axisB: [1, 0, 0],
      centerA: [0, 0, 0], centerB: [1, 0, 1],
      referenceA: [1, 0, 0], referenceB: [0, 0, 1],
      teethA: 12, teethB: 12, signB: -1, phaseLock: false,
    }],
    differentials: [], excludedColliderPairs: [],
  });

  const transforms = engine.step(1 / 60, [
    { kind: "setLinearVelocity", body: 2, velocity: [0, 2, 0] },
  ]);
  const stride = engine.transform_stride();
  const carriedGearSpin = transforms[stride + 11];
  assert.ok(
    Math.abs(carriedGearSpin) > 1,
    `perpendicular tooth contact must turn the carried bevel gear: ${carriedGearSpin}`,
  );
  engine.free();
});

test("a bevel differential routes a driven side through its free carrier", () => {
  const body = (id, fixed, position) => ({
    id,
    fixed,
    position,
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    additionalSolverIterations: 8,
    ccd: false,
    colliders: [
      {
        ownerId: 450 + id,
        center: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        friction: 0,
        density: 1,
        collisionGroup: 1,
        collisionMask: 0,
        shape: { kind: "box", halfExtents: [0.2, 0.2, 0.2] },
      },
    ],
  });
  const joint = (id, bodyA, bodyB, anchor, axis) => ({
    id,
    bodyA,
    bodyB,
    mode: "rotation",
    worldAnchorA: anchor,
    worldAnchorB: anchor,
    worldAxisA: axis,
    worldAxisB: axis,
    travel: 0,
    motorSpeed: 0,
    motorForce: 0,
    passiveMotorForce: 0,
    dynamicAxle: false,
  });
  const gear = (id, bodyA, bodyB, centerA, centerB) => ({
    id,
    nodeA: bodyA,
    nodeB: bodyB,
    bodyA,
    bodyB,
    axisA: [0, 0, 1],
    axisB: [1, 0, 0],
    centerA,
    centerB,
    referenceA: [1, 0, 0],
    referenceB: [0, 0, 1],
    teethA: 12,
    teethB: 12,
    signB: -1,
    phaseLock: false,
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [
      body(1, true, [0, 0, -1]),
      body(2, false, [0, 0, 1]),
      body(3, false, [0, 0, 0]),
      body(4, false, [1, 0, 0]),
      body(5, true, [0, 0, 0]),
    ],
    joints: [
      joint("output-axle", 5, 2, [0, 0, 1], [0, 0, 1]),
      joint("carrier-axle", 5, 3, [0, 0, 0], [0, 0, 1]),
      joint("satellite-axle", 3, 4, [1, 0, 0], [1, 0, 0]),
    ],
    gears: [
      gear("left:satellite", 1, 4, [0, 0, -1], [1, 0, 0]),
      gear("right:satellite", 2, 4, [0, 0, 1], [1, 0, 0]),
    ],
    differentials: [],
    excludedColliderPairs: [],
  });

  let transforms;
  for (let frame = 0; frame < 12; frame++)
    transforms = engine.step(1 / 60, [
      { kind: "setAngularVelocity", body: 2, velocity: [0, 0, 6] },
    ]);
  const stride = engine.transform_stride();
  const output = transforms[stride + 13];
  const carrier = transforms[stride * 2 + 13];
  assert.ok(Math.abs(output) > 1, `the driven output must not be cancelled: ${output}`);
  assert.ok(
    Math.abs(carrier) > 0.5,
    `the blocked opposite side must drive the carrier: ${carrier}`,
  );
  assert.ok(
    Math.abs(output - 2 * carrier) < 0.2,
    `a blocked side requires output = 2 * carrier: ${output}, ${carrier}`,
  );
  engine.free();
});

test("rubber loops pull through elastic contacts without rigid joints", () => {
  const node = (id, position) => ({
    id, fixed: false, position, rotation: [0, 0, 0, 1], mass: 0.012,
    linearDamping: 0, angularDamping: 0, additionalSolverIterations: 2, ccd: true,
    colliders: [{ ownerId: 9000 + id, center: [0, 0, 0], rotation: [0, 0, 0, 1],
      friction: 1.2, density: 0, collisionGroup: 1, collisionMask: 1,
      shape: { kind: "ball", radius: 0.06 } }],
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0], settings,
    bodies: [node(1, [0, 0, 0]), node(2, [2, 0, 0]), node(3, [1, 2, 0])],
    joints: [], gears: [], differentials: [], axialStops: [], excludedColliderPairs: [],
    rubberBands: [{ nodeIds: [1, 2, 3], restLength: 1, stiffness: 90, damping: 2 }],
  });
  const first = engine.step(1 / 60, []);
  for (let frame = 0; frame < 20; frame++) engine.step(1 / 60, []);
  const after = engine.step(1 / 60, []);
  const stride = engine.transform_stride();
  const loopLength = (transforms) => {
    const positions = Array.from({ length: 3 }, (_, index) =>
      Array.from(transforms.slice(index * stride + 1, index * stride + 4)),
    );
    return positions.reduce((total, point, index) => {
      const next = positions[(index + 1) % positions.length];
      return total + Math.hypot(point[0] - next[0], point[1] - next[1], point[2] - next[2]);
    }, 0);
  };
  assert.ok(loopLength(after) < loopLength(first), "elastic tension should shorten the loop");
  let disturbed = after;
  for (let frame = 0; frame < 90; frame++)
    disturbed = engine.step(1 / 60, frame === 0
      ? [{ kind: "impulse", body: 1, impulse: [0.08, 0, 0] }]
      : []);
  assert.ok(
    Math.max(...Array.from(disturbed).filter(Number.isFinite).map(Math.abs)) < 8,
    "a small perturbation must not launch rubber nodes out of the scene",
  );
  assert.equal(engine.stats().joints, 0, "rubber links are not rigid joints");
  engine.free();
});

test("rubber tension transfers motion through a collider contact", () => {
  const body = (id, position, mass, radius) => ({
    id, fixed: false, position, rotation: [0, 0, 0, 1], mass,
    linearDamping: 0.2, angularDamping: 0, additionalSolverIterations: 4, ccd: true,
    colliders: [{ ownerId: 9500 + id, center: [0, 0, 0], rotation: [0, 0, 0, 1],
      friction: 1.35, density: 0, collisionGroup: 1, collisionMask: 1,
      shape: { kind: "ball", radius } }],
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0], settings,
    bodies: [
      body(1, [0, 0, 0], 0.001, 0.08),
      body(2, [2, 0, 0], 0.001, 0.08),
      body(3, [1, 2, 0], 0.001, 0.08),
      body(4, [0.14, 0, 0], 0.65, 0.1),
    ],
    joints: [], gears: [], differentials: [], axialStops: [], excludedColliderPairs: [],
    rubberBands: [{ nodeIds: [1, 2, 3], restLength: 1, stiffness: 240, damping: 1 }],
  });
  let transforms;
  for (let frame = 0; frame < 30; frame++) transforms = engine.step(1 / 60, []);
  const obstacleX = transforms[engine.transform_stride() * 3 + 1];
  assert.ok(obstacleX > 0.145, `rubber contact should push the obstacle: ${obstacleX}`);
  engine.free();
});

test("a densely sampled rubber loop settles after a strong point drag", () => {
  const count = 93;
  const radius = 7.1 / (2 * Math.PI);
  const bodies = Array.from({ length: count }, (_, index) => {
    const angle = index / count * 2 * Math.PI;
    return {
      id: index + 1,
      fixed: false,
      position: [Math.cos(angle) * radius, Math.sin(angle) * radius + 3, 0],
      rotation: [0, 0, 0, 1],
      mass: 0.04 / count,
      linearDamping: 4.5,
      angularDamping: 1,
      additionalSolverIterations: 4,
      ccd: true,
      colliders: [{
        ownerId: 20_000 + index,
        center: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        friction: 1.35,
        density: 0,
        collisionGroup: 1,
        collisionMask: 1,
        shape: { kind: "ball", radius: 0.105 },
      }],
    };
  });
  const excludedColliderPairs = [];
  for (let index = 0; index < count; index++) {
    for (const offset of [1, 2]) {
      excludedColliderPairs.push([
        20_000 + index,
        20_000 + (index + offset) % count,
      ]);
    }
  }
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0], settings, bodies,
    joints: [], gears: [], differentials: [], axialStops: [], excludedColliderPairs,
    rubberBands: [{
      nodeIds: bodies.map(({ id }) => id),
      restLength: 10.2,
      stiffness: 4 / 10.2,
      damping: 1,
    }],
  });

  let transforms;
  for (let frame = 0; frame < 55; frame++) {
    const x = transforms?.[1] ?? radius;
    const y = transforms?.[2] ?? 3;
    transforms = engine.step(1 / 60, [{
      kind: "spring",
      body: 1,
      worldPoint: [x, y, 0],
      target: [radius + 4, 3, 0],
      stiffness: 2400,
      damping: 90,
      maxForce: 240,
    }]);
  }
  for (let frame = 0; frame < 180; frame++) transforms = engine.step(1 / 60, []);

  const stride = engine.transform_stride();
  const points = Array.from({ length: count }, (_, index) =>
    Array.from(transforms.slice(index * stride + 1, index * stride + 4)),
  );
  const speeds = Array.from({ length: count }, (_, index) =>
    Math.hypot(...transforms.slice(index * stride + 8, index * stride + 11)),
  );
  const gaps = points.map((point, index) => {
    const next = points[(index + 1) % count];
    return Math.hypot(point[0] - next[0], point[1] - next[1], point[2] - next[2]);
  });
  assert.ok(Math.max(...speeds) < 0.5, `released loop must settle: ${Math.max(...speeds)}`);
  assert.ok(Math.max(...gaps) < 0.2, `released loop must close collision gaps: ${Math.max(...gaps)}`);
  engine.free();
});

test("a long gear train transmits opposing torque without exploding", () => {
  const gearCount = 15;
  const gearBody = (id) => ({
    id,
    fixed: false,
    position: [(id - 1) * 2, 0, 0],
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    additionalSolverIterations: 2,
    ccd: false,
    colliders: [{
      ownerId: 700 + id,
      center: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      friction: 0,
      density: 1,
      collisionGroup: 1,
      collisionMask: 0,
      shape: { kind: "box", halfExtents: [0.4, 0.2, 0.4] },
    }],
  });
  const support = {
    ...gearBody(100),
    fixed: true,
    position: [0, 0, 0],
  };
  const gears = Array.from({ length: gearCount - 1 }, (_, index) => ({
    id: `${index + 1}:${index + 2}`,
    nodeA: index + 1,
    nodeB: index + 2,
    bodyA: index + 1,
    bodyB: index + 2,
    axisA: [0, 1, 0],
    axisB: [0, 1, 0],
    centerA: [index * 2, 0, 0],
    centerB: [(index + 1) * 2, 0, 0],
    referenceA: [0, 0, 1],
    referenceB: [0, 0, 1],
    teethA: 16,
    teethB: 16,
    signB: 1,
    phaseLock: false,
  }));
  const joints = Array.from({ length: gearCount }, (_, index) => ({
    id: `axle-${index + 1}`,
    bodyA: 100,
    bodyB: index + 1,
    mode: "rotation",
    worldAnchorA: [index * 2, 0, 0],
    worldAnchorB: [index * 2, 0, 0],
    worldAxisA: [0, 1, 0],
    worldAxisB: [0, 1, 0],
    travel: 0,
    motorSpeed: 0,
    motorForce: 0,
    passiveMotorForce: 0,
    dynamicAxle: false,
  }));
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [...Array.from({ length: gearCount }, (_, index) => gearBody(index + 1)), support],
    joints,
    gears,
    differentials: [],
    excludedColliderPairs: [],
  });
  let transforms;
  for (let frame = 0; frame < 120; frame++)
    transforms = engine.step(1 / 60, [
      { kind: "torqueImpulse", body: 1, impulse: [0, 0.08, 0] },
      { kind: "torqueImpulse", body: gearCount, impulse: [0, -0.05, 0] },
    ]);
  const stride = engine.transform_stride();
  const angular = Array.from({ length: gearCount }, (_, index) => transforms[index * stride + 12]);
  for (let index = 0; index < angular.length - 1; index++)
    assert.ok(
      Math.abs(angular[index] + angular[index + 1]) < 0.05,
      `neighbouring gears must remain inverse: ${angular.join(", ")}`,
    );
  assert.ok(
    angular.every((speed) => Number.isFinite(speed) && Math.abs(speed) <= 80),
    `gear train velocity must stay bounded: ${angular.join(", ")}`,
  );
  assert.ok(
    Math.abs(angular.at(-1)) > 0.1,
    `torque must reach the last gear against its load: ${angular.join(", ")}`,
  );
  const maximumLinearSpeed = Math.max(
    ...Array.from({ length: gearCount }, (_, index) =>
      Math.hypot(
        transforms[index * stride + 8],
        transforms[index * stride + 9],
        transforms[index * stride + 10],
      ),
    ),
  );
  assert.ok(maximumLinearSpeed < 0.1, `gear torque injected linear speed: ${maximumLinearSpeed}`);
  engine.free();
});

test("three-body differential routes motion through every free member", () => {
  const body = (id, fixed = false) => ({
    id,
    fixed,
    position: [id * 2, 0, 0],
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    additionalSolverIterations: 2,
    ccd: false,
    colliders: [{
      ownerId: 500 + id,
      center: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      friction: 0,
      density: 1,
      collisionGroup: 1,
      collisionMask: 0,
      shape: { kind: "box", halfExtents: [0.5, 0.5, 0.5] },
    }],
  });
  const run = (fixedLeft, fixedRight, fixedCarrier, drivenBody) => {
    const engine = new PhysicsEngine({
      gravity: [0, 0, 0],
      settings,
      bodies: [body(1, fixedLeft), body(2, fixedRight), body(3, fixedCarrier)],
      joints: [],
      gears: [],
      differentials: [{
        id: "diff",
        leftBody: 1,
        rightBody: 2,
        carrierBody: 3,
        axis: [0, 0, 1],
      }],
      excludedColliderPairs: [],
    });
    const transforms = engine.step(1 / 60, [
      { kind: "setAngularVelocity", body: drivenBody, velocity: [0, 0, 6] },
    ]);
    const stride = engine.transform_stride();
    const result = [transforms[13], transforms[stride + 13], transforms[stride * 2 + 13]];
    engine.free();
    return result;
  };

  const [left, right, fixedCarrier] = run(false, false, true, 1);
  assert.ok(left * right < 0, `fixed carrier must invert the outputs: ${left}, ${right}`);
  assert.ok(Math.abs(left + right) < 1e-4);

  const [driven, fixedRight, carrier] = run(false, true, false, 1);
  assert.ok(Math.abs(fixedRight) < 1e-6);
  assert.ok(carrier > 0, `a blocked output must route motion to the carrier: ${carrier}`);
  assert.ok(Math.abs(driven - 2 * carrier) < 1e-4);

  const [freeInput, restingSide, routedCarrier] = run(false, false, false, 1);
  assert.ok(Math.abs(freeInput - 6) < 1e-4, `active side input must not be damped: ${freeInput}`);
  assert.ok(Math.abs(restingSide) < 1e-4);
  assert.ok(Math.abs(routedCarrier - 3) < 1e-4);

  const [carrierLeft, carrierRight, drivenCarrier] = run(false, false, false, 3);
  assert.ok(Math.abs(drivenCarrier - 6) < 1e-4, `carrier input must remain easy to turn: ${drivenCarrier}`);
  assert.ok(Math.abs(carrierLeft - 6) < 1e-4 && Math.abs(carrierRight - 6) < 1e-4);

  const [, , blockedCarrier] = run(true, true, false, 3);
  assert.ok(Math.abs(blockedCarrier) < 1e-5, `two blocked outputs must lock the carrier: ${blockedCarrier}`);
});

test("a differential satellite spins with the output difference and corrects tooth phase", () => {
  const body = (id, position) => ({
    id,
    fixed: false,
    position,
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    additionalSolverIterations: 2,
    ccd: false,
    colliders: [{
      ownerId: 800 + id,
      center: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      friction: 0,
      density: 1,
      collisionGroup: 1,
      collisionMask: 0,
      shape: { kind: "box", halfExtents: [0.2, 0.2, 0.2] },
    }],
  });
  const scene = (reference) => ({
    gravity: [0, 0, 0],
    settings,
    bodies: [
      body(1, [0, 0, -1]),
      body(2, [0, 0, 1]),
      body(3, [0, 0, 0]),
      body(4, [0, 1, 0]),
    ],
    joints: [],
    gears: [],
    differentials: [{
      id: "diff-with-satellite",
      leftBody: 1,
      rightBody: 2,
      carrierBody: 3,
      axis: [0, 0, 1],
      satellites: [{
        body: 4,
        sideBody: 1,
        axis: [0, 1, 0],
        sideAxis: [0, 0, 1],
        center: [0, 1, 0],
        sideCenter: [0, 0, -1],
        reference,
        sideReference: [0, 1, 0],
        coefficient: 12,
        sideCoefficient: 12,
        phaseLock: true,
      }],
    }],
    excludedColliderPairs: [],
  });

  const alignedReference = [-Math.sin(Math.PI / 12), 0, Math.cos(Math.PI / 12)];
  let engine = new PhysicsEngine(scene(alignedReference));
  let transforms = engine.step(1 / 60, [
    { kind: "setAngularVelocity", body: 1, velocity: [0, 0, 6] },
  ]);
  const stride = engine.transform_stride();
  const satelliteSpin = transforms[stride * 3 + 12];
  assert.ok(Math.abs(satelliteSpin) > 2.5, `satellite must visibly spin: ${satelliteSpin}`);
  engine.free();

  engine = new PhysicsEngine(scene([0, 0, 1]));
  transforms = engine.step(1 / 60, []);
  const phaseCorrectionSpin = transforms[stride * 3 + 12];
  assert.ok(
    Math.abs(phaseCorrectionSpin) > 0.5,
    `tooth-on-tooth satellite must move toward a gap: ${phaseCorrectionSpin}`,
  );
  for (let index = 0; index < 180; index++)
    transforms = engine.step(1 / 60, []);
  const settledPhaseSpin = transforms[stride * 3 + 12];
  assert.ok(
    Math.abs(settledPhaseSpin) < 0.1,
    `satellite phase correction must settle instead of spinning forever: ${settledPhaseSpin}`,
  );
  engine.free();
});

test("tooth phase captures an initially tooth-on-tooth gear into a valid gap", () => {
  const body = (id, fixed, position) => ({
    id,
    fixed,
    position,
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0.15,
    angularDamping: 0.15,
    additionalSolverIterations: 4,
    ccd: false,
    colliders: [{
      ownerId: id + 500,
      center: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      friction: 0,
      density: 1,
      collisionGroup: 1,
      collisionMask: 0,
      shape: { kind: "box", halfExtents: [0.25, 0.25, 0.25] },
    }],
  });
  const gearConfig = {
    id: "phase-1:2",
    nodeA: 1,
    nodeB: 2,
    bodyA: 1,
    bodyB: 2,
    axisA: [0, 1, 0],
    axisB: [0, 1, 0],
    centerA: [0, 0, 0],
    centerB: [2, 0, 0],
    referenceA: [1, 0, 0],
    referenceB: [1, 0, 0],
    teethA: 16,
    teethB: 16,
    signB: 1,
    phaseLock: true,
  };
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [body(1, true, [0, 0, 0]), body(2, false, [2, 0, 0]), body(3, true, [2, 0, 0])],
    joints: [{
      id: "gear-b-axle",
      bodyA: 3,
      bodyB: 2,
      mode: "rotation",
      worldAnchorA: [2, 0, 0],
      worldAnchorB: [2, 0, 0],
      worldAxisA: [0, 1, 0],
      worldAxisB: [0, 1, 0],
      travel: 0,
      motorSpeed: 0,
      motorForce: 0,
      passiveMotorForce: 0,
      dynamicAxle: false,
    }],
    gears: [gearConfig],
    excludedColliderPairs: [],
  });

  let transforms;
  for (let frame = 0; frame < 30; frame++) transforms = engine.step(1 / 60, []);
  const stride = engine.transform_stride();
  const y = transforms[stride + 5];
  const w = transforms[stride + 7];
  const angle = 2 * Math.atan2(y, w);
  const halfToothPitch = Math.PI / 16;
  assert.ok(
    Math.abs(Math.abs(angle) - halfToothPitch) < 0.04,
    `expected half-tooth capture (${halfToothPitch}), got ${angle}`,
  );

  // A dynamic topology refresh must retain the same engaged tooth. Simulate
  // an external one-tooth overwrite immediately before replace_gears().
  const toothPitch = Math.PI / 8;
  transforms = engine.step(1 / 60, [{
    kind: "setRotation",
    body: 2,
    rotation: [0, Math.sin((angle + toothPitch) / 2), 0, Math.cos((angle + toothPitch) / 2)],
  }]);
  const overwrittenAngle = 2 * Math.atan2(
    transforms[stride + 5],
    transforms[stride + 7],
  );
  engine.replace_gears([{
    ...gearConfig,
    referenceB: [Math.cos(overwrittenAngle), 0, -Math.sin(overwrittenAngle)],
  }]);
  for (let frame = 0; frame < 120; frame++) transforms = engine.step(1 / 60, []);
  const finalAngle = 2 * Math.atan2(transforms[stride + 5], transforms[stride + 7]);
  const retainedError = Math.atan2(Math.sin(finalAngle - angle), Math.cos(finalAngle - angle));
  assert.ok(
    Math.abs(retainedError) < 0.05,
    `dynamic refresh changed the engaged tooth: ${angle} -> ${finalAngle}`,
  );
  engine.free();
});

test("dynamic axle joints correct radial and angular capture error", () => {
  const axleTilt = Math.PI / 10;
  const body = (id, fixed, position) => ({
    id,
    fixed,
    position,
    rotation: [0, 0, 0, 1],
    mass: 1,
    linearDamping: 0.05,
    angularDamping: 0.05,
    additionalSolverIterations: 4,
    ccd: false,
    colliders: [
      {
        ownerId: id + 300,
        center: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        friction: 0,
        density: 1,
        collisionGroup: 1,
        collisionMask: 0,
        shape: { kind: "box", halfExtents: [0.1, 0.4, 0.1] },
      },
    ],
  });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [body(1, true, [0, 0, 0]), body(2, false, [0.15, 0, 0])],
    joints: [
      {
        id: "dynamic-axle",
        bodyA: 1,
        bodyB: 2,
        mode: "rotation-linear",
        worldAnchorA: [0, 0, 0],
        worldAnchorB: [0.15, 0, 0],
        worldAxisA: [0, 1, 0],
        worldAxisB: [Math.sin(axleTilt), Math.cos(axleTilt), 0],
        travel: 2,
        motorSpeed: 0,
        motorForce: 0,
        passiveMotorForce: 0,
        dynamicAxle: true,
      },
    ],
    gears: [],
    differentials: [],
    excludedColliderPairs: [],
  });

  let transforms;
  for (let frame = 0; frame < 90; frame++) transforms = engine.step(1 / 60, []);
  const stride = engine.transform_stride();
  const bodyB = Array.from(transforms.slice(stride, stride * 2));
  assert.ok(Math.abs(bodyB[1]) < 0.025, `axle should be centred radially: ${bodyB[1]}`);
  assert.ok(
    Math.abs(bodyB[6]) > 0.05,
    `axle body should rotate to remove its captured tilt: ${JSON.stringify(bodyB)}`,
  );
  engine.free();
});

test("a two-hinge Cardan transmits rotation between angled axle bearings", () => {
  const bend = Math.PI / 7, half = bend / 2, rootHalf = Math.SQRT1_2,
    outputRotation = [Math.cos(half) * rootHalf, Math.cos(half) * rootHalf,
      Math.sin(half) * rootHalf, -Math.sin(half) * rootHalf],
    outputAxis = [0, Math.sin(bend), -Math.cos(bend)],
    body = (id, fixed, rotation = [0, 0, 0, 1]) => ({
      id, fixed, position: [0, 2, 0], rotation, mass: 0.65,
      linearDamping: 0, angularDamping: 0.05,
      additionalSolverIterations: 8, ccd: false,
      colliders: [{ ownerId: 600 + id, center: [0, 0, 0],
        rotation: [0, 0, 0, 1], friction: 0, density: 0.1,
        collisionGroup: 1, collisionMask: 0,
        shape: { kind: "box", halfExtents: [0.1, 0.1, 0.1] } }],
    }),
    joint = (id, bodyA, bodyB, axis, mode = "rotation") => ({
      id, bodyA, bodyB, mode,
      worldAnchorA: [0, 2, 0], worldAnchorB: [0, 2, 0],
      worldAxisA: axis, worldAxisB: axis, travel: 0,
      motorSpeed: mode === "motor" ? 3 : 0,
      motorForce: mode === "motor" ? 500 : 0,
      passiveMotorForce: 0, dynamicAxle: false,
    });
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0], settings,
    bodies: [body(1, true), body(2, false), body(3, false, outputRotation), body(4, false)],
    joints: [
      joint("input-bearing", 1, 2, [0, 0, 1], "motor"),
      joint("output-bearing", 1, 3, outputAxis),
      joint("cardan-yoke-a", 2, 4, [0, 1, 0]),
      joint("cardan-yoke-b", 3, 4, [1, 0, 0]),
    ],
    gears: [], differentials: [], axialStops: [], rubberBands: [],
    excludedColliderPairs: [],
  });
  let transforms;
  for (let frame = 0; frame < 180; frame++) transforms = engine.step(1 / 60, []);
  const stride = engine.transform_stride(), inputSpeed = transforms[stride + 13],
    outputOffset = stride * 2,
    outputSpeed = transforms[outputOffset + 11] * outputAxis[0] +
      transforms[outputOffset + 12] * outputAxis[1] +
      transforms[outputOffset + 13] * outputAxis[2];
  assert.ok(Math.abs(inputSpeed) > 1, `input motor did not turn: ${inputSpeed}`);
  assert.ok(Math.abs(outputSpeed) > 0.5,
    `the angled Cardan output did not receive rotation: ${outputSpeed}`);
  assert.ok(Math.abs(Math.abs(outputSpeed / inputSpeed) - 1) < 0.35,
    `the Cardan ratio should remain near 1:1: ${inputSpeed} -> ${outputSpeed}`);
  engine.free();
});

test("spring dragging scales to Rapier's real compound-body mass", () => {
  const engine = new PhysicsEngine({
    gravity: [0, 0, 0],
    settings,
    bodies: [
      {
        id: 1,
        fixed: false,
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        mass: 1,
        linearDamping: 0,
        angularDamping: 0,
        additionalSolverIterations: 1,
        ccd: false,
        colliders: [
          {
            ownerId: 401,
            center: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            friction: 0,
            density: 100,
            collisionGroup: 1,
            collisionMask: 0,
            shape: { kind: "box", halfExtents: [1, 1, 1] },
          },
        ],
      },
    ],
    joints: [],
    gears: [],
    differentials: [],
    excludedColliderPairs: [],
  });

  let transforms;
  for (let frame = 0; frame < 12; frame++) {
    const x = transforms?.[1] ?? 0;
    transforms = engine.step(1 / 60, [
      {
        kind: "spring",
        body: 1,
        worldPoint: [x, 0, 0],
        target: [1, 0, 0],
        stiffness: 72,
        damping: 9,
        // Deliberately tiny: Rust must raise this using the body's real mass.
        maxForce: 1,
      },
    ]);
  }
  assert.ok(transforms[1] > 0.2, `heavy body should remain draggable: ${transforms[1]}`);
  engine.free();
});
