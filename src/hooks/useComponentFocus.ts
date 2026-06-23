import { useCallback } from 'react';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';
import { getComponentById, getComponentSystem } from '@domain/selectors';
import { vessel } from '@data/vessel';
import type { VesselComponent, VesselSystem, CameraTarget } from '@domain/types';

/**
 * useComponentFocus — primary hook for component selection.
 *
 * Abstracts the coordination between:
 *   scene store (camera mode, selectedComponentId)
 *   ui store    (panel visibility)
 *   data layer  (component/system lookup)
 *
 * Components that need to focus, select, or clear components should
 * use this hook rather than calling stores directly.
 */
export function useComponentFocus() {
  const selectedId      = useSceneStore((s) => s.selectedComponentId);
  const selectComponent = useSceneStore((s) => s.selectComponent);
  const clearSelection  = useSceneStore((s) => s.clearSelection);
  const resetCamera     = useSceneStore((s) => s.resetCamera);
  const openPanel       = useUIStore((s) => s.openPanel);
  const closePanel      = useUIStore((s) => s.closePanel);

  const component: VesselComponent | null = selectedId
    ? (getComponentById(vessel, selectedId) ?? null)
    : null;

  const system: VesselSystem | null = selectedId
    ? (getComponentSystem(vessel, selectedId) ?? null)
    : null;

  /** Focus the camera on a component and open the info panel. */
  const focus = useCallback(
    (id: string, cameraOverride?: CameraTarget) => {
      const c = getComponentById(vessel, id);
      if (!c) return;
      // Prefer explicit override (e.g. from a tour stop) → domain camera
      const camera = cameraOverride ?? c.camera;
      selectComponent(id, camera);
      openPanel('component');
    },
    [selectComponent, openPanel],
  );

  /** Clear selection and return camera to default. */
  const blur = useCallback(() => {
    clearSelection();
    closePanel();
    resetCamera(vessel.defaultCamera);
  }, [clearSelection, closePanel, resetCamera]);

  return {
    selectedId,
    component,
    system,
    focus,
    blur,
  };
}
