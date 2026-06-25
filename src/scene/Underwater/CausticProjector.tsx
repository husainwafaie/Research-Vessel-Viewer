import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

/**
 * CausticProjector — simulates sunlight refracted through the water surface
 * projecting animated caustic patterns onto the vessel hull and seafloor.
 *
 * Implementation:
 *   A large horizontal plane positioned just below the water surface (y = −1)
 *   faces downward with an AdditiveBlending ShaderMaterial.  The shader
 *   generates two overlapping interference patterns (scrolling at different
 *   speeds and angles) that together produce the characteristic web-like
 *   caustic light shapes.  Additive blending means the pattern only brightens
 *   surfaces underneath it — dark gaps between caustic webs don't darken
 *   anything, matching real caustic behaviour.
 *
 *   Two separate planes at slightly different heights and with different
 *   scale/speed parameters give depth and avoid the effect looking like a
 *   simple texture repeat.
 */

const CAUSTIC_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CAUSTIC_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform vec3  uColor;
  varying vec2  vUv;

  // Simple hash for the interference pattern
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Two-layer scrolling interference that produces caustic-like webs
  float caustic(vec2 uv, float t) {
    vec2 p1 = uv * uScale + vec2( t * uSpeed,  t * uSpeed * 0.7);
    vec2 p2 = uv * uScale + vec2(-t * uSpeed * 0.8, t * uSpeed * 0.5);

    // Layer 1 — diagonal wave
    float c1 = abs(sin(p1.x * 6.28 + sin(p1.y * 4.0 + t * 0.5)));
    // Layer 2 — offset diagonal wave at different angle
    float c2 = abs(sin(p2.y * 6.28 + sin(p2.x * 3.5 - t * 0.4)));

    // Intersection of the two patterns produces the web-like caustic shape
    return pow(c1 * c2, 2.5);
  }

  void main() {
    // Edge fade so the finite plane blends with surrounding fog
    float ex = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float ey = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    float edge = ex * ey;

    float c = caustic(vUv, uTime);
    gl_FragColor = vec4(uColor * c * uIntensity * edge, c * uIntensity * edge);
  }
`;

function CausticPlane({
  y,
  scale,
  speed,
  intensity,
  size,
}: {
  y: number;
  scale: number;
  speed: number;
  intensity: number;
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   CAUSTIC_VERT,
        fragmentShader: CAUSTIC_FRAG,
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        side:        THREE.FrontSide,
        uniforms: {
          uTime:      { value: 0 },
          uScale:     { value: scale },
          uSpeed:     { value: speed },
          uIntensity: { value: intensity },
          uColor:     { value: new THREE.Color('#60d8ff') },
        },
      }),
    [scale, speed, intensity],
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      <planeGeometry args={[size, size, 1, 1]} />
    </mesh>
  );
}

export function CausticProjector() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  if (!isUnderwater) return null;

  return (
    <>
      {/* Primary caustic layer — large, slow, bright */}
      <CausticPlane y={-1.0} scale={1.8} speed={0.06} intensity={0.28} size={300} />
      {/* Secondary layer — tighter pattern, faster, dimmer — adds detail */}
      <CausticPlane y={-2.5} scale={3.2} speed={0.10} intensity={0.16} size={300} />
    </>
  );
}
