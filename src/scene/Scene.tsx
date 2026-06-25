import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { Ocean, VesselSky, Lighting, Atmosphere } from './Environment';
import { CameraController } from './Camera/CameraController';
import { VesselModel } from './Vessel/VesselModel';
import { ComponentHotspots } from './Vessel/ComponentHotspots';
import { MeshHighlighter } from './Vessel/MeshHighlighter';
import { VesselAnimations } from './Vessel/VesselAnimations';
import { TourDriver } from './Tour/TourDriver';
import { SceneReadyNotifier } from './SceneReadyNotifier';
import { PostProcessing } from './PostProcessing';
import { MarineSnow } from './Underwater/MarineSnow';
import { Bubbles } from './Underwater/Bubbles';
import { WaterSurface } from './Underwater/WaterSurface';
import { CausticProjector } from './Underwater/CausticProjector';
import { LightShafts } from './Underwater/LightShafts';
import { Seafloor } from './Underwater/Seafloor';
import { CameraDepthWatcher } from './Underwater/CameraDepthWatcher';
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
  const isUnderwater   = useSceneStore((s) => s.cameraMode === 'underwater');

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
      aria-label="3D interactive model of R/V Pelagic Horizon research vessel"
      style={{ width: '100%', height: '100%' }}
    >
      {/* ── Atmosphere sets fog and background color first ── */}
      <Atmosphere />

      <Suspense fallback={null}>
        {/* Sky dome hidden underwater — the camera is below the skybox sphere
            so it would render incorrectly and break the underwater look */}
        {!isUnderwater && <VesselSky />}
        <Lighting />
        <Ocean />
        <VesselModel />
        {/* Applies emissive highlight to bound meshes when a component is selected */}
        <MeshHighlighter />
        {/* Procedural always-on animations (radar rotation, etc.) */}
        <VesselAnimations />
        {/* Interactive hotspots for each vessel component */}
        {!isUnderwater && <ComponentHotspots />}
      </Suspense>

      {/* Camera controller always active, not behind Suspense */}
      <CameraController />

      {/* Tour driver — listens to tour store, focuses camera, auto-advances */}
      <TourDriver />

      {/* Bridges Three.js load progress into the UI store for LoadingScreen */}
      <SceneReadyNotifier />

      {/* ── Underwater effects (all self-gate on cameraMode) ─────────────── */}
      {/* Shimmering BackSide water-surface ceiling at y ≈ 0 */}
      <WaterSurface />
      {/* Sandy animated seafloor plane at y = −55 */}
      <Seafloor />
      {/* Additive caustic light patterns projected downward from near-surface */}
      <CausticProjector />
      {/* Volumetric god-ray light shaft columns from the surface */}
      <LightShafts />
      {/* Organic detritus drifting downward */}
      <MarineSnow />
      {/* Rising air bubbles from hull surfaces */}
      <Bubbles />

      {/* Watches camera Y each frame — auto-switches underwater/surface mode
          and keeps cameraDepth current for the DepthGauge HUD */}
      <CameraDepthWatcher />

      <PostProcessing />
    </Canvas>
  );
}
