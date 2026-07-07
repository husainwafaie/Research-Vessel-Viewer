import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

/**
 * CameraDrift — gentle buoyancy sway on the camera while underwater.
 *
 * Three incommensurate sine pairs per axis produce a slow, never-repeating
 * drift (±~0.15 units) that reads as the water column pushing the viewer
 * around. Amplitude eases in underwater and out at the surface, and is
 * gated off entirely during camera transitions so it can never fight the
 * CameraController lerp.
 *
 * Interplay with OrbitControls (the subtle part): the controls recompute
 * the camera position from their internal spherical state every update, so
 * a naive per-frame offset would be absorbed into the orbit and accumulate.
 * Drei's OrbitControls update at useFrame priority −1; we therefore:
 *   priority −2 — REMOVE last frame's offset (controls see a clean camera)
 *   priority  0 — compute and ADD the new offset (after controls have run)
 * The offset is thus purely cosmetic and never enters the orbit state.
 */

const DRIFT_AMP = 0.15;   // world units of sway at full strength
const EASE_SPEED = 1.5;   // amplitude ease in/out (per second)

export function CameraDrift() {
  const offset = useRef(new THREE.Vector3());
  const strength = useRef(0);

  // Pre-controls: restore the un-drifted camera position
  useFrame(({ camera }) => {
    camera.position.sub(offset.current);
  }, -2);

  // Post-controls: ease strength toward its target and apply fresh drift
  useFrame(({ camera, clock }, delta) => {
    const { cameraMode, isTransitioning } = useSceneStore.getState();
    const target = cameraMode === 'underwater' && !isTransitioning ? 1 : 0;
    strength.current +=
      (target - strength.current) * Math.min(1, EASE_SPEED * delta);

    const t = clock.getElapsedTime();
    const a = DRIFT_AMP * strength.current;
    offset.current.set(
      (Math.sin(t * 0.31) + 0.5 * Math.sin(t * 0.73 + 1.3)) * a,
      (Math.sin(t * 0.42 + 0.7) + 0.5 * Math.sin(t * 0.90 + 2.1)) * a * 0.8,
      (Math.cos(t * 0.27 + 1.9) + 0.5 * Math.cos(t * 0.63)) * a,
    );
    camera.position.add(offset.current);
  }, 0);

  return null;
}
