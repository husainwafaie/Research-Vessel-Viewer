import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { FLOOR_Y, terrainHeight } from './seafloorHeight';

const COUNT = 140;
// Scatter ring around the vessel (world units from origin)
const RADIUS_MIN = 30;
const RADIUS_MAX = 260;

/**
 * SeafloorScatter — instanced rocks and debris on the ocean bottom.
 *
 * One InstancedMesh (single draw call) of low-poly icosahedra, each with a
 * random squash/stretch and rotation so no two silhouettes read alike.
 * Positions are seeded (mulberry32, matching FishSchools) and seated on the
 * displaced terrain via the JS terrainHeight() mirror from seafloorHeight.ts
 * — each rock sits slightly sunk into its dune, never floating.
 *
 * Matrices are written once on mount (useLayoutEffect); there is no
 * per-frame work at all.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function SeafloorScatter() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a332c', // dark grey-green, matches the sand palette
        roughness: 0.95,
        metalness: 0.0,
        flatShading: true, // faceted silhouettes read as rock
      }),
    [],
  );

  // Seat every rock once — deterministic layout, zero per-frame cost
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const rand = mulberry32(0x5ea0f10e);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < COUNT; i++) {
      const angle = rand() * Math.PI * 2;
      const radius =
        RADIUS_MIN + Math.sqrt(rand()) * (RADIUS_MAX - RADIUS_MIN);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Mostly small rubble with the occasional boulder
      const base = rand() < 0.12 ? 2.5 + rand() * 2.5 : 0.6 + rand() * 1.6;
      const sx = base * (0.7 + rand() * 0.6);
      const sy = base * (0.45 + rand() * 0.35); // squashed — settled look
      const sz = base * (0.7 + rand() * 0.6);

      // Seat on the displaced terrain, sunk ~30% of height into the sand
      const y = FLOOR_Y + terrainHeight(x, z) + sy * 0.7;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        (rand() - 0.5) * 0.4,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 0.4,
      );
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [isUnderwater]); // re-seat after each remount (self-gate below)

  if (!isUnderwater) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, COUNT]}
      // Instances sit far from the geometry's origin bounding sphere —
      // default frustum culling would wrongly hide them
      frustumCulled={false}
    />
  );
}
