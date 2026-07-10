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
   * Updated each frame by CameraDepthWatcher whenever the camera is
   * submerged, in any camera mode. Used by the DepthGauge HUD.
   */
  cameraDepth: number;
  /**
   * True while the camera is physically below the waterline (with
   * hysteresis), regardless of cameraMode. All underwater VISUALS gate on
   * this — cameraMode 'underwater' only governs controls/UI semantics — so
   * tours and focused components render correctly below the surface too.
   */
  isSubmerged: boolean;
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
  /**
   * Fly the camera to an explicit pose without selecting a component —
   * used by tour camera steps. Camera mode is left alone; the
   * CameraDepthWatcher flips underwater controls if the pose is submerged.
   */
  flyCamera: (camera: CameraTarget) => void;
  /** Called each frame by CameraDepthWatcher to keep depth reading current. */
  setCameraDepth: (depth: number) => void;
  /** Called by CameraDepthWatcher when the camera crosses the waterline. */
  setSubmerged: (submerged: boolean) => void;
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
    isSubmerged: false,

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

    flyCamera: (camera) =>
      set({
        cameraTarget: camera,
        isTransitioning: true,
        selectedComponentId: null,
      }),

    setCameraDepth: (depth) => set({ cameraDepth: depth }),

    setSubmerged: (submerged) => set({ isSubmerged: submerged }),
  })),
);
