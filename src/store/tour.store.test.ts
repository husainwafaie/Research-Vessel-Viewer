import { describe, it, expect, beforeEach } from 'vitest';
import { useTourStore } from './tour.store';
import type { Tour } from '@domain/types';

const fixtureTour: Tour = {
  id: 'test_tour',
  name: 'Test Tour',
  description: 'Fixture',
  estimatedDurationMs: 3000,
  steps: [
    { componentId: 'bridge', narration: 'one', dwellMs: 1000 },
    { camera: { position: [1, -5, 2], target: [0, 0, 0] }, title: 'Camera step', narration: 'two', dwellMs: 1000 },
    { componentId: 'helipad', narration: 'three', dwellMs: 1000 },
  ],
};

beforeEach(() => {
  useTourStore.getState().exitTour();
});

describe('tour store', () => {
  it('startTour begins playing at step 0', () => {
    useTourStore.getState().startTour(fixtureTour);
    const s = useTourStore.getState();
    expect(s.activeTour?.id).toBe('test_tour');
    expect(s.currentStepIndex).toBe(0);
    expect(s.isPlaying).toBe(true);
    expect(s.isPaused).toBe(false);
  });

  it('nextStep advances and stops (not exits) at the final step', () => {
    useTourStore.getState().startTour(fixtureTour);
    useTourStore.getState().nextStep();
    expect(useTourStore.getState().currentStepIndex).toBe(1);

    useTourStore.getState().nextStep();
    expect(useTourStore.getState().currentStepIndex).toBe(2);

    // Advancing past the end parks on the last step with playback stopped
    useTourStore.getState().nextStep();
    const s = useTourStore.getState();
    expect(s.currentStepIndex).toBe(2);
    expect(s.isPlaying).toBe(false);
    expect(s.activeTour).not.toBeNull();
  });

  it('previousStep does not go below step 0', () => {
    useTourStore.getState().startTour(fixtureTour);
    useTourStore.getState().previousStep();
    expect(useTourStore.getState().currentStepIndex).toBe(0);
  });

  it('goToStep clamps to the valid range', () => {
    useTourStore.getState().startTour(fixtureTour);
    useTourStore.getState().goToStep(99);
    expect(useTourStore.getState().currentStepIndex).toBe(2);
    useTourStore.getState().goToStep(-5);
    expect(useTourStore.getState().currentStepIndex).toBe(0);
  });

  it('pause and resume flip playback without losing the step', () => {
    useTourStore.getState().startTour(fixtureTour);
    useTourStore.getState().nextStep();
    useTourStore.getState().pauseTour();
    expect(useTourStore.getState().isPlaying).toBe(false);
    expect(useTourStore.getState().isPaused).toBe(true);

    useTourStore.getState().resumeTour();
    expect(useTourStore.getState().isPlaying).toBe(true);
    expect(useTourStore.getState().currentStepIndex).toBe(1);
  });

  it('exitTour resets everything', () => {
    useTourStore.getState().startTour(fixtureTour);
    useTourStore.getState().nextStep();
    useTourStore.getState().exitTour();
    const s = useTourStore.getState();
    expect(s.activeTour).toBeNull();
    expect(s.currentStepIndex).toBe(0);
    expect(s.isPlaying).toBe(false);
  });

  it('supports mixed component and camera steps (underwater tours)', () => {
    useTourStore.getState().startTour(fixtureTour);
    useTourStore.getState().nextStep();
    const step = useTourStore.getState().activeTour?.steps[1];
    expect(step?.componentId).toBeUndefined();
    expect(step?.camera?.position[1]).toBeLessThan(0);
    expect(step?.title).toBe('Camera step');
  });
});
