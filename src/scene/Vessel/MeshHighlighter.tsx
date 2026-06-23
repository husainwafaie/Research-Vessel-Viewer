import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { getComponentById } from '@domain/selectors';
import { vessel } from '@data/vessel';
import type { MeshBindingRole } from '@domain/types';

/**
 * Per-role pulse parameters.
 * emissiveIntensity oscillates between min and max on a ~2 s sine cycle.
 */
const PULSE: Partial<Record<MeshBindingRole, {
  color: string;
  min:   number;
  max:   number;
}>> = {
  primary:   { color: '#0ea5e9', min: 0.35, max: 0.85 },  // sky-500
  highlight: { color: '#0369a1', min: 0.12, max: 0.32 },  // sky-700
  // 'collision' — invisible geometry, no highlight
};

/** Restore data: the original material so we can swap it back cleanly. */
interface SavedMesh {
  mesh:             THREE.Mesh;
  originalMaterial: THREE.Material | THREE.Material[];
}

/** Animation data: what useFrame mutates every tick. */
interface AnimatedMat {
  mat: THREE.MeshStandardMaterial;
  min: number;
  max: number;
}

/**
 * MeshHighlighter — purely logical R3F component (renders null).
 *
 * On component selection: clones each bound mesh's material, sets the emissive
 * colour, and registers it for per-frame pulse animation.
 * On deselection: restores original materials and disposes the clones.
 *
 * Cloning (not patching) is critical — the GLTF has 9 materials shared across
 * 136 meshes, so patching in-place would affect all siblings.
 */
export function MeshHighlighter() {
  const selectedId = useSceneStore((s) => s.selectedComponentId);
  const registry   = useSceneStore((s) => s.meshRegistry);

  /** Meshes whose materials we swapped — needed to restore them. */
  const savedRef = useRef<SavedMesh[]>([]);
  /** Cloned materials currently being animated by useFrame. */
  const animatedRef = useRef<AnimatedMat[]>([]);

  // ── Selection effect: swap materials in/out ──────────────────────────────
  useEffect(() => {
    // Restore previously highlighted meshes and dispose clones.
    for (const { mesh, originalMaterial } of savedRef.current) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      mesh.material = originalMaterial;
    }
    savedRef.current   = [];
    animatedRef.current = [];

    if (!selectedId) return;

    const component = getComponentById(vessel, selectedId);
    if (!component || component.meshBindings.length === 0) return;

    // Apply highlight to each bound mesh.
    for (const binding of component.meshBindings) {
      const mesh = registry.get(binding.meshName);
      if (!mesh) continue;

      const cfg = PULSE[binding.role];
      if (!cfg) continue;

      const originalMaterial = mesh.material;

      // Clone the material(s) so siblings sharing the same GLTF material
      // are not affected.
      if (Array.isArray(originalMaterial)) {
        const clones = originalMaterial.map((m) => {
          const c = m.clone() as THREE.MeshStandardMaterial;
          c.emissive.set(cfg.color);
          c.emissiveIntensity = cfg.min;
          return c;
        });
        mesh.material = clones;
        clones.forEach((c) => animatedRef.current.push({ mat: c, min: cfg.min, max: cfg.max }));
      } else {
        const c = (originalMaterial as THREE.MeshStandardMaterial).clone();
        c.emissive.set(cfg.color);
        c.emissiveIntensity = cfg.min;
        mesh.material = c;
        animatedRef.current.push({ mat: c, min: cfg.min, max: cfg.max });
      }

      savedRef.current.push({ mesh, originalMaterial });
    }
  }, [selectedId, registry]);

  // ── Per-frame pulse ──────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (animatedRef.current.length === 0) return;
    // Breathing sine: period = 2 s, always in [0, 1]
    const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * Math.PI);
    for (const { mat, min, max } of animatedRef.current) {
      mat.emissiveIntensity = min + (max - min) * pulse;
    }
  });

  // ── Unmount cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      for (const { mesh, originalMaterial } of savedRef.current) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        mesh.material = originalMaterial;
      }
      savedRef.current    = [];
      animatedRef.current = [];
    };
  }, []);

  return null;
}
