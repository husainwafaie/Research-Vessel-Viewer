import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

/**
 * Seafloor — a procedurally shaded ocean bottom plane.
 *
 * Positioned at y = −55 (≈ 154 m depth at the DEPTH_SCALE=2.8 display
 * multiplier), below the vessel's keel (y ≈ −3), giving context and scale
 * to the underwater space.  The plane is large enough that fog obscures its
 * edges before they become visible.
 *
 * Shader produces a sandy ripple pattern using two-octave value noise with
 * a slow scroll to mimic current-driven sediment movement.  Subtle green-grey
 * tinting reflects the deep-ocean colour temperature.  No external texture
 * is required — everything is procedural.
 */

const FLOOR_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FLOOR_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2  vUv;
  varying vec3  vWorldPos;

  // Cheap 2-D value noise
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smooth
    return mix(
      mix(hash(i),          hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
      f.y
    );
  }

  void main() {
    // Slowly scrolling UV — simulates current-driven sediment movement
    vec2 scroll = vUv * 18.0 + vec2(uTime * 0.012, uTime * 0.008);

    // Two octaves of noise — coarse ripples + fine sand grain
    float n = noise(scroll) * 0.65
            + noise(scroll * 2.8 + vec2(5.2, 1.3)) * 0.35;

    // Sandy colour range: dark grey-green to warm tan
    vec3 sand0 = vec3(0.06, 0.10, 0.10); // deep shadow
    vec3 sand1 = vec3(0.18, 0.22, 0.17); // mid sand
    vec3 col = mix(sand0, sand1, n);

    // Very slight iridescent tint where noise peaks — bioluminescence hint
    col += vec3(0.0, n * n * 0.06, n * n * 0.12);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Seafloor() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  const meshRef = useRef<THREE.Mesh>(null);

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
      <planeGeometry args={[2000, 2000, 1, 1]} />
    </mesh>
  );
}
