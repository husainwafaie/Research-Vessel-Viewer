import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const VESSEL_URL = '/models/vessel/scene.gltf';

// Kick off the fetch before the component ever mounts so there's no
// waterfall between SceneReadyNotifier and the model appearing.
useGLTF.preload(VESSEL_URL);

/**
 * VesselModel — loads and renders the RCRV GLTF model (Milestone 2.1).
 *
 * The original Blender scene includes an "Ocean" plane; we strip it on load
 * because the scene already supplies a reflective Three.js Water object.
 *
 * Coordinate convention (same as VesselPlaceholder):
 *   Origin = midship at waterline  (y = 0)
 *   +X = starboard, -X = port
 *   +Y = up,        -Y = keel
 *   +Z = bow,       -Z = stern
 *
 * scale / rotation / position are calibrated from the bounding-box log
 * that prints to the console on first load; adjust in Milestone 2.3 once
 * the real hotspot camera positions are dialled in.
 */
export function VesselModel() {
  const { scene } = useGLTF(VESSEL_URL);

  // Clone so we never mutate the useGLTF cache (important under React Strict
  // Mode and when HMR re-mounts this component).
  const vesselScene = useMemo(() => {
    const clone = scene.clone(true);

    // Remove the built-in ocean plane — we use Three.js Water instead.
    // The GLTF has a node named "Ocean" with a child mesh "Ocean_0".
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

  // Log bounding box once so we can calibrate scale / waterline offset.
  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(vesselScene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    console.info(
      '[VesselModel] size (x/y/z):',
      size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2),
    );
    console.info(
      '[VesselModel] center:',
      center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2),
    );
    console.info(
      '[VesselModel] min Y:', box.min.y.toFixed(2),
      '| max Y:', box.max.y.toFixed(2),
    );
  }, [vesselScene]);

  return (
    <primitive
      object={vesselScene}
      /*
       * Calibrated from bounding-box console output (Milestone 2.1):
       *   size   63.84 × 27.54 × 16.46  (X = bow↔stern, Y = height, Z = beam)
       *   center (1.31, 12.33, 5.69) in model space
       *   min Y  −1.44  (keel) | max Y 26.09 (top of mast)
       *
       * rotation Y = π/2 aligns the vessel's long axis (X) with the scene's
       * bow→+Z convention used by all camera and hotspot data.
       *
       * After that rotation the model centre maps to world (5.69, 12.33, −1.31),
       * so we translate by (−5.69, _, 1.31) to place the centreline at X=0, Z=0.
       *
       * Y = −1.5 puts the keel at scene Y ≈ −2.94 — a realistic ~3 m draft
       * for a vessel this size.  Fine-tune alongside hotspot calibration in 2.3.
       */
      position={[-5.69, -1.5, 1.31]}
      rotation={[0, Math.PI / 2, 0]}
      scale={1}
    />
  );
}
