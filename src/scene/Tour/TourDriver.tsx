import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTourStore } from '@store/tour.store';
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
 */
export function TourDriver() {
  const activeTour       = useTourStore((s) => s.activeTour);
  const currentStepIndex = useTourStore((s) => s.currentStepIndex);
  const isPlaying        = useTourStore((s) => s.isPlaying);
  const nextStep         = useTourStore((s) => s.nextStep);

  const { focus, blur } = useComponentFocus();

  // Tracks ms elapsed in the current step. Reset on every step change.
  const elapsedMsRef = useRef(0);

  // ── Focus camera when step changes ──────────────────────────────────────────
  useEffect(() => {
    if (!activeTour) return;
    const step = activeTour.steps[currentStepIndex];
    if (!step) return;
    focus(step.componentId);
  }, [activeTour, currentStepIndex, focus]);

  // ── Reset elapsed timer when step changes ───────────────────────────────────
  useEffect(() => {
    elapsedMsRef.current = 0;
  }, [currentStepIndex, activeTour]);

  // ── Return camera to overview when tour ends ─────────────────────────────────
  useEffect(() => {
    if (!activeTour) {
      blur();
    }
  }, [activeTour, blur]);

  // ── Auto-advance timer ───────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!activeTour || !isPlaying) return;
    const step = activeTour.steps[currentStepIndex];
    if (!step) return;

    elapsedMsRef.current += delta * 1000;

    if (elapsedMsRef.current >= step.dwellMs) {
      // Reset BEFORE calling nextStep so the next useFrame doesn't
      // see a stale elapsed value against the new step's dwellMs.
      elapsedMsRef.current = 0;
      nextStep();
    }
  });

  return null;
}
