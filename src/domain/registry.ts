import type { Vessel, MeshRegistryEntry } from './types';

/**
 * Builds a flat lookup map from mesh node name → registry entry.
 * This is the only place in the codebase where mesh names are resolved
 * to component IDs. Built once at startup from vessel data.
 */
export function buildMeshRegistry(vessel: Vessel): Map<string, MeshRegistryEntry> {
  const registry = new Map<string, MeshRegistryEntry>();

  for (const system of vessel.systems) {
    for (const component of system.components) {
      for (const binding of component.meshBindings) {
        registry.set(binding.meshName, {
          meshName: binding.meshName,
          componentId: component.id,
          role: binding.role,
        });
      }
    }
  }

  return registry;
}

export function lookupMesh(
  registry: Map<string, MeshRegistryEntry>,
  meshName: string,
): MeshRegistryEntry | undefined {
  return registry.get(meshName);
}

export function getPrimaryMeshesForComponent(
  registry: Map<string, MeshRegistryEntry>,
  componentId: string,
): string[] {
  const meshNames: string[] = [];
  for (const [meshName, entry] of registry.entries()) {
    if (entry.componentId === componentId && entry.role === 'primary') {
      meshNames.push(meshName);
    }
  }
  return meshNames;
}

export function getAllMeshesForComponent(
  registry: Map<string, MeshRegistryEntry>,
  componentId: string,
): string[] {
  const meshNames: string[] = [];
  for (const [meshName, entry] of registry.entries()) {
    if (entry.componentId === componentId) {
      meshNames.push(meshName);
    }
  }
  return meshNames;
}
