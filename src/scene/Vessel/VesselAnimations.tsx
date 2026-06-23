import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

// ── Radar configuration ──────────────────────────────────────────────────────
//
// Three.js sanitized mesh names (spaces → underscores) and rotation speeds
// in radians per second.  Different speeds on each head give a realistic
// impression of independent scanning sweeps at different radar frequencies.
//
// Rotation axis: parent.rotation.z — in the GLTF scene's Blender Z-up local
// space, Z is the vertical axis (= world Y after the Sketchfab_model root
// matrix applies the Z→Y conversion).  So rotating around local Z produces
// a horizontal 360° sweep in world space, regardless of the primitive's own
// rotation Y = π/2.
const RADAR_CONFIG: Record<string, number> = {
  Nest_radar_2_0: 0.55,   // main X-band bar — moderate sweep
  Nest_radar_3_0: 0.30,   // secondary bar — slower (simulates S-band)
  Next_Radar_1_0: 0.45,   // upper radar element
};

interface RadarEntry {
  parent:        THREE.Object3D;
  mesh:          THREE.Mesh;
  speed:         number;
  /** Saved so cleanup can restore the original scene graph state. */
  origParentPos: THREE.Vector3;
  origMeshPos:   THREE.Vector3;
}

/**
 * VesselAnimations — procedural always-on animations for the vessel.
 *
 * Currently drives radar head rotation.  Each radar's intermediate GLTF
 * parent node has an identity transform, meaning its pivot sits at the
 * vessel origin rather than the radar's geometric centre.  On mount we
 * reposition the pivot to the mesh's world-space bounding box centre (via
 * matrixWorld inversion) and offset the mesh back so the visual position
 * is unchanged.  useFrame then increments parent.rotation.z each tick.
 *
 * Cleanup restores original positions and zero rotation so HMR is clean.
 */
export function VesselAnimations() {
  const registry   = useSceneStore((s) => s.meshRegistry);
  const entriesRef = useRef<RadarEntry[]>([]);

  useEffect(() => {
    if (registry.size === 0) return;

    const entries: RadarEntry[] = [];

    for (const [meshName, speed] of Object.entries(RADAR_CONFIG)) {
      const mesh = registry.get(meshName);
      if (!mesh?.parent) continue;

      const parent = mesh.parent;

      // Ensure the parent chain has up-to-date world matrices before we
      // compute the bounding box (useEffect runs after first render so R3F
      // will have rendered once, but an explicit update is safer).
      parent.updateWorldMatrix(true, false);

      // World-space bounding box centre of this radar mesh.
      const worldCenter = new THREE.Box3()
        .setFromObject(mesh)
        .getCenter(new THREE.Vector3());

      // Express worldCenter in the parent's local coordinate space.
      // parent.matrixWorld^(-1) * worldCenter gives the point that, when
      // placed as the parent's origin, puts the pivot at the radar centre.
      const parentInvWorld = parent.matrixWorld.clone().invert();
      const localCenter    = worldCenter.clone().applyMatrix4(parentInvWorld);

      // Save originals for cleanup.
      const origParentPos = parent.position.clone();
      const origMeshPos   = mesh.position.clone();

      // Shift parent pivot to radar geometric centre; offset mesh back so
      // the world position of every vertex is unchanged.
      parent.position.add(localCenter);
      mesh.position.sub(localCenter);

      entries.push({ parent, mesh, speed, origParentPos, origMeshPos });
    }

    entriesRef.current = entries;

    return () => {
      for (const { parent, mesh, origParentPos, origMeshPos } of entriesRef.current) {
        parent.position.copy(origParentPos);
        mesh.position.copy(origMeshPos);
        parent.rotation.set(0, 0, 0);
      }
      entriesRef.current = [];
    };
  }, [registry]);

  // Increment rotation.z each frame — horizontal sweep in Blender Z-up space
  // which maps to world-Y rotation after the root matrix Z→Y conversion.
  useFrame((_, delta) => {
    for (const { parent, speed } of entriesRef.current) {
      parent.rotation.z += speed * delta;
    }
  });

  return null;
}
