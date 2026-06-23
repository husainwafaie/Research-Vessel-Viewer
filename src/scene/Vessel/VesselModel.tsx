import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';

const VESSEL_URL = '/models/vessel/scene.gltf';

// Kick off the fetch before the component ever mounts so there's no
// waterfall between SceneReadyNotifier and the model appearing.
useGLTF.preload(VESSEL_URL);

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

    // Enable shadow casting / receiving on every mesh in the hierarchy.
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
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
