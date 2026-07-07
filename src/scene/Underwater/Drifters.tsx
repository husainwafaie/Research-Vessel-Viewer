import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

const COUNT = 220;
// Spawn envelope around the camera in world units
const SPREAD_XZ = 70;
const SPREAD_Y = 40;
// Drifters exist only in the deep band (world y); ~9 ≈ 25 display metres
const BAND_TOP = -9;
const BAND_BOTTOM = -50;

/**
 * Drifters — bioluminescent plankton visible at depth.
 *
 * 220 additive glow sprites drift slowly through the deep water column,
 * each pulsing on its own phase with a slow-charge / sharp-peak curve.
 * Peak luminance (~1.7) deliberately clears the underwater Bloom threshold
 * (0.50, see PostProcessing.tsx) so the brightest moments halo softly.
 * ~10% of particles are much larger, reading as distant jelly-like blobs.
 *
 * Two fades keep them depth-honest:
 *   - uDepthFade: global fade-in as the CAMERA sinks past ~20–35 display
 *     metres (read imperatively from the store, like Atmosphere)
 *   - per-particle world-y fade so stragglers near the band top never
 *     glow at shallow depths
 *
 * CPU movement mirrors MarineSnow: positions mutated in-place each frame,
 * respawning near the camera when they stray too far.
 */

const DRIFTER_VERT = /* glsl */ `
  uniform float uPixelScale;
  attribute float aPhase;
  attribute float aSize;
  attribute float aMix;
  varying float vPhase;
  varying float vMix;
  varying float vWorldY;

  void main() {
    vPhase = aPhase;
    vMix = aMix;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldY = world.y;
    vec4 mv = viewMatrix * world;
    // Manual size attenuation — same falloff pointsMaterial uses
    gl_PointSize = aSize * uPixelScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const DRIFTER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uDepthFade;
  varying float vPhase;
  varying float vMix;
  varying float vWorldY;

  void main() {
    // Soft circular sprite
    float r = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.1, r);

    // Slow charge, sharp peak — cubed sine reads as a "blink" of light
    float pulse = pow(0.5 + 0.5 * sin(uTime * 0.7 + vPhase), 3.0);

    vec3 colA = vec3(0.302, 1.0, 0.824); // #4dffd2 cyan-green
    vec3 colB = vec3(0.4, 0.667, 1.0);   // #66aaff blue
    vec3 col = mix(colA, colB, vMix) * (0.3 + 1.4 * pulse);

    // Fade out any particle drifting above the deep band
    float yFade = 1.0 - smoothstep(-14.0, -9.0, vWorldY);

    gl_FragColor = vec4(col, alpha * uDepthFade * yFade);
  }
`;

function smoothstepJs(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function Drifters() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  const pointsRef = useRef<THREE.Points>(null);

  // Per-particle buffers: position + phase/size/colour-mix attributes,
  // plus CPU-side drift velocities
  const { positions, phases, sizes, mixes, velY, wobblePhase } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const mixes = new Float32Array(COUNT);
    const velY = new Float32Array(COUNT);
    const wobblePhase = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD_XZ;
      positions[i * 3 + 1] =
        BAND_TOP - Math.random() * (BAND_TOP - BAND_BOTTOM);
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_XZ;
      phases[i] = Math.random() * Math.PI * 2;
      // ~10% oversized "jelly" blobs, the rest small plankton motes
      sizes[i] = Math.random() < 0.1
        ? 0.8 + Math.random() * 0.5
        : 0.15 + Math.random() * 0.3;
      mixes[i] = Math.random();
      velY[i] = (Math.random() - 0.5) * 0.2; // gentle rise or sink
      wobblePhase[i] = Math.random() * Math.PI * 2;
    }

    return { positions, phases, sizes, mixes, velY, wobblePhase };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepthFade: { value: 0 },
      uPixelScale: { value: 600 },
    }),
    [],
  );

  useFrame(({ clock, camera, size }, delta) => {
    if (!pointsRef.current) return;

    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    // Fade in as the camera sinks past ~20–35 display metres
    // (imperative read — same pattern as Atmosphere, no subscription)
    const depth = useSceneStore.getState().cameraDepth;
    uniforms.uDepthFade.value = smoothstepJs(20, 35, depth);

    // Point size in pixels for a unit world size at 1 unit distance
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
    uniforms.uPixelScale.value =
      size.height / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));

    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const cam = camera.position;

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;

      // Slow vertical drift + micro-current wobble
      arr[idx + 1] += velY[i] * delta;
      arr[idx] += Math.sin(t * 0.15 + wobblePhase[i]) * 0.006;
      arr[idx + 2] += Math.cos(t * 0.12 + wobblePhase[i]) * 0.006;

      // Respawn near the camera when a particle leaves the envelope or
      // the deep band — keeps the cloud centred on the viewer
      const dx = arr[idx] - cam.x;
      const dz = arr[idx + 2] - cam.z;
      const y = arr[idx + 1];
      if (dx * dx + dz * dz > 45 * 45 || y > BAND_TOP || y < BAND_BOTTOM) {
        arr[idx] = cam.x + (Math.random() - 0.5) * SPREAD_XZ;
        arr[idx + 1] = Math.min(
          BAND_TOP,
          Math.max(BAND_BOTTOM, cam.y + (Math.random() - 0.5) * SPREAD_Y),
        );
        arr[idx + 2] = cam.z + (Math.random() - 0.5) * SPREAD_XZ;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isUnderwater) return null;

  return (
    // Positions recentre around the camera over time, so the static
    // bounding sphere would mis-cull — disable frustum culling
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        {/* args=[array, itemSize] — constructor pattern (see MarineSnow) */}
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aMix" args={[mixes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={DRIFTER_VERT}
        fragmentShader={DRIFTER_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
