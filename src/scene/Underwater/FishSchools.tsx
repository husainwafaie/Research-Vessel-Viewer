import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { mulberry32 } from '@lib/random';
import { createFishGeometry } from './fishGeometry';

/**
 * FishSchools — instanced fish swimming around the vessel at depth bands.
 *
 * One InstancedMesh per species (single draw call each). School centres
 * follow closed elliptical orbits around the hull; each fish holds a
 * persistent offset inside its school plus a two-sine wander, so the whole
 * system is a pure function of elapsed time — O(n), no neighbour queries,
 * no persisted animation state.
 *
 * Orientation: fish geometry has its head at local +Z (see fishGeometry.ts),
 * so a scratch Object3D dummy can aim each instance with lookAt(pos + vel),
 * where vel is the analytic derivative of the orbit + wander — smooth and
 * jitter-free without any slerp.
 *
 * Hull avoidance is by construction: orbit semi-axes minus school radius and
 * wander always clear the keep-out box |x| < 12, |z| < 38, y > −7 around the
 * hull (keel y ≈ −2.94), with a per-frame centre clamp as belt-and-braces.
 *
 * Tail undulation runs on the GPU: MeshStandardMaterial is patched via
 * onBeforeCompile (rather than a raw ShaderMaterial) so fish keep scene
 * lighting AND the FogExp2 that Atmosphere maintains — a bare ShaderMaterial
 * would pop through the underwater fog. Each instance carries an aPhase
 * attribute so tails never wag in sync.
 */

// Injected after <common>: uniforms + per-instance wag phase
const FISH_VERT_DECLS = /* glsl */ `
  uniform float uTime;
  uniform float uTailFreq;
  uniform float uWagAmp;
  attribute float aPhase;
`;

// Injected after <begin_vertex> ("transformed" now exists). Local z runs
// tail (−0.7 incl. fin) → head (+0.5); the wag weight ramps up toward the
// tail and the position.z term turns the sine into a travelling body wave.
const FISH_VERT_WAG = /* glsl */ `
  float tailWeight = 1.0 - smoothstep(-0.5, 0.35, position.z);
  transformed.x += sin(uTime * uTailFreq + aPhase + position.z * 4.0)
                   * uWagAmp * tailWeight;
`;

const WAG_AMP = 0.07; // lateral tail sweep at unit body length

// Camera avoidance: fish within this radius of the viewer are displaced
// radially outward, so pushing into a school parts it around the camera
const SCATTER_RADIUS = 8;
const SCATTER_STRENGTH = 5;

interface SpeciesConfig {
  name: string;
  schoolCount: number;
  fishPerSchool: number;
  /** min/max body length — applied as per-instance uniform scale */
  bodyLength: [number, number];
  /** body height at unit length */
  bodyAspect: number;
  color: string;
  /** per-fish random lightness jitter (0–1) */
  tintJitter: number;
  /** vertical band for school orbit centres (world y, min/max) */
  yBand: [number, number];
  /** orbit semi-axis ranges (world units) */
  orbitX: [number, number];
  orbitZ: [number, number];
  /** seconds per orbit lap (min/max) */
  orbitPeriod: [number, number];
  /** fish offset envelope around the school centre (min/max) */
  schoolRadius: [number, number];
  /** two-sine wander amplitude per fish */
  wanderAmp: number;
  /** tail undulation frequency (Hz) — used by the vertex-shader wag */
  tailFreq: number;
}

const SPECIES: SpeciesConfig[] = [
  {
    name: 'silverside',
    schoolCount: 3,
    fishPerSchool: 50,
    bodyLength: [0.8, 1.3],
    bodyAspect: 0.28,
    color: '#b8ccd8',
    tintJitter: 0.12,
    yBand: [-13, -5],
    orbitX: [20, 26],
    orbitZ: [46, 58],
    orbitPeriod: [45, 70],
    schoolRadius: [4, 6],
    wanderAmp: 0.8,
    tailFreq: 6.5,
  },
  {
    // Mid-water schooling fish — larger, slower, steel-blue
    name: 'blue-jack',
    schoolCount: 2,
    fishPerSchool: 22,
    bodyLength: [2.2, 3.0],
    bodyAspect: 0.32,
    color: '#4a7a96',
    tintJitter: 0.08,
    yBand: [-26, -13],
    orbitX: [24, 30],
    orbitZ: [50, 62],
    orbitPeriod: [90, 120],
    schoolRadius: [7, 9],
    wanderAmp: 1.2,
    tailFreq: 3.2,
  },
  {
    // Solitary bottom-dwellers cruising above the seafloor (y = −55)
    name: 'grouper',
    schoolCount: 4,
    fishPerSchool: 1,
    bodyLength: [4.5, 6.0],
    bodyAspect: 0.36,
    color: '#4a5248',
    tintJitter: 0.1,
    // Band bottom keeps clearance above dune crests (−48.8, see
    // seafloorHeight.ts) even at maximum downward bob (±2.0)
    yBand: [-45, -36],
    orbitX: [30, 45],
    orbitZ: [55, 75],
    orbitPeriod: [180, 260],
    schoolRadius: [0, 0],
    wanderAmp: 1.5,
    tailFreq: 1.3,
  },
];

