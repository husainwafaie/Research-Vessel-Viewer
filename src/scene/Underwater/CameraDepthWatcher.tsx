import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '@store/scene.store';

/**
 * CameraDepthWatcher — auto-switches cameraMode based on camera Y position.
 *
 * Problem it solves:
 *   The Dive / Surface buttons move the camera AND set cameraMode.  But once
 *   underwater, the user can orbit back above the waterline without pressing
 *   Surface — and the underwater effects (fog, snow, lighting) stay on.
 *   Likewise, zooming in close to the hull from the surface can push the
 *   camera below y = 0 without any visual transition happening.
 *
 * Solution:
 *   Every frame, read camera.position.y imperatively via useSceneStore.getState()
 *   (avoids re-render subscriptions inside useFrame) and compare against two
 *   hysteresis thresholds to prevent rapid toggling at the boundary.
 *
 * Thresholds:
 *   ENTER_Y  −1.5  camera must dip 1.5 units below the surface before
 *                  underwater mode activates (prevents accidental trigger)
 *   EXIT_Y    1.0  camera must clear 1.0 unit above the surface before
 *                  surface mode restores (hysteresis band = 2.5 units)
 *
 * Mode guard:
 *   Only auto-switches between 'free' ↔ 'underwater'.  Does not interfere
 *   with 'focused' or 'tour' modes — those have their own camera ownership.
 *
 * isTransitioning guard (critical):
 *   When the Dive button fires enterUnderwater(), it sets cameraMode =
 *   'underwater' immediately but the camera is still above y = 0.  Without
 *   this guard the watcher fires on the very next frame, sees the camera above
 *   EXIT_Y while mode is 'underwater', and calls setCameraMode('free') —
 *   cancelling the dive before the lerp moves the camera anywhere.  We skip
 *   all mode-switching logic while isTransitioning is true so button-driven
 *   transitions own the mode for their full duration.
 *
 * Depth gauge:
 *   Also updates cameraDepth each frame when underwater, replacing the
 *   separate UnderwaterBridge component which did the same job.
 */

const ENTER_Y     = -1.5;   // world Y at which we consider camera submerged
const EXIT_Y      =  1.0;   // world Y at which we consider camera surfaced
const DEPTH_SCALE =  2.8;   // multiplier to give more dramatic depth numbers

export function CameraDepthWatcher() {
  useFrame(({ camera }) => {
    const store = useSceneStore.getState();
    const y = camera.position.y;

    // ── Visual submersion — tracked in EVERY mode (tours and focused
    // components included) and even mid-transition, so the underwater
    // visuals always follow the camera's actual position.
    if (!store.isSubmerged && y < ENTER_Y) {
      store.setSubmerged(true);
    } else if (store.isSubmerged && y > EXIT_Y) {
      store.setSubmerged(false);
    }

    // ── Depth readout whenever below the surface
    if (store.isSubmerged) {
      const depth = Math.round(Math.max(0, -y) * DEPTH_SCALE * 10) / 10;
      if (depth !== store.cameraDepth) store.setCameraDepth(depth);
    } else if (store.cameraDepth !== 0) {
      store.setCameraDepth(0);
    }

    // ── Mode auto-toggle (controls/UI semantics only) ──────────────────
    // Let button-triggered transitions own the mode for their full duration.
    // Without this, the watcher immediately undoes enterUnderwater() because
    // the camera starts above EXIT_Y while cameraMode is already 'underwater'.
    if (store.isTransitioning) return;

    // Don't interfere with tour or focused-component camera ownership
    if (store.cameraMode === 'tour' || store.cameraMode === 'focused') return;

    if (store.cameraMode !== 'underwater' && y < ENTER_Y) {
      // Camera crossed below the surface — switch to underwater controls
      store.setCameraMode('underwater');
    } else if (store.cameraMode === 'underwater' && y > EXIT_Y) {
      // Camera returned above the surface — restore surface controls
      store.setCameraMode('free');
    }
  });

  return null;
}
