import { useSceneStore } from '@store/scene.store';
import { FLOOR_CLAMP_Y } from '@scene/Camera/CameraController';
import { DEPTH_SCALE } from '@scene/Underwater/CameraDepthWatcher';

// Deepest reachable display depth — the camera clamps just above the dunes
const MAX_DISPLAY_DEPTH = -FLOOR_CLAMP_Y * DEPTH_SCALE;

/**
 * DepthGauge — HUD overlay shown only in underwater camera mode.
 *
 * Displays current simulated depth sourced from the scene store's
 * `cameraDepth` value, which is written each frame by UnderwaterBridge.
 *
 * Positioned bottom-right to avoid overlapping the systems sidebar.
 * Uses a glass card consistent with the rest of the UI language.
 */
export function DepthGauge() {
  const isUnderwater = useSceneStore((s) => s.isSubmerged);
  const depth        = useSceneStore((s) => s.cameraDepth);

  if (!isUnderwater) return null;

  return (
    <div
      className="absolute bottom-20 right-4 pointer-events-none"
      role="status"
      aria-label={`Current depth: ${depth.toFixed(1)} metres`}
    >
      <div className="glass rounded-xl px-4 py-3 flex flex-col items-end gap-1 min-w-[110px]">
        {/* Label */}
        <span className="text-data text-ocean-500 text-xs uppercase tracking-widest">
          Depth
        </span>

        {/* Depth reading */}
        <div className="flex items-baseline gap-1">
          <span className="text-cyan-300 text-2xl font-light tabular-nums leading-none">
            {depth.toFixed(1)}
          </span>
          <span className="text-ocean-400 text-xs">m</span>
        </div>

        {/* Visual depth bar — fills proportionally to the deepest reachable
            point (the camera's seafloor clamp) */}
        <div className="w-full h-1 rounded-full bg-ocean-900 mt-1 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-100"
            style={{ width: `${Math.min(100, (depth / MAX_DISPLAY_DEPTH) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
