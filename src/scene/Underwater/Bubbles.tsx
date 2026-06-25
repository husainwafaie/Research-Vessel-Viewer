import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

const COUNT = 320;
// Bubbles spawn in a tighter cluster around the hull (vessel is ~64 units long)
const SPREAD_XZ = 50;
const SPAWN_Y   = -45; // start below the keel
const SURFACE_Y =  0.5; // disappear just above the waterline

/**
 * Bubbles — rising air bubble particle system.
 *
 * Complements MarineSnow (which drifts downward) by adding upward-rising
 * bubbles around the vessel hull.  Bubbles spawn below the keel and rise at
 * variable speeds with random horizontal drift, mimicking the micro-bubbles
 * that cling to and release from submerged surfaces.
 *
 * Rendered as slightly larger, rounder points with higher opacity than
 * marine snow to read clearly against the dark background.
 */
export function Bubbles() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  const pointsRef    = useRef<THREE.Points>(null);

  const { positions, speedY, wobblePhase, wobbleRadius } = useMemo(() => {
    const positions    = new Float32Array(COUNT * 3);
    const speedY       = new Float32Array(COUNT);
    const wobblePhase  = new Float32Array(COUNT);
    const wobbleRadius = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD_XZ;
      positions[i * 3 + 1] = SPAWN_Y + Math.random() * Math.abs(SURFACE_Y - SPAWN_Y);
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_XZ;
      speedY[i]       = 1.5 + Math.random() * 4.0;  // 1.5–5.5 m/s upward
      wobblePhase[i]  = Math.random() * Math.PI * 2;
      wobbleRadius[i] = 0.01 + Math.random() * 0.03; // how much they spiral
    }

    return { positions, speedY, wobblePhase, wobbleRadius };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!pointsRef.current) return;

    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;

      // Rise upward
      arr[idx + 1] += speedY[i] * delta;

      // Helical wobble — bubbles spiral slightly as they rise
      arr[idx]     += Math.sin(t * 2.0 + wobblePhase[i]) * wobbleRadius[i];
      arr[idx + 2] += Math.cos(t * 1.8 + wobblePhase[i]) * wobbleRadius[i];

      // Wrap: respawn below the keel when bubble reaches the surface
      if (arr[idx + 1] > SURFACE_Y) {
        arr[idx]     = (Math.random() - 0.5) * SPREAD_XZ;
        arr[idx + 1] = SPAWN_Y + Math.random() * 10;
        arr[idx + 2] = (Math.random() - 0.5) * SPREAD_XZ;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isUnderwater) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        color="#c8f0ff"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
