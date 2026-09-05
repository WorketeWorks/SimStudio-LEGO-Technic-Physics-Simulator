import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import init, { PhysicsEngine } from "../app/physics/wasm/sim_studio_physics.js";

await init({ module_or_path: await readFile(new URL(
  "../app/physics/wasm/sim_studio_physics_bg.wasm", import.meta.url,
)) });

const settings = {
  solverIterations: 8, internalPgsIterations: 2, allowedLinearError: 0.005,
  maxCcdSubsteps: 1, largeSimulation: false,
  axleSlidingFriction: 0, axleRotationFriction: 0,
};
const body = (id, fixed = false) => ({
  id, fixed, position: [id * 2, 3, 0], rotation: [0, 0, 0, 1], mass: 1,
  linearDamping: 0, angularDamping: 0, additionalSolverIterations: 4, ccd: false,
  colliders: [{
    ownerId: id, center: [0, 0, 0], rotation: [0, 0, 0, 1], friction: 0,
    density: 1, collisionGroup: 1, collisionMask: 0,
    shape: { kind: "box", halfExtents: [0.5, 0.5, 0.5] },
  }],
});
const pivot = (id, support = 10, mode = "rotation") => ({
  id: `pivot-${id}`, bodyA: support, bodyB: id, mode,
  worldAnchorA: [id * 2, 3, 0], worldAnchorB: [id * 2, 3, 0],
  worldAxisA: [0, 0, 1], worldAxisB: [0, 0, 1],
  travel: 0, motorSpeed: 6, motorForce: 10, passiveMotorForce: 0, dynamicAxle: false,
});
const gear = (a, b, ratio = 1, phaseLock = false) => ({
  id: `mesh-${a}-${b}`, nodeA: a, nodeB: b, bodyA: a, bodyB: b,
  axisA: [0, 0, 1], axisB: [0, 0, 1],
  centerA: [a * 2, 3, 0], centerB: [b * 2, 3, 0],
  referenceA: [1, 0, 0], referenceB: [1, 0, 0],
  teethA: 16, teethB: 16 * Math.abs(ratio), signB: Math.sign(ratio), phaseLock,
});
const differential = {
  id: "diff", leftBody: 1, rightBody: 2, carrierBody: 3, axis: [0, 0, 1],
};
const scene = (overrides = {}) => ({
  gravity: [0, 0, 0], settings, bodies: [body(1), body(2), body(3)],
  joints: [], gears: [], differentials: [differential], excludedColliderPairs: [],
  ...overrides,
});
const spins = (state) => [state[13], state[28], state[43]];
const close = (actual, expected, message, tolerance = 1e-3) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${message}: ${actual} != ${expected}`);

test("a differential transfers reaction torque without creating kinetic energy", () => {
  for (const input of [1, 2, 3]) {
    const engine = new PhysicsEngine(scene());
    try {
      const state = engine.step(1 / 60, [{
        kind: "setAngularVelocity", body: input, velocity: [0, 0, 6],
      }]);
      const w = spins(state);
      assert.ok(w.reduce((sum, v) => sum + v * v, 0) <= 36.001, `energy increased: ${w}`);
      close(w[0] + w[1] - 2 * w[2], 0, "differential relation");
      close(w.reduce((sum, v) => sum + v, 0), 6, "angular momentum");
      const expected = input === 1 ? [5, -1, 2] : input === 2 ? [-1, 5, 2] : [2, 2, 2];
      expected.forEach((value, i) => close(w[i], value, "inertia-weighted response"));
    } finally { engine.free(); }
  }
});

test("differential feedback obeys the reducer and multiplier ratios without gaining energy", () => {
  for (const ratio of [2, -1.5]) {
    for (const reversed of [false, true]) {
      const meshes = [gear(2, 3, ratio), gear(1, 4)];
      const engine = new PhysicsEngine(scene({
        bodies: [body(1), body(2), body(3), body(4), body(10, true)],
        joints: [1, 2, 3, 4].map((id) => pivot(id)),
        gears: reversed ? meshes.reverse() : meshes,
      }));
      try {
        let state = engine.step(1 / 60, [{
          kind: "setAngularVelocity", body: 1, velocity: [0, 0, 6],
        }]);
        let previousEnergy = 36;
        for (let frame = 0; frame < 180; frame++) {
          const [left, right, carrier] = spins(state);
          close(left + right - 2 * carrier, 0, "differential feedback");
          close(right + ratio * carrier, 0, "feedback mesh");
          close(left + state[58], 0, "input mesh");
          close(left, (2 + ratio) * carrier, "overall transmission ratio");
          const energy = [left, right, carrier, state[58]].reduce((sum, w) => sum + w * w, 0);
          assert.ok(energy <= previousEnergy + 0.002, `passive feedback gained energy: ${energy} > ${previousEnergy}`);
          previousEnergy = energy;
          state = engine.step(1 / 60, []);
        }
        assert.ok(Math.abs(state[13]) > 0.01, "a consistent feedback loop must remain mobile");
      } finally { engine.free(); }
    }
  }
});

test("a fixed satellite reacts on the side shafts and carrier", () => {
  const engine = new PhysicsEngine(scene({
    bodies: [body(1), body(2), body(3), body(4, true), body(10, true)],
    joints: [1, 2, 3].map((id) => pivot(id)),
    differentials: [{ ...differential, satellites: [{
      body: 4, sideBody: 1, axis: [0, 1, 0], sideAxis: [0, 0, 1],
      center: [8, 3, 0], sideCenter: [2, 3, 0],
      reference: [1, 0, 0], sideReference: [1, 0, 0],
      coefficient: 12, sideCoefficient: 12, phaseLock: false,
    }] }],
  }));
  try {
    const w = spins(engine.step(1 / 60, [{
      kind: "setAngularVelocity", body: 1, velocity: [0, 0, 6],
    }]));
    close(w[0], w[2], "blocked satellite prevents side/carrier relative spin");
    close(w[1], w[2], "reaction reaches opposite side");
  } finally { engine.free(); }
});

test("moving gear centres exchange forces without creating kinetic energy", () => {
  const engine = new PhysicsEngine(scene({
    bodies: [body(1), body(2)], gears: [gear(1, 2)], differentials: [],
  }));
  try {
    const state = engine.step(1 / 60, [{
      kind: "setLinearVelocity", body: 2, velocity: [0, 1, 0],
    }]);
    // Each unit cube has total mass 2 and I = m / 6 about every axis.
    let energy = 0;
    for (const offset of [0, 15]) {
      for (let axis = 0; axis < 3; axis++) {
        energy += state[offset + 8 + axis] ** 2;
        energy += state[offset + 11 + axis] ** 2 / 6;
      }
    }
    assert.ok(energy <= 1.001, `orbital constraint created energy: ${energy}`);
    assert.ok(state[9] > 0.01, "moving centre must push back on the other gear");
    close(state[9] + state[24], 1, "linear momentum");
  } finally { engine.free(); }
});

test("a continuously powered gear cannot advance teeth against a fixed gear", () => {
  const engine = new PhysicsEngine(scene({
    bodies: [body(1), body(2, true), body(10, true)],
    joints: [{ ...pivot(1, 10, "motor"), motorForce: 10_000 }],
    gears: [gear(1, 2, 1, true)], differentials: [],
  }));
  try {
    let state;
    for (let frame = 0; frame < 60; frame++) state = engine.step(1 / 60, []);
    const initialAngle = 2 * Math.atan2(state[6], state[7]);
    let previous = initialAngle;
    let travel = 0;
    for (let frame = 0; frame < 600; frame++) {
      state = engine.step(1 / 60, []);
      const angle = 2 * Math.atan2(state[6], state[7]);
      travel += Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
      previous = angle;
    }
    assert.ok(Math.abs(travel) < Math.PI / 16, `blocked motor skipped teeth: ${travel} radians`);
    close(state[13], 0, "blocked gear speed", 0.02);
  } finally { engine.free(); }
});

test("a differential satellite retains its engaged tooth after a full-tooth displacement", () => {
  const satellitePivot = {
    ...pivot(4, 3), worldAxisA: [0, 1, 0], worldAxisB: [0, 1, 0],
  };
  const engine = new PhysicsEngine(scene({
    bodies: [body(1, true), body(2, true), body(3, true), body(4)],
    joints: [satellitePivot],
    differentials: [{ ...differential, satellites: [{
      body: 4, sideBody: 1, axis: [0, 1, 0], sideAxis: [0, 0, 1],
      center: [8, 3, 0], sideCenter: [2, 3, 0],
      reference: [1, 0, 0], sideReference: [1, 0, 0],
      coefficient: 12, sideCoefficient: 12, phaseLock: true,
    }] }],
  }));
  try {
    let state;
    for (let frame = 0; frame < 90; frame++) state = engine.step(1 / 60, []);
    const angle = 2 * Math.atan2(state[50], state[52]);
    const displaced = angle + Math.PI / 6;
    engine.step(1 / 60, [{ kind: "setRotation", body: 4,
      rotation: [0, Math.sin(displaced / 2), 0, Math.cos(displaced / 2)] }]);
    for (let frame = 0; frame < 180; frame++) state = engine.step(1 / 60, []);
    const finalAngle = 2 * Math.atan2(state[50], state[52]);
    close(finalAngle, angle, "satellite must return to the original tooth", 0.01);
  } finally { engine.free(); }
});

test("a motor applies finite torque and responds to changed commands", () => {
  const engine = new PhysicsEngine(scene({
    bodies: [body(1), body(2), body(10, true)],
    joints: [{ ...pivot(1, 10, "motor"), motorForce: 0.02, motorSpeed: 1000 }, pivot(2)],
    gears: [gear(1, 2, 0.5)], differentials: [],
  }));
  try {
    let state = engine.step(1 / 60, []);
    // I_input + ratio^2 * I_output = 5/3 for these two unit cubes.
    close(state[13], 0.02 / 60 / (5 / 3), "torque cap includes reflected output inertia", 1e-5);
    close(state[28], -2 * state[13], "output speed ratio", 1e-5);
    engine.step(1 / 60, [{ kind: "setMotor", joint: "pivot-1", speed: -1000, force: 0.02 }]);
    for (let frame = 0; frame < 10; frame++) state = engine.step(1 / 60, []);
    assert.ok(state[13] < 0 && state[28] > 0, "updated motor command must reverse the drivetrain");
  } finally { engine.free(); }
});

test("a remote blocked shaft stops a powered train without cumulative tooth slip", () => {
  const count = 12;
  const engine = new PhysicsEngine(scene({
    bodies: [...Array.from({ length: count }, (_, i) => body(i + 1, i === count - 1)), body(100, true)],
    joints: Array.from({ length: count - 1 }, (_, i) => ({
      ...pivot(i + 1, 100, i === 0 ? "motor" : "rotation"), motorForce: 10_000,
    })),
    gears: Array.from({ length: count - 1 }, (_, i) => gear(i + 1, i + 2, 1, true)),
    differentials: [],
  }));
  try {
    let state;
    for (let frame = 0; frame < 90; frame++) state = engine.step(1 / 60, []);
    let previous = 2 * Math.atan2(state[6], state[7]);
    let travel = 0;
    for (let frame = 0; frame < 120; frame++) {
      state = engine.step(1 / 60, []);
      const angle = 2 * Math.atan2(state[6], state[7]);
      travel += Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
      previous = angle;
    }
    assert.ok(Math.abs(travel) < Math.PI / 16, `remote blockage allowed tooth slip: ${travel}`);
    close(state[13], 0, "remote blockage must reach the motor", 0.02);
  } finally { engine.free(); }
});
