import { create } from 'zustand';
import type { Tour } from '@domain/types';

interface TourState {
  activeTour: Tour | null;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
}

interface TourActions {
  startTour: (tour: Tour) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  exitTour: () => void;
}

export const useTourStore = create<TourState & TourActions>()((set, get) => ({
  activeTour: null,
  currentStepIndex: 0,
  isPlaying: false,
  isPaused: false,

  startTour: (tour) =>
    set({
      activeTour: tour,
      currentStepIndex: 0,
      isPlaying: true,
      isPaused: false,
    }),

  nextStep: () => {
    const { activeTour, currentStepIndex } = get();
    if (!activeTour) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= activeTour.steps.length) {
      set({ isPlaying: false, currentStepIndex: activeTour.steps.length - 1 });
    } else {
      set({ currentStepIndex: nextIndex });
    }
  },

  previousStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  goToStep: (index) => {
    const { activeTour } = get();
    if (!activeTour) return;
    const clamped = Math.max(0, Math.min(index, activeTour.steps.length - 1));
    set({ currentStepIndex: clamped });
  },

  pauseTour: () => set({ isPaused: true, isPlaying: false }),

  resumeTour: () => set({ isPaused: false, isPlaying: true }),

  exitTour: () =>
    set({
      activeTour: null,
      currentStepIndex: 0,
      isPlaying: false,
      isPaused: false,
    }),
}));
