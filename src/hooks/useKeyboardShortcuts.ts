import { useEffect } from 'react';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';
import { useTourStore } from '@store/tour.store';
import { vessel } from '@data/vessel';

/**
 * useKeyboardShortcuts — global keyboard handler for the explorer UI.
 *
 * Shortcuts:
 *   Escape        — tour active → exit tour
 *                 — panel open  → close panel + reset camera
 *   ArrowRight    — tour active → next step
 *   ArrowLeft     — tour active → previous step
 *   Space         — tour active → pause / resume
 *
 * Rules:
 *   - Never intercepts when focus is inside an <input>, <textarea>, or
 *     [contenteditable] so users can still type in any overlaid forms.
 *   - Space is prevented from scrolling the page only when the tour is active
 *     (i.e. we call e.preventDefault() only when we handle the key).
 *
 * Call this hook once at the AppShell level so it is always mounted.
 */
export function useKeyboardShortcuts() {
  const clearSelection = useSceneStore((s) => s.clearSelection);
  const resetCamera    = useSceneStore((s) => s.resetCamera);
  const closePanel     = useUIStore((s) => s.closePanel);
  const activePanel    = useUIStore((s) => s.activePanel);

  const activeTour     = useTourStore((s) => s.activeTour);
  const isPlaying      = useTourStore((s) => s.isPlaying);
  const exitTour       = useTourStore((s) => s.exitTour);
  const nextStep       = useTourStore((s) => s.nextStep);
  const previousStep   = useTourStore((s) => s.previousStep);
  const pauseTour      = useTourStore((s) => s.pauseTour);
  const resumeTour     = useTourStore((s) => s.resumeTour);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Never intercept input fields
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      const tourActive  = activeTour !== null;
      const panelActive = activePanel !== null;

      switch (e.key) {
        case 'Escape': {
          if (tourActive) {
            e.preventDefault();
            exitTour();
          } else if (panelActive) {
            e.preventDefault();
            clearSelection();
            closePanel();
            resetCamera(vessel.defaultCamera);
          }
          break;
        }

        case 'ArrowRight': {
          if (tourActive) {
            e.preventDefault();
            nextStep();
          }
          break;
        }

        case 'ArrowLeft': {
          if (tourActive) {
            e.preventDefault();
            previousStep();
          }
          break;
        }

        case ' ': {
          if (tourActive) {
            e.preventDefault(); // prevent page scroll
            if (isPlaying) pauseTour();
            else resumeTour();
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTour, activePanel, isPlaying,
    exitTour, nextStep, previousStep, pauseTour, resumeTour,
    clearSelection, closePanel, resetCamera,
  ]);
}
