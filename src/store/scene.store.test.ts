import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from './scene.store';

/** Reset the singleton store to its initial shape before each test. */
beforeEach(() => {
  useSceneStore.setState({
    cameraMode: 'free',
    selectedComponentId: null,
    hoveredComponentId: null,
    cameraTarget: null,
    isTransitioning: false,
    cameraDepth: 0,
    isSubmerged: false,
  });
});

describe('scene store — dive transitions', () => {
  it('enterUnderwater switches mode, sets a submerged target, and owns the transition', () => {
    useSceneStore.getState().enterUnderwater();
    const s = useSceneStore.getState();
    expect(s.cameraMode).toBe('underwater');
    expect(s.isTransitioning).toBe(true);
    expect(s.selectedComponentId).toBeNull();
    expect(s.cameraTarget?.position[1]).toBeLessThan(0); // below waterline
  });

  it('exitUnderwater returns to free mode with a surface target', () => {
    useSceneStore.getState().enterUnderwater();
    useSceneStore.getState().exitUnderwater();
    const s = useSceneStore.getState();
    expect(s.cameraMode).toBe('free');
    expect(s.isTransitioning).toBe(true);
    expect(s.cameraTarget?.position[1]).toBeGreaterThan(0); // above waterline
  });
});

describe('scene store — component focus', () => {
  it('selectComponent enters focused mode with the given camera', () => {
    const camera = { position: [1, 2, 3] as [number, number, number], target: [0, 0, 0] as [number, number, number] };
    useSceneStore.getState().selectComponent('bridge', camera);
    const s = useSceneStore.getState();
    expect(s.cameraMode).toBe('focused');
    expect(s.selectedComponentId).toBe('bridge');
    expect(s.cameraTarget).toEqual(camera);
    expect(s.isTransitioning).toBe(true);
  });

  it('clearSelection returns to free mode and clears the target', () => {
    useSceneStore.getState().selectComponent('bridge', {
      position: [1, 2, 3],
      target: [0, 0, 0],
    });
    useSceneStore.getState().clearSelection();
    const s = useSceneStore.getState();
    expect(s.cameraMode).toBe('free');
    expect(s.selectedComponentId).toBeNull();
    expect(s.cameraTarget).toBeNull();
  });
});

describe('scene store — tour camera steps', () => {
  it('flyCamera moves the camera without selecting a component or changing mode', () => {
    const pose = { position: [18, -10, 40] as [number, number, number], target: [0, -3, 0] as [number, number, number] };
    useSceneStore.getState().flyCamera(pose);
    const s = useSceneStore.getState();
    expect(s.cameraTarget).toEqual(pose);
    expect(s.isTransitioning).toBe(true);
    expect(s.selectedComponentId).toBeNull();
    expect(s.cameraMode).toBe('free'); // mode untouched — watcher owns it
  });
});

describe('scene store — submersion', () => {
  it('isSubmerged is independent of cameraMode', () => {
    useSceneStore.getState().setSubmerged(true);
    expect(useSceneStore.getState().isSubmerged).toBe(true);
    expect(useSceneStore.getState().cameraMode).toBe('free');

    useSceneStore.getState().setSubmerged(false);
    expect(useSceneStore.getState().isSubmerged).toBe(false);
  });

  it('tracks camera depth for the HUD', () => {
    useSceneStore.getState().setCameraDepth(56.4);
    expect(useSceneStore.getState().cameraDepth).toBe(56.4);
  });
});
