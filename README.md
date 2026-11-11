# BrickReel — LEGO® Builder & Animator

BrickReel is a browser-based **LEGO® builder** with full **LDraw** support. Build Technic and System models from the complete LDraw parts library, snap them together with generated connection maps, group parts, animate them on a **timeline**, and export the result as a lightweight **GLB for Three.js**, an **MP4** or an animated **GIF**. Everything runs client-side — nothing to install.

> BrickReel is an independent, unofficial project. It is not sponsored, endorsed or authorized by the LEGO Group, BrickLink or Studio.

<p align="center">
  <img src="docs/images/sim-studio-interface.png" alt="BrickReel editor interface" width="800">
</p>

## Use it online

**[Open BrickReel in your browser](https://franck403.github.io/SimStudio-LEGO-Technic-Physics-Simulator/)** — no download or installation is required.

## Highlights

- **Full LDraw support** — any part number from the official library, with several mirrors as fallbacks, `Moved to` redirects, `a/b/c/c01` variants and incomplete-download detection. Search by name or look a part up directly by id.
- **Import / export** — `.ldr`, `.mpd`, BrickLink Studio `.io` and **`.stl`** (millimetres → studs) in; `.ldr`, **GLB**, **MP4**, **GIF** and portable `.simstudio` projects out.
- **Groups** — select parts and group them so they select, move and animate as one.
- **Timeline animation** — keyframes (position + rotation), easing, 360° spin helpers, pose capture with the gizmo, scrubbing and looping playback. Parts rigidly attached to a keyed part follow it.
- **Three.js export** — compact GLB with shared meshes, welded vertices, your groups as named nodes and the timeline as an animation clip, plus a copy-paste snippet and an example viewer.
- **Video / GIF export** — renders the timeline frame by frame from the current camera (MP4 needs a WebCodecs browser such as Chrome or Edge).
- **Model fixer** — repairs models from older versions: rebuilds parts with fresh connectors and ids, realigns misplaced parts onto their joints, remakes broken connections and turns old motors into animation spins. "Replace part ids" swaps parts and re-snaps.
- **Snap system** — connection maps for pins, axles, half-width holes and cross holes, plus connectors read straight from LDraw sub-part primitives so dense parts (Spike motors, hubs) snap correctly.
- **Responsive UI** — LDraw parsing and hole detection run in Web Workers; slow jobs show a blocking progress overlay.
- **Projects** — browser-local project library, crash recovery, undo/redo, light and dark themes.
- *Optional legacy physics* — the original Rapier/WebAssembly simulation is still included behind **Settings → Legacy physics simulation**.

## Quick start

1. Drag parts from the palette into the workspace, or search a part number.
2. Select two or more parts and press **Group**.
3. Open **Animate**, move or rotate the group at a point in time and press **Add key** (or use **Spin**).
4. Press play to preview, then **More → GLB · Three.js** or **More → Export video / GIF**.

Using the GLB in Three.js:

```js
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const gltf = await new GLTFLoader().loadAsync("model.glb");
scene.add(gltf.scene);
const mixer = new THREE.AnimationMixer(gltf.scene);
gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
// in your render loop: mixer.update(clock.getDelta());
```

## Offline-first part catalog

Every default-palette variant is stored in the repository:

```text
public/
├── catalog/
│   ├── geometry/       # Pre-parsed Three.js geometry for each part/color variant
│   ├── renders/        # Local palette thumbnails
│   └── manifest.json   # Metadata, connection maps, colliders and asset paths
└── ldraw/              # Original LDraw parts, subparts and primitives
```

The editor loads pre-parsed local geometry first. The original LDraw source tree is retained for attribution, reproducibility and future regeneration. Network access is only required when a user imports an external part that is not included in the default palette.

To rebuild the package after editing `app/palette.ts` or the connection algorithms:

```bash
npm run catalog:precache
```

The generator recursively downloads the required LDraw dependencies, stores the thumbnails, parses each color variant and writes the connection/collider manifest. Review generated connection maps in the editor because automatic detection can still require manual correction for irregular parts.

## Connect system

Connection maps use six visual connector types:

| Color | Connector | Compatible with |
| --- | --- | --- |
| Blue | Round socket | Orange pins and purple axles |
| Orange | Pin shaft | Blue sockets |
| Green | Cross-shaped axle socket | Purple axles |
| Purple | Usable axle path | Green and blue sockets |
| Cyan | Half-width socket | Orange pins at either half-width position |
| Pink | Half-width shaft | Cyan sockets and either half of a blue socket |

Mixed parts can contain sockets and shafts at the same time. Each shaft uses its own local position, orientation and usable length, allowing perpendicular holes on axle pins and pin connectors to participate in auto-connect.

Auto-connect aligns only the connector axes that must coincide and preserves the part's existing rotation around that axis. `Ctrl + drag` starts manual Connect: choose a connection point, drag its guide and release near a highlighted compatible point. The connection-map overlay is temporarily enabled for this operation and returns to its previous visibility state afterward.

Axles may span several rigid groups without colliding with the parts they connect. Connections can be detected, released and recovered during simulation when an axle enters or leaves a compatible socket. This dynamic behavior can be disabled per axle.

### Joint modes

Each connection is configured on the part that owns the orange or purple shaft:

| Connection | Fixed | Rotation | Linear | Rotation + linear | Motor |
| --- | :---: | :---: | :---: | :---: | :---: |
| Orange pin ↔ blue socket | ✓ | ✓ | — | — | ✓ |
| Purple axle ↔ green socket | ✓ | — | ✓ | — | — |
| Purple axle ↔ blue socket | — | ✓ | ✓ | ✓ | ✓ |

Friction pins default to rigid joints. Other multi-connection shafts intelligently keep one anchoring joint while assigning the greatest compatible freedom to their remaining joints. Cross-axle connections default to fixed.

Motor mode creates a driven rotational joint with configurable angular speed, direction and maximum torque.

### Gear coupling

Compatible gears are linked from their tooth counts, pitch radii, axis alignment and centre distance. Motion is transferred in either direction using the calculated ratio. Gear engagement is updated during simulation when height, alignment or distance changes, and a separate gear-contact collider keeps tooth interaction independent from the normal solid collider.

## Legacy physics (optional)

The simulation described below is no longer the focus of the project and is hidden by default. Enable it in **Settings → Legacy physics simulation** to get the **Simulate** button back.

### Physics architecture and colliders

The simulation core is written in Rust and compiled to WebAssembly. TypeScript
owns the editor, rendering and interaction layer, but it never receives a
Rapier body, collider or joint object. It sends plain numeric commands to one
`physics.step()` boundary and receives a packed transform buffer:

```text
TypeScript editor
└── RustPhysicsRuntime.step()
    └── Rust / WebAssembly
        ├── forces and mouse spring
        ├── motors and joint friction
        ├── gear and differential constraints
        ├── Rapier 3D step
        └── packed body transforms → TypeScript / Three.js
```

Rapier is compiled with its `simd8` feature and the WebAssembly `simd128`
target feature. Keeping ownership on the Rust side also avoids recursive
borrow/aliasing failures when a Rapier world is rebuilt.

The visible LDraw mesh remains detailed, while Rapier uses lighter compound colliders. The generated collider set is stored in the local catalog instead of being recalculated on every browser session.

- Straight beams use a longitudinal box and cylindrical end caps with a 0.45-stud radial envelope.
- L, T and angled beams use multiple aligned boxes and 0.45-radius cylinders.
- Pins and axles use simplified cylinders.
- Wheels, gears and bushes use cylindrical approximations.
- Irregular parts fall back to adjusted compound boxes/cylinders.

Fixed connections may be merged into rigid physics islands for stable large structures. Non-rigid joints remain the boundaries between those islands. Flexible mode restores per-part bodies and exposes a stiffness control for mechanisms that should bend slightly rather than behave as perfectly rigid assemblies.

During simulation, clicking a point on a part and dragging applies a visible spring force at that exact point. The force label displays newtons and the off-center application point can create torque. Stopping simulation restores all parts, connections and joint settings to their pre-simulation state.

The renderer caps presentation at 60 FPS. Dynamic resolution reduction is reserved for severe sustained drops, while instancing, cached geometry and visibility culling reduce the cost of larger models.

## Projects and automatic recovery

Click the project name in the top bar to open the project library. Named projects are stored locally in IndexedDB and remain available in that browser. The editor also maintains a separate invisible recovery document after edits, camera changes and settings changes; reopening or reloading BrickReel restores that latest working state even when it was never added to the named project list.

The custom `.simstudio` format is compressed and self-contained. It stores part transforms and colors, embedded 3D assets (including external catalog parts), connection and collider maps, exact joint endpoints and modes, gear links, camera position, snap settings, structural behavior and global physics settings. Loading it reconstructs the saved connection graph directly instead of running proximity-based auto-connect again.

Use **Export .simstudio** to keep a portable backup and **Import .simstudio** to add it to another browser. `Ctrl + S` updates an existing named project or opens the naming flow for a new one. The status dot is red while recovery is being written, yellow when the recoverable working copy is newer than the named project, and a green check when both match. BrickReel confirms before discarding unsaved changes or deleting a browser project.

Saved project names are locked against accidental typing. Use the pencil button to rename the active project, or the duplicate button to create an independently named copy. Imported `.simstudio` files always become new browser projects; they receive a new internal ID and an automatic numeric suffix when their name is already in use, so an import never overwrites an existing project.

## Controls

| Action | Control |
| --- | --- |
| Place a part | Drag it from the palette onto the workspace |
| Select | Click a placed part |
| Move on X/Z | Drag a placed part |
| Move along a free linear connection or Y | `Shift` + drag |
| Manual Connect | `Ctrl` + drag from a connection point |
| Orbit camera | Right button or `Alt` + drag |
| Pan camera | Drag with the middle mouse button |
| Focus camera on a part | Double-click the middle button over a part |
| Restore the default camera | Double-click the middle button over the floor |
| Zoom | Mouse wheel |
| Fix/release a part | `Alt` + click |
| Apply force during simulation | Drag from a point on the part |
| Rotate 90° | `WASD` or arrow keys |
| Delete selected part | `Delete` |
| Undo | `Ctrl + Z` |
| Redo | `Ctrl + Y` or `Ctrl + Shift + Z` |
| Copy selected part | `Ctrl + C` |
| Paste copied part | `Ctrl + V` |

## Installation

Node.js `22.13.0` or newer is required. The generated physics WASM is committed,
so Rust is only required when modifying the native physics core.

```bash
git clone https://github.com/franck403/SimStudio-LEGO-Technic-Physics-Simulator.git
cd SimStudio-LEGO-Technic-Physics-Simulator
npm install
npm run dev
```

Then open the local address printed by the development server. For immediate use without cloning the repository, use the [hosted GitHub Pages version](https://franck403.github.io/SimStudio-LEGO-Technic-Physics-Simulator/).

## Commands

```bash
npm run dev               # Development server
npm run build             # Production build
npm run build:pages       # GitHub Pages build
npm run physics:check     # Check the native Rust core
npm run physics:build     # Rebuild SIMD WebAssembly (Rust + wasm-bindgen required)
npm run start             # Run the production build
npm run catalog:precache  # Regenerate the offline default catalog
npm run lint              # Static analysis
npm test                  # Build and automated tests
```

## Technology

- React 19 and TypeScript.
- Three.js and LDrawLoader for 3D rendering and LDraw parsing.
- Rust, Rapier 3D and WebAssembly SIMD for rigid bodies, constraints and physics.
- Vinext and Vite for development and production builds.
- GitHub Pages-compatible static build for the default local catalog.

## Data and current limitations

- LDraw/MPD and Studio `.io` import restore part number, color, position and orientation.
- `.io` export is not currently supported.
- LDraw export creates `brickreel-model.ldr`; BrickReel-specific physics modes are not currently embedded in the exported model.
- Named projects and automatic recovery are local to the current browser unless exported as `.simstudio` files.
- Automatic connector detection is geometric and may require correction for unusual parts.
- Compound colliders are simulation approximations, not manufacturing geometry.
- Motors and large connected mechanisms remain experimental.
- The dynamic `/api/parts` search is unavailable on plain GitHub Pages; default parts remain fully available offline, while arbitrary online catalog search requires the server/Worker deployment.

## LDraw attribution and licensing

**This software uses The LDraw Parts Library.** See [LDraw.org](https://www.ldraw.org/).

The original `.dat` sources under `public/ldraw/` retain their author, history and `!LICENSE` headers. Depending on the individual file, they are licensed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), both licenses, or another license explicitly identified in that file.

The pre-parsed Three.js geometry, generated connection data and generated collider descriptions are conversions/derivative data created from those LDraw sources by BrickReel. They are distributed with attribution to **The LDraw Parts Library**, links to the applicable license terms, and an indication that conversion, scaling, coordinate transformation and physics approximation changes were made. Rendered 2D thumbnails are treated separately under the LDraw rendered-image policy.

See [LDRAW-NOTICE.md](./LDRAW-NOTICE.md) and `public/ldraw/CAreadme.txt` for the redistribution notice. The project does not add technological or legal restrictions to the packaged LDraw material beyond the terms identified by its source files.

LDraw™ is a trademark owned and licensed by the Estate of James Jessiman. LEGO® is a registered trademark of the LEGO Group, which does not sponsor, endorse or authorize this project.

This section is a practical compliance summary, not legal advice. If the distribution model changes, especially if unofficial or third-party part libraries are added, review their individual headers and licenses again.
