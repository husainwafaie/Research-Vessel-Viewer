import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CameraTarget } from '@domain/types';

export type CameraMode = 'free' | 'focused' | 'tour';

interface SceneState {
  cameraMode: CameraMode;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  cameraTarget: CameraTarget | null;
  isTransitioning: boolean;
}

interface SceneActions {
  selectComponent: (id: string, camera: CameraTarget) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setTransitioning: (transitioning: boolean) => void;
  resetCamera: (defaultCamera: CameraTarget) => void;
}

export const useSceneStore = create<SceneState & SceneActions>()(
  subscribeWithSelector((set) => ({
    cameraMode: 'free',
    selectedComponentId: null,
    hoveredComponentId: null,
    cameraTarget: null,
    isTransitioning: false,

    selectComponent: (id, camera) =>
      set({
        selectedComponentId: id,
        cameraTarget: camera,
        cameraMode: 'focused',
        isTransitioning: true,
      }),

    clearSelection: () =>
      set({
        selectedComponentId: null,
        cameraMode: 'free',
        cameraTarget: null,
      }),

    setHovered: (id) => set({ hoveredComponentId: id }),

    setCameraMode: (mode) => set({ cameraMode: mode }),

    setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

    resetCamera: (defaultCamera) =>
      set({
        selectedComponentId: null,
        cameraMode: 'free',
        cameraTarget: defaultCamera,
        isTransitioning: true,
      }),
  })),
);
