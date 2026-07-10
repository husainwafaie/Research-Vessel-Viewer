import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';

const COUNT = 700; // halved at low render quality
// Spread radius around the camera in world units
const SPREAD_XZ = 70;
const SPREAD_Y  = 40;

/**
 * MarineSnow — drifting particle system visible in underwater mode.
 *
 * 700 tiny blue-white particles drift slowly downward, wrapping back to
 * above the camera when they fall too far below it. The effect simulates
 * marine snow: organic detritus and microorganisms sinking through the
 * water column, a defining visual of deep underwater environments.
 *
 * Implementation notes:
 *   - <points> with a BufferGeometry is much cheaper than 700 meshes
 *   - Positions are updated in-place each frame (needsUpdate = true)
 *   - Each particle has an independent drift speed (0.5–2.5 m/s) and
 *     a small horizontal wobble to break up the monotony
 *   - depthWrite=false prevents z-fighting with the vessel geometry
 *   - Only runs updateFrame / is mounted when cameraMode === 'underwater'
 */
export function MarineSnow() {
  const isUnderwater = useSceneStore((s) => s.isSubmerged);
  const quality      = useUIStore((s) => s.quality);
  const pointsRef    = useRef<THREE.Points>(null);

  const count = quality === 'low' ? COUNT / 2 : COUNT;

  // Build particle data once per quality level.
  // Velocities: y (drift), xz (wobble phase offsets)
  const { positions, speedY, wobblePhase } = useMemo(() => {
    const positions    = new Float32Array(count * 3);
    const speedY       = new Float32Array(count);
    const wobblePhase  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD_XZ;
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y - 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_XZ;
      speedY[i]      = 0.5 + Math.random() * 2.0;  // 0.5–2.5 m/s downward
      wobblePhase[i] = Math.random() * Math.PI * 2; // independent phase
    }

    return { positions, speedY, wobblePhase };
  }, [count]);

  useFrame(({ clock, camera }, delta) => {
    if (!pointsRef.current) return;

    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const t   = clock.getElapsedTime();
    const cam = camera.position;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Drift downward
      arr[idx + 1] -= speedY[i] * delta;

      // Gentle horizontal wobble — makes particles look like they drift
      // with micro-currents rather than falling perfectly straight
      arr[idx]     += Math.sin(t * 0.4 + wobblePhase[i]) * 0.004;
      arr[idx + 2] += Math.cos(t * 0.3 + wobblePhase[i]) * 0.004;

      // Wrap: if particle drifts too far below camera, respawn above it
      if (arr[idx + 1] < cam.y - SPREAD_Y * 0.6) {
        arr[idx]     = cam.x + (Math.random() - 0.5) * SPREAD_XZ;
        arr[idx + 1] = cam.y + SPREAD_Y * 0.5;
        arr[idx + 2] = cam.z + (Math.random() - 0.5) * SPREAD_XZ;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isUnderwater) return null;

  return (
    // key forces a clean remount when quality changes the buffer sizes
    <points ref={pointsRef} key={count}>
      <bufferGeometry>
        {/* args=[array, itemSize] — the correct R3F constructor pattern;
            using array/count as JSX props bypasses the constructor and
            leaves the BufferAttribute in an uninitialised state. */}
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.10}
        color="#8dd8f8"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
