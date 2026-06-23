import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

const VESSEL_URL = '/models/vessel/scene.gltf';

// Kick off the fetch before the component ever mounts so there's no
// waterfall between SceneReadyNotifier and the model appearing.
useGLTF.preload(VESSEL_URL);

/**
 * PBR override table — keyed by the GLTF material name.
 *
 * The original Sketchfab export has several materials with unrealistic
 * values (non-metallic steel, over-shiny rubber, flat painted surfaces).
 * We tune them here without touching baseColor so the model's colour
 * palette is preserved.  One clone per material name is created in the
 * useMemo below so the useGLTF cache is never mutated.
 *
 * Derived from: node -e "…gltf.materials.forEach(…)" inspection of
 * public/models/vessel/scene.gltf (9 materials, no external textures).
 */
const MATERIAL_OVERRIDES: Record<string, { roughness?: number; metalness?: number }> = {
  // Stair treads, railings — structural steel, should be metallic
  'Staircase.004_0': { metalness: 0.65, roughness: 0.55 },
  // Main hull and superstructure plating — marine-grade steel
  Silver:            { metalness: 0.75, roughness: 0.42 },
  // Cranes and davits — painted structural steel (orange)
  Orange:            { metalness: 0.20, roughness: 0.65 },
  // Internal structural supports — steel, rougher finish
  Support:           { metalness: 0.60, roughness: 0.58 },
  // Rubber seals, dark painted areas — low metalness, matte
  Black:             { metalness: 0.05, roughness: 0.70 },
  // White painted superstructure surfaces — semi-matte paint
  White:             { metalness: 0.08, roughness: 0.58 },
  // Red safety markings / hazard paint — semi-metallic
  material:          { metalness: 0.45, roughness: 0.45 },
  // Bridge windows — near-mirror tinted glass, keep near-zero roughness
  Windows:           { metalness: 0.92, roughness: 0.04 },
  // Water mesh — stripped on load; entry kept for completeness, never used
};

/**
 * VesselModel — loads and renders the RCRV GLTF model.
 *
 * The original Blender scene includes an "Ocean" plane; we strip it on load
 * because the scene already supplies a reflective Three.js Water object.
 *
 * Coordinate convention after the transform below:
 *   Origin = midship centreline at waterline  (y = 0)
 *   +X = starboard, -X = port
 *   +Y = up,        -Y = keel
 *   +Z = stern,     -Z = bow
 *
 * Calibrated bounding-box data (Milestone 2.1):
 *   model long axis = X  →  rotation Y = π/2 maps it to world Z
 *   model size  63.84 × 27.54 × 16.46  (X × Y × Z in model space)
 *   model centre (1.31, 12.33, 5.69) in pre-transform space
 *   min Y −1.44  (keel) | max Y 26.09 (mast top)
 *
 * position [-5.69, -1.5, 1.31] centres the hull on the world XZ plane
 * and sets the keel at world Y ≈ −2.94 (approx. 3 m draft).
 */
export function VesselModel() {
  const { scene } = useGLTF(VESSEL_URL);
  const setMeshRegistry = useSceneStore((s) => s.setMeshRegistry);

  // Clone so we never mutate the useGLTF cache (important under React Strict
  // Mode and when HMR re-mounts this component).
  const vesselScene = useMemo(() => {
    const clone = scene.clone(true);

    // Remove the built-in ocean plane — we use Three.js Water instead.
    const oceanNode = clone.getObjectByName('Ocean');
    if (oceanNode) oceanNode.removeFromParent();

    // Build a per-material-name clone map so we create exactly one clone
    // per unique material regardless of how many meshes share it.
    // This keeps GPU allocations minimal and ensures MeshHighlighter's
    // save/restore cycle operates on our tuned materials as the base state.
    const tunedMaterials = new Map<string, THREE.MeshStandardMaterial>();

    const getTuned = (src: THREE.Material): THREE.MeshStandardMaterial => {
      if (!tunedMaterials.has(src.name)) {
        const cloned   = (src as THREE.MeshStandardMaterial).clone();
        const override = MATERIAL_OVERRIDES[src.name];
        if (override) {
          if (override.roughness !== undefined) cloned.roughness = override.roughness;
          if (override.metalness !== undefined) cloned.metalness = override.metalness;
        }
        tunedMaterials.set(src.name, cloned);
      }
      return tunedMaterials.get(src.name)!;
    };

    // Enable shadow casting / receiving on every mesh in the hierarchy
    // and swap in our tuned material clones.
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
        child.material = Array.isArray(child.material)
          ? child.material.map(getTuned)
          : getTuned(child.material);
      }
    });

    return clone;
  }, [scene]);

  // Build the mesh registry from the cloned scene and push it to the store.
  // MeshHighlighter reads this map to apply selection highlights by name
  // without traversing the scene graph on every selection change.
  useEffect(() => {
    const registry = new Map<string, THREE.Mesh>();
    vesselScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        registry.set(child.name, child);
      }
    });
    setMeshRegistry(registry);
    // Clear the registry when this model unmounts (e.g. HMR reload).
    return () => setMeshRegistry(new Map());
  }, [vesselScene, setMeshRegistry]);

  return (
    <primitive
      object={vesselScene}
      position={[-5.69, -1.5, 1.31]}
      rotation={[0, Math.PI / 2, 0]}
      scale={1}
    />
  );
}
