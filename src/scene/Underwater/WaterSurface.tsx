import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

/**
 * WaterSurface — a shimmering semi-transparent plane rendered at y = -0.2,
 * visible only from below (THREE.BackSide), simulating the underside of the
 * ocean surface when the camera is submerged.
 *
 * The shimmer is driven by a simple animated UV offset on the opacity
 * texture — we achieve this cheaply with a ShaderMaterial that shifts
 * a sine-wave distortion over time, giving the refractive ripple look
 * of sunlight breaking through water.
 *
 * Only mounted in underwater mode.
 */
export function WaterSurface() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime:    { value: 0 },
          uColor:   { value: new THREE.Color('#0a3a5c') },
          uOpacity: { value: 0.55 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3  uColor;
          uniform float uOpacity;
          varying vec2  vUv;

          void main() {
            // Two sine waves at different frequencies — produces a caustic-like
            // shimmer pattern across the surface
            float wave1 = sin(vUv.x * 18.0 + uTime * 1.1) * 0.5 + 0.5;
            float wave2 = sin(vUv.y * 14.0 + uTime * 0.8 + 1.3) * 0.5 + 0.5;
            float shimmer = wave1 * wave2;

            // Brighten the surface slightly where waves peak
            vec3 col = uColor + vec3(shimmer * 0.10, shimmer * 0.18, shimmer * 0.22);

            // Fade edges so the finite plane blends into fog rather than cutting off
            float edgeFade = smoothstep(0.0, 0.18, vUv.x)
                           * smoothstep(1.0, 0.82, vUv.x)
                           * smoothstep(0.0, 0.18, vUv.y)
                           * smoothstep(1.0, 0.82, vUv.y);

            gl_FragColor = vec4(col, uOpacity * edgeFade);
          }
        `,
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
      position={[0, -0.2, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      {/* Large enough to always cover the viewport from below */}
      <planeGeometry args={[2000, 2000, 1, 1]} />
    </mesh>
  );
}
