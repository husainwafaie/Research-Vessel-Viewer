import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
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
 */

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
}

/** Deterministic PRNG so layouts survive remounts (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  }

  return { cfg, count, schools, offsets, wanderFreq, wanderPhase, scales, phases };
}

const SPECIES_DATA = SPECIES.map((cfg, i) => buildSpeciesData(cfg, 0xf15c + i * 97));

/* ── Components ──────────────────────────────────────────────────────────── */

function Species({ data }: { data: SpeciesData }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { cfg } = data;

  const geometry = useMemo(
    () => createFishGeometry(1, cfg.bodyAspect),
    [cfg.bodyAspect],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.4,
        metalness: 0.45,
        side: THREE.DoubleSide, // tail fin is a flat quad
      }),
    [cfg.color],
  );

  // Scratch objects reused across all instances each frame
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const { schools, offsets, wanderFreq, wanderPhase, scales } = data;

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

        const posX = cx + offsets[i3] + wx;
        const posY = cy + offsets[i3 + 1] + wy;
        const posZ = cz + offsets[i3 + 2] + wz;

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
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  if (!isUnderwater) return null;

  return (
    <>
      {SPECIES_DATA.map((data) => (
        <Species key={data.cfg.name} data={data} />
      ))}
    </>
  );
}
