import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import { Ocean, VesselSky, Lighting, Atmosphere } from './Environment';
import { CameraController } from './Camera/CameraController';
import { VesselPlaceholder } from './Vessel/VesselPlaceholder';
import { ComponentHotspots } from './Vessel/ComponentHotspots';
import { TourDriver } from './Tour/TourDriver';
import { vessel } from '@data/vessel';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';

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
  const clearSelection = useSceneStore((s) => s.clearSelection);
  const resetCamera    = useSceneStore((s) => s.resetCamera);
  const closePanel     = useUIStore((s) => s.closePanel);

  function handlePointerMissed() {
    clearSelection();
    closePanel();
    resetCamera(vessel.defaultCamera);
  }

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
        toneMappingExposure: 0.75,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      // Clicking empty space (ocean/sky) deselects the active component
      onPointerMissed={handlePointerMissed}
      style={{ width: '100%', height: '100%' }}
    >
      {/* ── Atmosphere sets fog and background color first ── */}
      <Atmosphere />

      <Suspense fallback={null}>
        <VesselSky />
        <Lighting />
        <Ocean />
        <VesselPlaceholder />
        {/* Interactive hotspots for each vessel component */}
        <ComponentHotspots />
      </Suspense>

      {/* Camera controller always active, not behind Suspense */}
      <CameraController />

      {/* Tour driver — listens to tour store, focuses camera, auto-advances */}
      <TourDriver />

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
