import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTourStore } from '@store/tour.store';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';
import { useComponentFocus } from '@hooks/useComponentFocus';

/**
 * TourDriver — R3F scene component (renders null, lives inside Canvas).
 *
 * Responsibilities:
 *   - When a tour starts or the step index changes, focus the camera on that
 *     step's component using the shared useComponentFocus hook (which already
 *     applies PLACEHOLDER_POSITIONS for the box era).
 *   - Drive the auto-advance timer via useFrame so it stays in sync with
 *     the render loop rather than relying on setTimeout.
 *   - When the tour is exited, blur back to the overview.
 *
 * This component has NO UI — the TourPanel (DOM layer) owns all visuals.
 *
 * Timer design note
 * ─────────────────
 * elapsedMsRef and lastSeenStepRef are both tracked inside useFrame so the
 * reset is always synchronous on the very first tick after a step change
 * (whether triggered by auto-advance or by the user clicking Prev/Next in
 * TourPanel). A useEffect-based reset fires after paint and can miss one or
 * more useFrame ticks, causing the timer to fire instantly on the new step
 * if the accumulated elapsed already exceeds that step's dwellMs.
 */
export function TourDriver() {
  const activeTour       = useTourStore((s) => s.activeTour);
  const currentStepIndex = useTourStore((s) => s.currentStepIndex);
  const isPlaying        = useTourStore((s) => s.isPlaying);
  const nextStep         = useTourStore((s) => s.nextStep);

  const { focus, blur } = useComponentFocus();
  const flyCamera  = useSceneStore((s) => s.flyCamera);
  const closePanel = useUIStore((s) => s.closePanel);

  // Both refs are read and written exclusively inside useFrame, keeping the
  // reset tightly coupled to the animation loop.
  const elapsedMsRef    = useRef(0);
  const lastSeenStepRef = useRef(-1);

  // ── Focus camera when step changes ──────────────────────────────────────────
  // Component steps focus + open the info panel; camera steps fly to an
  // explicit pose with no selection (underwater tours use these — the
  // CameraDepthWatcher flips underwater visuals/controls as the camera dives)
  useEffect(() => {
    if (!activeTour) return;
    const step = activeTour.steps[currentStepIndex];
    if (!step) return;
    if (step.componentId) {
      focus(step.componentId);
    } else if (step.camera) {
      closePanel();
      flyCamera(step.camera);
    }
  }, [activeTour, currentStepIndex, focus, flyCamera, closePanel]);

  // ── Return camera to overview when tour ends ─────────────────────────────────
  useEffect(() => {
    if (!activeTour) {
      lastSeenStepRef.current = -1;
      elapsedMsRef.current    = 0;
      blur();
    }
  }, [activeTour, blur]);

  // ── Auto-advance timer ───────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!activeTour || !isPlaying) return;
    const step = activeTour.steps[currentStepIndex];
    if (!step) return;

    // Synchronous reset: detect any step change (manual or auto) on the first
    // tick after the React render commits the new currentStepIndex value.
    if (lastSeenStepRef.current !== currentStepIndex) {
      elapsedMsRef.current    = 0;
      lastSeenStepRef.current = currentStepIndex;
      return; // skip this tick's accumulation; begin fresh next frame
    }

    elapsedMsRef.current += delta * 1000;

    if (elapsedMsRef.current >= step.dwellMs) {
      elapsedMsRef.current = 0;
      nextStep();
      // lastSeenStepRef will be updated on the next tick when currentStepIndex
      // has propagated from the store through the selector.
    }
  });

  return null;
}
