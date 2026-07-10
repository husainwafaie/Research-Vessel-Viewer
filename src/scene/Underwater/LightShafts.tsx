import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

/**
 * LightShafts — volumetric god-ray columns descending from the water surface.
 *
 * Each shaft is a long CylinderGeometry with an AdditiveBlending material
 * so it only brightens whatever geometry is behind it.  Eight shafts are
 * spread around the vessel at different radii and angles, each with its own
 * pulse frequency and phase offset to break up synchrony.
 *
 * The top of each cylinder sits at y = 0 (water surface); the cylinder
 * extends downward 60 units.  A vertex-shader fade makes the bottom of each
 * shaft fully transparent so there is no hard cutoff edge.
 */

const SHAFT_VERT = /* glsl */ `
  varying float vFade;
  varying vec3  vNormalW;
  varying vec3  vViewDirW;
  void main() {
    // position.y in local space goes from +0.5 (top) to -0.5 (bottom).
    // We want: top (y = 0.5 in model) = opaque, bottom = transparent.
    vFade = clamp(position.y + 0.5, 0.0, 1.0);
    vNormalW  = normalize(mat3(modelMatrix) * normal);
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vViewDirW = normalize(cameraPosition - worldPos);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHAFT_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3  uColor;
  varying float vFade;
  varying vec3  vNormalW;
  varying vec3  vViewDirW;
  void main() {
    // Volumetric read: a view ray through the middle of the shaft crosses
    // the most water (surface normal faces the camera there), a ray at the
    // silhouette edge crosses none (normal ⊥ view) — so |n·v| approximates
    // path length and gives the soft centre-bright falloff of a real ray.
    float thickness = abs(dot(normalize(vNormalW), normalize(vViewDirW)));
    gl_FragColor = vec4(uColor, uOpacity * vFade * thickness);
  }
`;

interface ShaftConfig {
  x: number;
  z: number;
  radius: number;
  height: number;
  tiltX: number;
  tiltZ: number;
  pulseSpeed: number;
  pulsePhase: number;
  baseOpacity: number;
}

const SHAFTS: ShaftConfig[] = [
  { x:  12, z:  20, radius: 1.8, height: 55, tiltX:  0.08, tiltZ:  0.05, pulseSpeed: 0.7, pulsePhase: 0.0, baseOpacity: 0.055 },
  { x: -10, z:  35, radius: 2.4, height: 60, tiltX: -0.06, tiltZ:  0.09, pulseSpeed: 0.5, pulsePhase: 1.2, baseOpacity: 0.045 },
  { x:  30, z:   5, radius: 1.4, height: 48, tiltX:  0.10, tiltZ: -0.04, pulseSpeed: 0.9, pulsePhase: 2.4, baseOpacity: 0.060 },
  { x: -20, z: -15, radius: 2.0, height: 58, tiltX: -0.07, tiltZ: -0.08, pulseSpeed: 0.6, pulsePhase: 0.8, baseOpacity: 0.050 },
  { x:   5, z: -30, radius: 1.6, height: 52, tiltX:  0.05, tiltZ:  0.11, pulseSpeed: 0.8, pulsePhase: 3.1, baseOpacity: 0.048 },
  { x:  22, z: -22, radius: 2.2, height: 62, tiltX: -0.09, tiltZ:  0.06, pulseSpeed: 0.4, pulsePhase: 1.8, baseOpacity: 0.042 },
  { x: -30, z:  18, radius: 1.2, height: 45, tiltX:  0.06, tiltZ: -0.10, pulseSpeed: 1.1, pulsePhase: 2.9, baseOpacity: 0.062 },
  { x:  -5, z:  50, radius: 2.6, height: 65, tiltX: -0.04, tiltZ:  0.07, pulseSpeed: 0.6, pulsePhase: 0.4, baseOpacity: 0.038 },
];

function Shaft({ cfg }: { cfg: ShaftConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   SHAFT_VERT,
        fragmentShader: SHAFT_FRAG,
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        side:        THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: cfg.baseOpacity },
          uColor:   { value: new THREE.Color('#88d8ff') },
        },
      }),
    [cfg.baseOpacity],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * cfg.pulseSpeed + cfg.pulsePhase);
    // ×1.6 compensates the energy the centre-bright falloff removes
    material.uniforms.uOpacity.value = cfg.baseOpacity * 1.6 * (0.6 + 0.4 * pulse);

    // Slow sway — surface waves steer the refracted column over time
    const mesh = meshRef.current;
    if (mesh) {
      mesh.rotation.x = cfg.tiltX + Math.sin(t * 0.10 + cfg.pulsePhase) * 0.025;
      mesh.rotation.z = cfg.tiltZ + Math.cos(t * 0.08 + cfg.pulsePhase * 1.7) * 0.025;
    }
  });

  // Cylinder top sits at y=0 (surface); centre is half-height below
  const centerY = -(cfg.height / 2);

  return (
    <mesh
      ref={meshRef}
      position={[cfg.x, centerY, cfg.z]}
      rotation={[cfg.tiltX, 0, cfg.tiltZ]}
      material={material}
    >
      {/* args: [radiusTop, radiusBottom, height, radialSegments] —
          12 segments keep the centre-bright thickness gradient smooth */}
      <cylinderGeometry args={[cfg.radius * 0.4, cfg.radius, cfg.height, 12, 1, true]} />
    </mesh>
  );
}

export function LightShafts() {
  const isUnderwater = useSceneStore((s) => s.isSubmerged);
  if (!isUnderwater) return null;

  return (
    <>
      {SHAFTS.map((cfg, i) => (
        <Shaft key={i} cfg={cfg} />
      ))}
    </>
  );
}
