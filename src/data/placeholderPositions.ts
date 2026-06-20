/**
 * placeholderPositions — camera & hotspot overrides for the box placeholder vessel.
 *
 * The camera/hotspot values in the domain data (`component.camera`) are
 * calibrated for the final GLTF model. While using the box placeholder we
 * override positions here so:
 *   1. Hotspot markers land on visible box geometry.
 *   2. Focus camera positions don't end up inside the placeholder meshes.
 *
 * This file is the single source of truth for ALL placeholder-era overrides.
 * It is imported by:
 *   - ComponentHotspots.tsx  (hotspot world positions)
 *   - useComponentFocus.ts   (camera target when focusing from the sidebar)
 *
 * DELETE or stub-out this file when the real vessel model is integrated
 * (Milestone 1.4). The system will automatically fall back to `component.camera`.
 */

import type { CameraTarget, Vector3Tuple } from '@domain/types';

export interface PlaceholderEntry {
  /** World position for the HotspotMarker sprite */
  hotspot: Vector3Tuple;
  /** Camera position/target used when this component is focused */
  camera: CameraTarget;
}

export const PLACEHOLDER_POSITIONS: Partial<Record<string, PlaceholderEntry>> = {
  // ── Navigation ────────────────────────────────────────────────────
  // Bridge — 3/4 view from forward-starboard, wide enough to show full superstructure
  bridge: {
    hotspot: [0, 16, 4],
    camera: { position: [55, 35, 55], target: [0, 12, 0], fov: 48 },
  },

  // Radar mast — elevated starboard, full mast visible
  radar_mast: {
    hotspot: [0, 29, 1],
    camera: { position: [50, 42, 40], target: [0, 20, 1], fov: 45 },
  },

  // ── Aviation ──────────────────────────────────────────────────────
  // Helipad — above and forward, helipad clearly in frame
  helipad: {
    hotspot: [0, 7, 32],
    camera: { position: [45, 35, 75], target: [0, 5, 30], fov: 50 },
  },

  // ── Launch & Recovery ─────────────────────────────────────────────
  // Crane — wide starboard view, full boom visible
  crane_main: {
    hotspot: [5, 15, -12],
    camera: { position: [55, 30, 10], target: [3, 8, -12], fov: 50 },
  },

  // A-Frame — aft view from elevated starboard
  aframe: {
    hotspot: [0, 18, -40],
    camera: { position: [45, 30, -10], target: [0, 10, -42], fov: 50 },
  },

  // ROV Bay — port side, wide view of stern quarter
  rov_bay: {
    hotspot: [-8, 7, -28],
    camera: { position: [-55, 25, -5], target: [-5, 5, -28], fov: 50 },
  },

  // ── Scientific Instruments ────────────────────────────────────────
  // Multibeam sonar — low angle from starboard, hull visible
  multibeam_sonar: {
    hotspot: [0, 1, 0],
    camera: { position: [50, 12, 40], target: [0, 0, 0], fov: 48 },
  },

  // ADCP — port side low angle
  adcp: {
    hotspot: [-7, 1, 10],
    camera: { position: [-55, 12, 30], target: [-3, 0, 10], fov: 50 },
  },

  // ── Propulsion ────────────────────────────────────────────────────
  // Main propulsion — stern view, elevated
  propulsion_main: {
    hotspot: [0, 2, -47],
    camera: { position: [30, 20, -80], target: [0, 5, -44], fov: 52 },
  },

  // Bow thruster — bow view, elevated
  thruster_bow: {
    hotspot: [0, 2, 44],
    camera: { position: [30, 20, 80], target: [0, 5, 44], fov: 52 },
  },
};
