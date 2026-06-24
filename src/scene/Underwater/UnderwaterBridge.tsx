import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '@store/scene.store';

/**
 * UnderwaterBridge — samples camera.position.y each frame when underwater
 * and publishes it to the scene store as `cameraDepth`.
 *
 * This is the only way to get live camera state out of the R3F Canvas into
 * the DOM layer without prop-drilling through the entire React tree.
 * The store write is throttled to once per frame; Zustand batches the DOM
 * re-render so the DepthGauge updates at display framerate.
 *
 * Water surface is at world Y = 0.  Depth = max(0, -camera.y) world units.
 * We multiply by a scalar (2.8) to give more dramatic depth numbers — the
 * model is not real-scale, so raw units read too shallow.
 */
const DEPTH_SCALE = 2.8;

export function UnderwaterBridge() {
  const isUnderwater   = useSceneStore((s) => s.cameraMode === 'underwater');
  const setCameraDepth = useSceneStore((s) => s.setCameraDepth);

  useFrame(({ camera }) => {
    if (!isUnderwater) return;
    const depth = Math.max(0, -camera.position.y) * DEPTH_SCALE;
    setCameraDepth(Math.round(depth * 10) / 10); // 1 decimal place
  });

  return null;
}