/* ── Static per-school / per-fish parameters ───────────────────────────────
 * Built once at module level (plain numbers only — no Three.js resources)
 * with a seeded PRNG, so fish keep identical layouts across dive/surface
 * remounts and positions stay a pure function of elapsed time. */

interface SchoolParams {
  ax: number;        // orbit semi-axis X
  az: number;        // orbit semi-axis Z
  midY: number;      // orbit centre height
  period: number;    // seconds per lap
  dir: 1 | -1;       // orbit direction (alternates for variety)
  phase0: number;    // initial angle offset
  bobAmp: number;    // vertical bob amplitude
  bobFreq: number;   // vertical bob frequency (rad/s)
  radius: number;    // school offset envelope
}

interface SpeciesData {
  cfg: SpeciesConfig;
  count: number;
  schools: SchoolParams[];
  offsets: Float32Array;     // 3 per fish — persistent position in school
  wanderFreq: Float32Array;  // 3 per fish
  wanderPhase: Float32Array; // 3 per fish
  scales: Float32Array;      // 1 per fish — body length
  phases: Float32Array;      // 1 per fish — tail-wag phase offset
  tints: Float32Array;       // 1 per fish — lightness jitter (0–1)
}

function buildSpeciesData(cfg: SpeciesConfig, seed: number): SpeciesData {
  const rand = mulberry32(seed);
  const range = ([min, max]: [number, number]) => min + rand() * (max - min);

  const schools: SchoolParams[] = [];
  for (let s = 0; s < cfg.schoolCount; s++) {
    schools.push({
      ax: range(cfg.orbitX),
      az: range(cfg.orbitZ),
      midY: range(cfg.yBand),
      period: range(cfg.orbitPeriod),
      dir: s % 2 === 0 ? 1 : -1,
      phase0: rand() * Math.PI * 2,
      bobAmp: 0.8 + rand() * 1.2,
      bobFreq: 0.05 + rand() * 0.08,
      radius: range(cfg.schoolRadius),
    });
  }

  const count = cfg.schoolCount * cfg.fishPerSchool;
  const offsets = new Float32Array(count * 3);
  const wanderFreq = new Float32Array(count * 3);
  const wanderPhase = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const tints = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const school = schools[Math.floor(i / cfg.fishPerSchool)];
    // Persistent offset in a flattened ellipsoid around the school centre
    const theta = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * school.radius;
    offsets[i * 3] = Math.cos(theta) * rr;
    offsets[i * 3 + 1] = (rand() - 0.5) * school.radius * 0.8;
    offsets[i * 3 + 2] = Math.sin(theta) * rr;
    for (let k = 0; k < 3; k++) {
      wanderFreq[i * 3 + k] = 0.25 + rand() * 0.5;
      wanderPhase[i * 3 + k] = rand() * Math.PI * 2;
    }
    scales[i] = range(cfg.bodyLength);
    phases[i] = rand() * Math.PI * 2;
    tints[i] = rand();
  }

  return {
    cfg, count, schools, offsets, wanderFreq, wanderPhase, scales, phases, tints,
  };
}

const SPECIES_DATA = SPECIES.map((cfg, i) => buildSpeciesData(cfg, 0xf15c + i * 97));

/* ── Components ──────────────────────────────────────────────────────────── */

