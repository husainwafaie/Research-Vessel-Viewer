import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

// Pre-built colour/density constants — avoids allocating on every render
const SURFACE = {
  background: new THREE.Color('#020c1b'),
  fogColor:   new THREE.Color('#0a1828'),
  density:    0.0007,
} as const;

const UNDERWATER = {
  background: new THREE.Color('#000508'),
  fogColor:   new THREE.Color('#010e18'),
  density:    0.032,
} as const;

/**
 * Atmosphere — imperative fog and background color controller.
 *
 * We use useThree + useEffect rather than JSX <color> / <fogExp2> because:
 *   - R3F does NOT recreate Three.js objects when `args` changes — the
 *     constructor is only called once, so `<color args={[newColor]}>` is a
 *     no-op after mount.
 *   - scene.fog.color is a THREE.Color instance; assigning a string to it via
 *     a JSX prop silently does nothing.
 *   - Imperative `.set()` / property assignment is the only reliable path.
 *
 * Surface (default):
 *   FogExp2 density 0.0007 — moderate ocean haze, horizon visible ~1.4 km
 *   Background #020c1b — deep midnight ocean blue
 *
 * Underwater:
 *   FogExp2 density 0.032 — dense scatter, visibility ~30 m
 *   Background #000508 — near-black abyss
 */
export function Atmosphere() {
  const { scene } = useThree();
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');

  // Initialise scene fog on mount (runs once, before any mode switch)
  useEffect(() => {
    scene.fog        = new THREE.FogExp2(SURFACE.fogColor.getHex(), SURFACE.density);
    scene.background = SURFACE.background.clone();
  }, [scene]);

  // Imperatively switch fog and background whenever the camera mode changes
  useEffect(() => {
    const cfg = isUnderwater ? UNDERWATER : SURFACE;

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(cfg.fogColor);
      scene.fog.density = cfg.density;
    }
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(cfg.background);
    }
  }, [isUnderwater, scene]);

  return null;
}
