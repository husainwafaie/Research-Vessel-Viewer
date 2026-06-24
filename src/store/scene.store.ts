import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type * as THREE from 'three';
import type { CameraTarget } from '@domain/types';

export type CameraMode = 'free' | 'focused' | 'tour' | 'underwater';

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
  /**
   * Camera depth below the water surface in world units.
   * Updated each frame by UnderwaterBridge when cameraMode === 'underwater'.
   * Used by the DepthGauge HUD to display current depth.
   */
  cameraDepth: number;
}

interface SceneActions {
  selectComponent: (id: string, camera: CameraTarget) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setTransitioning: (transitioning: boolean) => void;
  resetCamera: (defaultCamera: CameraTarget) => void;
  setMeshRegistry: (registry: Map<string, THREE.Mesh>) => void;
  /** Transition camera below the waterline into underwater exploration mode. */
  enterUnderwater: () => void;
  /** Return to surface free-look from underwater mode. */
  exitUnderwater: () => void;
  /** Called each frame by UnderwaterBridge to keep depth reading current. */
  setCameraDepth: (depth: number) => void;
}

export const useSceneStore = create<SceneState & SceneActions>()(
  subscribeWithSelector((set) => ({
    cameraMode: 'free',
    selectedComponentId: null,
    hoveredComponentId: null,
    cameraTarget: null,
    isTransitioning: false,
    meshRegistry: new Map(),
    cameraDepth: 0,

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

    enterUnderwater: () =>
      set({
        cameraMode: 'underwater',
        // Dive beneath the hull, angled upward to see keel and propellers
        cameraTarget: { position: [25, -20, 65], target: [0, -4, 0] },
        isTransitioning: true,
        selectedComponentId: null,
        cameraDepth: 0,
      }),

    exitUnderwater: () =>
      set({
        cameraMode: 'free',
        cameraTarget: { position: [80, 30, 120], target: [0, 5, 0] },
        isTransitioning: true,
        cameraDepth: 0,
      }),

    setCameraDepth: (depth) => set({ cameraDepth: depth }),
  })),
);