function Species({ data }: { data: SpeciesData }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { cfg } = data;

  // Patched-shader uniforms captured in onBeforeCompile so useFrame can
  // tick uTime without recompiling
  const shaderUniforms = useRef<Record<string, THREE.IUniform> | null>(null);

  const geometry = useMemo(() => {
    const geo = createFishGeometry(1, cfg.bodyAspect);
    // Per-instance tail-wag phase — InstancedMesh advances this per instance
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(data.phases, 1));
    return geo;
  }, [cfg.bodyAspect, data.phases]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.4,
      metalness: 0.45,
      side: THREE.DoubleSide, // tail fin is a flat quad
    });
    mat.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uTailFreq = { value: cfg.tailFreq };
      shader.uniforms.uWagAmp = { value: WAG_AMP };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${FISH_VERT_DECLS}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${FISH_VERT_WAG}`);
      shaderUniforms.current = shader.uniforms;
    };
    // Distinct cache key: three must not share this patched program with
    // vanilla MeshStandardMaterials elsewhere in the scene
    mat.customProgramCacheKey = () => `fish-${cfg.name}`;
    return mat;
  }, [cfg.color, cfg.name, cfg.tailFreq]);

  // R3F only calls InstancedMesh.dispose() on unmount, which frees neither
  // geometry nor material — dispose them explicitly or every dive/surface
  // cycle leaks their GPU buffers
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Per-fish colour tint via the built-in instanceColor path (set once)
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const base = new THREE.Color(cfg.color);
    const tinted = new THREE.Color();
    for (let i = 0; i < data.count; i++) {
      const jitter = 1 + (data.tints[i] - 0.5) * 2 * cfg.tintJitter;
      tinted.copy(base).multiplyScalar(jitter);
      mesh.setColorAt(i, tinted);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cfg.color, cfg.tintJitter, data]);

  // Scratch objects reused across all instances each frame
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  // Every school must fill its matrices at least once before the
  // distance-culling shortcut may skip it (matrices start as identity)
  const hasFilled = useRef(false);

  useFrame(({ clock, camera }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const { schools, offsets, wanderFreq, wanderPhase, scales } = data;

    // Drive the GPU tail-wag (uniforms exist once the shader has compiled)
    if (shaderUniforms.current) shaderUniforms.current.uTime.value = t;

    for (let s = 0; s < schools.length; s++) {
      const sc = schools[s];

      // School centre on its elliptical orbit + vertical bob
      const omega = (sc.dir * Math.PI * 2) / sc.period;
      const theta = omega * t + sc.phase0;
      const cx = sc.ax * Math.cos(theta);
      const cz = sc.az * Math.sin(theta);
      let cy = sc.midY + sc.bobAmp * Math.sin(sc.bobFreq * t + sc.phase0);

      // Analytic orbit velocity (for heading)
      const vcx = -sc.ax * Math.sin(theta) * omega;
      const vcz = sc.az * Math.cos(theta) * omega;
      const vcy = sc.bobAmp * sc.bobFreq * Math.cos(sc.bobFreq * t + sc.phase0);

      // Safety clamp: keep the school centre out of the hull keep-out box
      if (Math.abs(cx) < 14 && Math.abs(cz) < 40 && cy > -9) cy = -9;

      // Beyond fog visibility (~60–130 units) the school is invisible —
      // skip its matrix loop. Positions are pure functions of t, so
      // resuming later is seamless (no accumulated state, no pop).
      if (hasFilled.current) {
        const dx = cx - camera.position.x;
        const dy = cy - camera.position.y;
        const dz = cz - camera.position.z;
        if (dx * dx + dy * dy + dz * dz > 100 * 100) continue;
      }

      for (let j = 0; j < cfg.fishPerSchool; j++) {
        const i = s * cfg.fishPerSchool + j;
        const i3 = i * 3;

        const fx = wanderFreq[i3];
        const fy = wanderFreq[i3 + 1];
        const fz = wanderFreq[i3 + 2];
        const px = wanderPhase[i3];
        const py = wanderPhase[i3 + 1];
        const pz = wanderPhase[i3 + 2];
        const w = cfg.wanderAmp;

        // Two-sine wander: organic per-fish jitter without neighbour queries
        const wx = Math.sin(t * fx + px) * w;
        const wy = Math.sin(t * fy + py) * w * 0.4;
        const wz = Math.cos(t * fz + pz) * w;

        let posX = cx + offsets[i3] + wx;
        let posY = cy + offsets[i3 + 1] + wy;
        let posZ = cz + offsets[i3 + 2] + wz;

        // Scatter: displacement is a pure function of camera and fish
        // positions, so the school parts smoothly and re-forms with no
        // per-fish state as the camera moves through
        const dxc = posX - camera.position.x;
        const dyc = posY - camera.position.y;
        const dzc = posZ - camera.position.z;
        const dsq = dxc * dxc + dyc * dyc + dzc * dzc;
        if (dsq < SCATTER_RADIUS * SCATTER_RADIUS && dsq > 1e-4) {
          const d = Math.sqrt(dsq);
          const push = (1 - d / SCATTER_RADIUS) * SCATTER_STRENGTH;
          posX += (dxc / d) * push;
          posY += (dyc / d) * push * 0.4; // mostly sidestep, not dive/climb
          posZ += (dzc / d) * push;
        }

        // Velocity = orbit derivative + wander derivative → smooth heading
        const velX = vcx + Math.cos(t * fx + px) * fx * w;
        const velY = vcy + Math.cos(t * fy + py) * fy * w * 0.4;
        const velZ = vcz - Math.sin(t * fz + pz) * fz * w;

        dummy.position.set(posX, posY, posZ);
        lookTarget.set(posX + velX, posY + velY, posZ + velZ);
        dummy.lookAt(lookTarget);
        dummy.scale.setScalar(scales[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }

    hasFilled.current = true;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, data.count]}
      // Instance matrices place fish far from the geometry's origin-centred
      // bounding sphere — default frustum culling would wrongly hide them
      frustumCulled={false}
    />
  );
}

export function FishSchools() {
  const isUnderwater = useSceneStore((s) => s.isSubmerged);
  if (!isUnderwater) return null;

  return (
    <>
      {SPECIES_DATA.map((data) => (
        <Species key={data.cfg.name} data={data} />
      ))}
    </>
  );
}
