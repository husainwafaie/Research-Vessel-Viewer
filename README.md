# R/V Pelagic Horizon — Interactive Research Vessel Explorer

[![CI](https://github.com/husainwafaie/Research-Vessel-Viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/husainwafaie/Research-Vessel-Viewer/actions/workflows/ci.yml)

An interactive 3D explorer for a 90-metre oceanographic research vessel — explore her deck systems from the surface, then dive beneath the hull into a fully procedural underwater world: fish schools, hull caustics, god rays, bioluminescent plankton, and a dune-rippled seafloor 150 metres down.

## Highlights

- **Guided tours** — a narrated surface tour of the vessel's scientific systems, and a "Beneath the Hull" dive tour that descends the full water column with depth-aware narration
- **A living ocean** — ~200 instanced fish across three species with GPU tail undulation, schools that part around the camera, plankton that only glows below 25 m, solitary groupers cruising the seafloor
- **Physically-motivated light** — animated caustics projected onto the submerged hull via shader injection, volumetric god rays with view-dependent falloff, depth-graded fog and colour absorption
- **Fully procedural** — every underwater effect (geometry, textures, audio) is generated in code; the only binary assets are the vessel model and one water normal map
- **Procedural soundscape** — pressure rumble, surge swells, and synthesized whale calls built entirely from WebAudio primitives, scaling with depth

## Architecture

```
src/
├── data/        Vessel systems, components, and tour definitions (pure data)
├── domain/      Types and selectors — the data layer's contract
├── store/       Zustand stores: scene (camera/selection), ui, tour
├── scene/       React-three-fiber scene graph
│   ├── Camera/       OrbitControls wrapper + lerp-based transitions
│   ├── Environment/  Ocean surface, sky, lighting rigs, depth-graded fog
│   ├── Underwater/   The underwater effect stack (see below)
│   ├── Vessel/       GLTF model, material tuning, hotspots, highlighting
│   └── Tour/         Tour sequencing driver
├── ui/          DOM overlay: panels, HUD, tour controls (Tailwind)
├── hooks/       Cross-cutting behaviors (focus, shortcuts, audio binding)
└── lib/         Pure utilities: math, seeded PRNG, WebAudio engine
```

### State design: mode vs. submersion

Camera behavior and underwater *visuals* are deliberately decoupled:

- `cameraMode` (`free | focused | tour | underwater`) governs **controls and UI semantics** — orbit limits, which buttons show, who owns the camera.
- `isSubmerged` is a derived flag tracking whether the camera is **physically below the waterline** (with hysteresis to prevent flicker at the boundary). Every underwater visual gates on this.

This split means a guided tour or a focused component view below the waterline renders correctly with zero special-casing — the visuals follow the camera, not the mode. A per-frame watcher maintains both from camera Y.

### The underwater stack

Each effect is a self-contained component that mounts only while submerged:

| Effect | Technique |
|---|---|
| Fish schools | 3 draw calls (one `InstancedMesh` per species). School centres follow analytic elliptical orbits; each fish adds a persistent offset + two-sine wander. Position is a **pure function of elapsed time** — O(n), no neighbour queries, no accumulated state, seamless across mount/unmount. Tail wag runs in the vertex shader via `onBeforeCompile` so fish keep scene lighting and fog. |
| Hull caustics | A world-space interference pattern injected into the vessel's PBR materials (`onBeforeCompile` → `totalEmissiveRadiance`), masked by waterline height and surface orientation, driven by one shared uniforms object across all 9 hull materials. |
| God rays | Additive cylinders with a `|n·v|` falloff approximating ray path-length — centre-bright, edge-soft — plus independent pulse and sway per shaft. |
| Seafloor | A displaced plane whose height field is defined **once** in `seafloorHeight.ts` as matching GLSL + JS implementations: the GPU displaces vertices with it while the CPU seats 140 instanced rocks on the exact same surface. A unit test guards the parity. |
| Plankton / marine snow / bubbles | CPU-mutated point clouds with camera-relative respawn; the bioluminescent drifters use a custom shader with per-particle pulse phase tuned to clear the bloom threshold at peak. |
| Camera drift | Buoyancy sway applied around OrbitControls via a two-phase frame loop (remove offset before controls update, re-apply after) so the offset never leaks into orbit state. |
| Ambience | WebAudio graph synthesized from noise buffers and oscillators — no audio files. Whale calls are built from three inharmonic partials with a scoop-then-fall pitch contour and shared vibrato. |

### Performance

- Steady **60 fps** with everything active (desktop, integrated GPU)
- Instancing keeps the fish + rocks at 4 draw calls total; schools beyond fog visibility skip their matrix updates entirely
- An **HQ/LQ toggle** (persisted) halves particle counts and seafloor tessellation for weaker hardware
- Vendor code splits into cache-stable chunks (`three`, React, R3F, postprocessing) so app deploys don't invalidate the heavy dependencies

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest — stores, terrain contract, geometry invariants
npm run lint       # ESLint (flat config)
npm run typecheck  # tsc --noEmit (strict)
npm run build      # production build (typecheck + Vite)
```

CI runs lint, typecheck, tests, and build on every push ([workflow](.github/workflows/ci.yml)).

### Testing philosophy

The suite targets the logic where regressions would be invisible until runtime: the GLSL/JS terrain parity contract, store state machines (dive transitions, tour sequencing with its dwell-timer clamp), the seeded PRNG that makes scene layout deterministic, and the fish geometry's local-space convention that the orientation math depends on (`lookAt` aims +Z — the head must be there, or every fish swims backwards).

## Credits

Vessel model: [RCRV](https://skfb.ly/6tpP9) by [Alan Dennis](https://sketchfab.com/alan.dennis), licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) — see [CREDITS.md](CREDITS.md). Everything else — terrain, fish, caustics, audio — is procedural.
