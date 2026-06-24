import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN_POSITION } from './sunConfig';
import { useSceneStore } from '@store/scene.store';

const SUN_LIGHT_POSITION = SUN_POSITION.clone().multiplyScalar(400);

/**
 * CausticLight — animates a point light in a slow Lissajous pattern above the
 * scene to simulate sunlight filtering through moving water surface.
 * Only rendered (and only burns GPU) in underwater mode.
 */
function CausticLight() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.getElapsedTime();
    // Slow drifting oval — mimics refracting water surface caustics
    lightRef.current.position.set(
      Math.sin(t * 0.31) * 18,
      8,
      Math.cos(t * 0.19) * 22,
    );
    // Gentle intensity pulse (0.8 – 1.6) to simulate wave brightness variation
    lightRef.current.intensity = 1.2 + Math.sin(t * 1.3) * 0.4;
  });

  return (
    <pointLight
      ref={lightRef}
      color={0x40c8ff}
      intensity={1.2}
      distance={80}
      decay={2}
    />
  );
}

/**
 * Lighting — all scene lights, reactive to camera mode.
 *
 * Surface:
 *   Hemisphere (sky/ground) + ambient fill + primary sun directional
 *   + soft fill from SW + water-bounce uplighter
 *
 * Underwater:
 *   Dim blue-green hemisphere (no sky visible) + weak ambient
 *   + CausticLight (animated point light simulating refracted sunlight)
 *   Sun and fill lights suppressed — no direct sunlight below the surface
 */
export function Lighting() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');

  return (
    <>
      {isUnderwater ? (
        /* ── Underwater ─────────────────────────────────────── */
        <>
          {/* Very dim blue-green ambient — bioluminescence + scatter */}
          <hemisphereLight args={[0x0a2a40, 0x000810, 0.6]} />
          <ambientLight intensity={0.15} color={0x0a2535} />
          {/* Animated caustic light from above */}
          <CausticLight />
        </>
      ) : (
        /* ── Surface ────────────────────────────────────────── */
        <>
          {/*
           * Hemisphere light — sky / ground ambient.
           * High intensity ensures no face of the placeholder is pitch-black.
           */}
          <hemisphereLight args={[0xb0cce0, 0x1a2e40, 2.5]} />

          {/* Ambient fill — prevents completely black shadows */}
          <ambientLight intensity={0.6} color={0x4070a0} />

          {/*
           * Primary sun — positioned NE and high (50° elevation).
           * Azimuth 45° (NE) means the default camera (also NE) looks
           * toward a front-lit vessel.
           */}
          <directionalLight
            position={[SUN_LIGHT_POSITION.x, SUN_LIGHT_POSITION.y, SUN_LIGHT_POSITION.z]}
            intensity={3.5}
            color={0xfff0c8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={1000}
            shadow-camera-left={-120}
            shadow-camera-right={120}
            shadow-camera-top={100}
            shadow-camera-bottom={-80}
            shadow-bias={-0.0005}
          />

          {/*
           * Soft fill from the opposite side (SW + low).
           * Ensures shadow faces still read as grey, not pure black.
           */}
          <directionalLight
            position={[-200, 60, -200]}
            intensity={1.2}
            color={0x6090c0}
          />

          {/* Water-bounce — cool upward fill on hull underside */}
          <directionalLight
            position={[0, -30, 0]}
            intensity={0.4}
            color={0x2060c0}
          />
        </>
      )}
    </>
  );
}
