import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

/**
 * HullCaustics — refracted-sunlight shimmer on the vessel itself.
 *
 * The CausticProjector planes float in the water column but never light the
 * hull, so underwater the ship reads as an inert silhouette. This module
 * injects a world-space caustic term into every tuned hull material via
 * onBeforeCompile (the same technique as the fish tail-wag), added to
 * totalEmissiveRadiance so it rides the standard lighting/tone-mapping
 * pipeline — and gets picked up by Bloom at its peaks.
 *
 * Two masks keep it physical:
 *   - waterline fade: only surfaces below y ≈ 0 receive caustics
 *   - upness: up-facing surfaces get full intensity, vertical hull sides
 *     half, down-facing keel none
 *
 * All patched materials share ONE uniforms object; the <HullCaustics />
 * driver (always mounted, renders null) ticks uTime and lerps
 * uCausticStrength toward 1 underwater / 0 at the surface, so the shimmer
 * fades smoothly across mode changes with zero per-material bookkeeping.
 *
 * Note: MeshHighlighter swaps in plain clones while a component is selected
 * (Material.clone() does not carry onBeforeCompile) — highlighted parts
 * briefly lose the shimmer, which is invisible under the pulse highlight.
 */

const HULL_UNIFORMS = {
  uTime: { value: 0 },
  uCausticStrength: { value: 0 },
  uCausticColor: { value: new THREE.Color('#60d8ff') },
};

const STRENGTH_TARGET = 0.9; // peak emissive ≈ 1.0 → clears bloom threshold
const LERP_SPEED = 2.5;      // matches CameraController transition feel

// Vertex additions: world position + world-space normal "upness"
const CAUSTIC_VERT_DECLS = /* glsl */ `
  varying vec3 vCausticWorldPos;
  varying float vCausticUp;
`;

const CAUSTIC_VERT_BODY = /* glsl */ `
  vCausticWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vCausticUp = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz).y;
`;

// Fragment additions: two-layer interference pattern (same family as
// CausticProjector) evaluated on the world XZ plane
const CAUSTIC_FRAG_DECLS = /* glsl */ `
  uniform float uTime;
  uniform float uCausticStrength;
  uniform vec3 uCausticColor;
  varying vec3 vCausticWorldPos;
  varying float vCausticUp;

  float hullCaustic(vec2 p, float t) {
    vec2 p1 = p * 0.35 + vec2(t * 0.020, t * 0.013);
    vec2 p2 = p * 0.60 - vec2(t * 0.017, t * 0.011);
    float c1 = abs(sin(p1.x * 6.28318 + sin(p1.y * 4.0 + t * 0.5)));
    float c2 = abs(sin(p2.y * 6.28318 + sin(p2.x * 3.5 - t * 0.4)));
    return pow(c1 * c2, 2.5);
  }
`;

const CAUSTIC_FRAG_BODY = /* glsl */ `
  {
    // Up-facing = full, vertical sides = half, down-facing keel = none
    float upness = clamp(vCausticUp * 0.5 + 0.5, 0.0, 1.0);
    // Only submerged surfaces — fades out approaching the waterline
    float waterline = 1.0 - smoothstep(-2.0, 0.0, vCausticWorldPos.y);
    float c = hullCaustic(vCausticWorldPos.xz, uTime);
    totalEmissiveRadiance +=
      uCausticColor * (c * upness * waterline * uCausticStrength);
  }
`;

/**
 * Patch a hull material so submerged surfaces receive animated caustics.
 * Call once per tuned material in VesselModel.
 */
export function applyHullCaustics(material: THREE.MeshStandardMaterial): void {
  material.onBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms,
  ) => {
    // Share the SAME uniform objects across all hull materials so the
    // driver below updates every program with three writes per frame
    shader.uniforms.uTime = HULL_UNIFORMS.uTime;
    shader.uniforms.uCausticStrength = HULL_UNIFORMS.uCausticStrength;
    shader.uniforms.uCausticColor = HULL_UNIFORMS.uCausticColor;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${CAUSTIC_VERT_DECLS}`)
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>\n${CAUSTIC_VERT_BODY}`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${CAUSTIC_FRAG_DECLS}`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n${CAUSTIC_FRAG_BODY}`,
      );
  };
  // Distinct cache key so three compiles these apart from vanilla standard
  // materials (appended to the normal parameter key, so the 9 hull material
  // variants still compile independently where they differ)
  material.customProgramCacheKey = () => 'hull-caustics';
}

/**
 * Driver — always mounted (like Atmosphere): ticks the shared clock and
 * eases the global caustic strength in/out on mode changes.
 */
export function HullCaustics() {
  useFrame(({ clock }, delta) => {
    HULL_UNIFORMS.uTime.value = clock.getElapsedTime();
    const target =
      useSceneStore.getState().cameraMode === 'underwater'
        ? STRENGTH_TARGET
        : 0;
    const current = HULL_UNIFORMS.uCausticStrength.value;
    HULL_UNIFORMS.uCausticStrength.value +=
      (target - current) * Math.min(1, LERP_SPEED * delta);
  });

  return null;
}
