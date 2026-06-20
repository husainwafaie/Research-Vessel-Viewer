import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import { Ocean, VesselSky, Lighting, Atmosphere } from './Environment';
import { CameraController } from './Camera/CameraController';
import { VesselPlaceholder } from './Vessel/VesselPlaceholder';
import { vessel } from '@data/vessel';

const defaultCam = vessel.defaultCamera;

/**
 * Scene — root R3F Canvas composition.
 *
 * Responsibilities:
 *   - Configure the WebGL renderer (tone mapping, shadows, DPR)
 *   - Compose environment layers (atmosphere → sky → lighting → ocean)
 *   - Mount the vessel representation (placeholder → real model in 1.4)
 *   - Own post-processing passes
 *   - The Canvas is pointer-events:none where the UI layer sits on top
 *
 * The Canvas itself has no business logic. It only renders what the
 * store tells it to.
 */
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: defaultCam.position,
        fov: defaultCam.fov ?? 50,
        near: 0.5,
        far: 6000,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.5,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      // Canvas fills its parent — App.tsx controls sizing
      style={{ width: '100%', height: '100%' }}
    >
      {/* ── Atmosphere must be first — sets fog and background color ── */}
      <Atmosphere />

      {/*
       * Environment loads async (water texture via Suspense).
       * null fallback keeps the background color visible while loading.
       */}
      <Suspense fallback={null}>
        <VesselSky />
        <Lighting />
        <Ocean />
        <VesselPlaceholder />
      </Suspense>

      {/* Camera controller is not inside Suspense — should always be active */}
      <CameraController />

      {/*
       * Post-processing — minimal pass stack for Phase 1.
       *
       * Bloom settings:
       *   luminanceThreshold 0.85 — only bloom the brightest highlights
       *     (sun glint on water, vessel lights in later phases)
       *   intensity 0.4 — subtle; this is scientific realism, not sci-fi
       *
       * Avoid SSAO, SSR, DOF for now — they each cost ~2-4ms per frame.
       * Add selectively in Phase 2 when interior scenes warrant it.
       */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.85}
          luminanceSmoothing={0.9}
          intensity={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
