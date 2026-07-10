import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';
import { TERRAIN_GLSL } from './seafloorHeight';

/**
 * Seafloor — a procedurally shaded and displaced ocean bottom.
 *
 * Base plane at y = −55 (≈ 154 m display depth at DEPTH_SCALE=2.8), below
 * the vessel's keel (y ≈ −3).  The vertex shader raises a static dune field
 * from the shared terrainHeight() definition (seafloorHeight.ts — the same
 * formula SeafloorScatter uses in JS to seat rocks on the surface), and the
 * fragment shader darkens valleys for cheap relief shading.
 *
 * The sandy ripple pattern is two-octave value noise with a slow scroll to
 * mimic current-driven sediment movement.  No external texture is required —
 * everything is procedural.
 */

const FLOOR_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vHeight;

  ${TERRAIN_GLSL}

  void main() {
    vUv = uv;
    // Static dune displacement along local +Z (world +Y after the −90°
    // X-rotation), evaluated on the pre-displacement world XZ position
    vec4 flat_ = modelMatrix * vec4(position, 1.0);
    float h = terrainHeight(flat_.xz);
    vHeight = h;
    vec4 worldPos = modelMatrix * vec4(position + vec3(0.0, 0.0, h), 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FLOOR_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2  vUv;
  varying vec3  vWorldPos;
  varying float vHeight;

  // Shared value-noise implementation (terrainHash/terrainNoise) — the same
  // functions the vertex shader uses for displacement
  ${TERRAIN_GLSL}

  void main() {
    // Slowly scrolling UV — simulates current-driven sediment movement
    vec2 scroll = vUv * 18.0 + vec2(uTime * 0.012, uTime * 0.008);

    // Two octaves of noise — coarse ripples + fine sand grain
    float n = terrainNoise(scroll) * 0.65
            + terrainNoise(scroll * 2.8 + vec2(5.2, 1.3)) * 0.35;

    // Sandy colour range: dark grey-green to warm tan
    vec3 sand0 = vec3(0.06, 0.10, 0.10); // deep shadow
    vec3 sand1 = vec3(0.18, 0.22, 0.17); // mid sand
    vec3 col = mix(sand0, sand1, n);

    // Very slight iridescent tint where noise peaks — bioluminescence hint
    col += vec3(0.0, n * n * 0.06, n * n * 0.12);

    // Relief shading: valleys darker, dune crests brighter
    col *= 0.55 + 0.45 * clamp(vHeight / 6.0, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Seafloor() {
  const isUnderwater = useSceneStore((s) => s.isSubmerged);
  const quality = useUIStore((s) => s.quality);
  const meshRef = useRef<THREE.Mesh>(null);

  // 256² cells (~7.8 units) resolve the finest terrain octave; low quality
  // halves tessellation, softening dune detail slightly
  const segments = quality === 'low' ? 128 : 256;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   FLOOR_VERT,
        fragmentShader: FLOOR_FRAG,
        uniforms: {
          uTime: { value: 0 },
        },
      }),
    [],
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  if (!isUnderwater) return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, -55, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      {/* 2000×2000 units — fog hides edges well before they would clip */}
      <planeGeometry args={[2000, 2000, segments, segments]} />
    </mesh>
  );
}
