import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { getComponentById } from '@domain/selectors';
import { vessel } from '@data/vessel';

import type { MeshBindingRole } from '@domain/types';

/** Emissive colour / intensity applied per binding role. */
const HIGHLIGHT: Partial<Record<MeshBindingRole, { color: string; intensity: number }>> = {
  primary:   { color: '#0ea5e9', intensity: 0.7 },   // sky-500 — strong glow
  highlight: { color: '#0369a1', intensity: 0.35 },   // sky-700 — subtle accent
  // 'collision' meshes are invisible geometry — no emissive applied
};

interface SavedState {
  mesh:              THREE.Mesh;
  originalMaterial:  THREE.Material | THREE.Material[];
}

/**
 * MeshHighlighter — purely logical R3F component (renders null).
 *
 * Watches selectedComponentId in the scene store and applies emissive
 * highlights to every mesh listed in the component's meshBindings.
 *
 * Strategy:
 *   • On selection:   clone the mesh's material so sibling meshes sharing the
 *                     same GLTF material are unaffected; then set emissive.
 *   • On deselection: swap the original material back to release the clone.
 *
 * Cloning (not patching) is important here because the GLTF has 9 materials
 * shared across 136 meshes — patching in place would highlight every mesh
 * that shares the same material.
 */
export function MeshHighlighter() {
  const selectedId = useSceneStore((s) => s.selectedComponentId);
  const registry   = useSceneStore((s) => s.meshRegistry);

  // Meshes we have currently highlighted — kept in a ref so restore logic
  // does not need to be in the dependency array of the effect.
  const highlightedRef = useRef<SavedState[]>([]);

  useEffect(() => {
    // ── Restore previously highlighted meshes ──────────────────────────────
    for (const { mesh, originalMaterial } of highlightedRef.current) {
      // Dispose the cloned material(s) we created to avoid GPU leaks.
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      mesh.material = originalMaterial;
    }
    highlightedRef.current = [];

    if (!selectedId) return;

    const component = getComponentById(vessel, selectedId);
    if (!component || component.meshBindings.length === 0) return;

    // ── Apply highlight to bound meshes ────────────────────────────────────
    for (const binding of component.meshBindings) {
      const mesh = registry.get(binding.meshName);
      if (!mesh) continue;

      const cfg = HIGHLIGHT[binding.role];
      if (!cfg) continue; // 'collision' role — no visual highlight

      // Save and swap material.
      const originalMaterial = mesh.material;
      const cloned = Array.isArray(originalMaterial)
        ? originalMaterial.map((m) => {
            const c = m.clone() as THREE.MeshStandardMaterial;
            c.emissive.set(cfg.color);
            c.emissiveIntensity = cfg.intensity;
            return c;
          })
        : (() => {
            const c = (originalMaterial as THREE.MeshStandardMaterial).clone();
            c.emissive.set(cfg.color);
            c.emissiveIntensity = cfg.intensity;
            return c;
          })();

      mesh.material = cloned as THREE.Material | THREE.Material[];
      highlightedRef.current.push({ mesh, originalMaterial });
    }
  }, [selectedId, registry]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      for (const { mesh, originalMaterial } of highlightedRef.current) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        mesh.material = originalMaterial;
      }
      highlightedRef.current = [];
    };
  }, []);

  return null;
}
