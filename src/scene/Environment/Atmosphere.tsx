import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

// ── Surface colours ───────────────────────────────────────────────────────────
const SURFACE_BG      = new THREE.Color('#020c1b');
const SURFACE_FOG     = new THREE.Color('#0a1828');
const SURFACE_DENSITY = 0.0007;

// ── Underwater colour gradient — shallow → deep ───────────────────────────────
// Shallow (just below surface, depth ≈ 0–20 m display)
const SHALLOW_BG      = new THREE.Color('#000f1f');
const SHALLOW_FOG     = new THREE.Color('#011828');
const SHALLOW_DENSITY = 0.022;

// Deep (maximum depth, depth ≈ 60 m display)
const DEEP_BG         = new THREE.Color('#000208');
const DEEP_FOG        = new THREE.Color('#000510');
const DEEP_DENSITY    = 0.048;

// Max display depth at which colour is fully "deep"
const MAX_DEPTH = 60;

// Lerp speed for smooth transition — higher = snappier surface/underwater swap
const LERP_SPEED = 3.0;

/**
 * Atmosphere — imperative fog and background controller with depth-based
 * colour shift underwater.
 *
 * Surface: static midnight-blue fog and background (set via useEffect).
 *
 * Underwater: useFrame reads cameraDepth from the store each frame (no
 * re-render subscription needed) and lerps fog colour, density, and
 * background between:
 *   shallow (depth 0)  — dark blue-green, moderate density
 *   deep    (depth 60) — near-black with faint teal tint, dense fog
 *
 * The lerp uses a smooth step on normalised depth, so colour darkens
 * rapidly at first then asymptotes toward true black at depth.
 * LERP_SPEED smooths the transition when surfacing or diving quickly.
 */
export function Atmosphere() {
  const { scene } = useThree();
  const isUnderwater = useSceneStore((s) => s.isSubmerged);

  // Working colour objects — mutated each frame to avoid GC pressure
  const workBg  = useRef(new THREE.Color());
  const workFog = useRef(new THREE.Color());

  // Initialise fog once on mount
  useEffect(() => {
    scene.fog        = new THREE.FogExp2(SURFACE_FOG.getHex(), SURFACE_DENSITY);
    scene.background = SURFACE_BG.clone();
  }, [scene]);

  // Snap back to surface values immediately when surfacing
  useEffect(() => {
    if (!isUnderwater) {
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(SURFACE_FOG);
        scene.fog.density = SURFACE_DENSITY;
      }
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(SURFACE_BG);
      }
    }
  }, [isUnderwater, scene]);

  // Per-frame depth-based colour interpolation (underwater only)
  useFrame((_, delta) => {
    if (!(scene.fog instanceof THREE.FogExp2)) return;
    if (!(scene.background instanceof THREE.Color)) return;

    const { isSubmerged, cameraDepth } = useSceneStore.getState();
    if (!isSubmerged) return;

    // Normalised depth 0–1 with smooth-step so darkening is fastest near
    // the surface where the colour change is most perceptible
    const t = THREE.MathUtils.smoothstep(cameraDepth / MAX_DEPTH, 0, 1);

    // Target colours this frame
    workFog.current.lerpColors(SHALLOW_FOG, DEEP_FOG, t);
    workBg.current.lerpColors(SHALLOW_BG, DEEP_BG, t);
    const targetDensity = THREE.MathUtils.lerp(SHALLOW_DENSITY, DEEP_DENSITY, t);

    // Smooth lerp toward target (avoids instant pop when depth changes fast)
    const k = Math.min(1, LERP_SPEED * delta);
    scene.fog.color.lerp(workFog.current, k);
    scene.fog.density += (targetDensity - scene.fog.density) * k;
    scene.background.lerp(workBg.current, k);
  });

  return null;
}
