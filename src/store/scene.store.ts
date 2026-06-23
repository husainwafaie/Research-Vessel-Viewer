import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type * as THREE from 'three';
import type { CameraTarget } from '@domain/types';

export type CameraMode = 'free' | 'focused' | 'tour';

interface SceneState {
  cameraMode: CameraMode;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  cameraTarget: CameraTarget | null;
  isTransitioning: boolean;
  /**
   * Registry of Three.js Mesh objects keyed by their sanitized GLTF name.
   * Populated by VesselModel once the GLTF scene clone is ready; consumed by
   * MeshHighlighter to apply selection highlights without traversing the scene
   * graph on every selection change.
   */
  meshRegistry: Map<string, THREE.Mesh>;
}

interface SceneActions {
  selectComponent: (id: string, camera: CameraTarget) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setTransitioning: (transitioning: boolean) => void;
  resetCamera: (defaultCamera: CameraTarget) => void;
  setMeshRegistry: (registry: Map<string, THREE.Mesh>) => void;
}

export const useSceneStore = create<SceneState & SceneActions>()(
  subscribeWithSelector((set) => ({
    cameraMode: 'free',
    selectedComponentId: null,
    hoveredComponentId: null,
    cameraTarget: null,
    isTransitioning: false,
    meshRegistry: new Map(),

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

    setMeshRegistry: (registry) => set({ meshRegistry: registry }),
  })),
);
