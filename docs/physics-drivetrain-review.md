# Drivetrain physics review

## Reproduced defects and corrections

- **Differential energy creation.** An input command selected branches that
  overwrote output/carrier velocities without applying a reaction to the input.
  With three equal inertias and an initial side speed of 6, the old result was
  approximately `(6, 0, 3)`, increasing kinetic energy by 25%. The corrected
  impulse projection gives `(5, -1, 2)`, conserving angular momentum and not
  increasing kinetic energy. The carrier-input case gives `(2, 2, 2)`.
- **Feedback constraints overwrote one another.** Separate final gear and
  differential passes returned a state that satisfied only the last system.
  Gear, differential, satellite and locked bearing velocity rows now iterate
  together, with early termination when velocities converge and a bounded
  iteration budget. Reducer and multiplier feedback tests check every relation
  and passive energy over time, including reversed gear ordering.
- **Satellite loading was one-way.** Directly setting satellite spin ignored
  its inertia and obstruction. A three-body angular impulse now reacts on the
  satellite, side gear and carrier. Locked joint rows return these reactions
  to bearing supports during the same iteration.
- **Orbital gear reactions were incomplete.** The slip calculation included
  movement of gear centres, but the correction applied axial torque only.
  Both measurement and impulse application now use the derivative of the same
  moving-centre constraint, including linear and angular reactions and the
  actual centre of mass. An unpowered moving-centre test checks kinetic energy
  and linear momentum.
- **Strong motors advanced positions before the blockage was solved.** A
  motor with a target of 6 and force limit 10000 advanced a blocked gear by
  about 57.3 radians over ten seconds despite reporting zero final speed.
  Motors now apply bounded, equal-and-opposite torque impulses before drivetrain
  projection and Rapier integration. The motor retains a speed target, finite
  torque and an implicit damping response. This changes loaded motor response
  intentionally: a prescribed target speed is not an infinite power source.
- **Tooth tracking and limiting.** Satellite phases now retain continuous angles
  and the original tooth target instead of accepting a one-tooth displacement
  as zero error. Gear and satellite angles update every substep. Speed limits
  scale translation and rotation together across connected moving members.
- **First-step inertia.** Compound mass properties are explicitly initialized
  before applying external impulses. Previously the first impulse could see
  collider inertia before the additional body mass had been incorporated.

## Validation

`npm run physics:build` rebuilds the WASM used by the application.
`npm run test:physics` includes `tests/drivetrain.test.mjs` and the existing
physics tests. Coverage includes feedback reduction/multiplication, reaction
torque, passive energy, blocked satellites, retained teeth, motor torque limits,
command reversal, a strongly powered blocked pair and a blocked twelve-gear
train. Existing tests also cover perpendicular bevel meshes, orbiting gears,
Cardan joints, angular limits, axle capture and rubber contacts.

These are numerical regression tests of constructed scenes, not certification
of every possible editor assembly or a comparison with measured LEGO hardware.

Verification on this revision: 24 drivetrain/physics tests pass, the Rust unit
test passes, the application production build succeeds, and ESLint passes on
the two changed JavaScript test files. The broader test run has two failures
in unchanged code: the topology test loader lacks its collision-primitives
dependency and the project-format fixture omits `rubberBands`. Repository-wide
lint also reports existing errors outside the changed implementation.

## Remaining fidelity limits

- `app/physics/rust-scene-builder.ts` assigns nominal piece masses (0.65, or 2
  for motors), adds collider-density mass, and uses preset damping. These are
  not a measured material/mass model. Different collider decompositions can
  change mass and inertia; exact meshes with zero density also need a separate
  inertia model. Do not interpret displayed loads as calibrated real units.
- Rapier integrates contacts and joint positional corrections separately from
  the custom drivetrain projections. Bearing velocity rows are interleaved,
  but contact forces and active joint limits are not part of a single shared
  solve with gears. Very stiff, inconsistent or poorly conditioned assemblies
  can still retain residual errors within the bounded iteration budget.
- Gear constraints are ideal bilateral rolling relations. They do not model
  material deformation, backlash, tooth strength, breakage, efficiency curves,
  or realistic tooth disengagement under excessive load. Initial phase capture
  is a numerical assembly correction and is not energy-neutral.
- `systems/stops.rs` still implements axial stops by repositioning only body B
  and cancelling its relative axial velocity. A movable host does not receive
  the corresponding impulse there. That separate system needs a bilateral
  mass-weighted reaction plus a unilateral contact/position constraint.
- Drag forces remain an interaction aid: their mass-dependent force cap and
  damping are not a calibrated actuator model. Global damping and safety speed
  limits also remove energy intentionally.

Relevant Rapier references:
[mass properties](https://rapier.rs/docs/user_guides/javascript/rigid_body_mass_properties/),
[forces and impulses](https://rapier.rs/docs/user_guides/rust/rigid_body_forces_and_impulses/),
[joint constraints](https://rapier.rs/docs/user_guides/rust/joint_constraints).
