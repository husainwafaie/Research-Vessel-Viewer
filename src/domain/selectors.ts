import type { Vessel, VesselComponent, VesselSystem } from './types';

export function getSystemById(vessel: Vessel, systemId: string): VesselSystem | undefined {
  return vessel.systems.find((s) => s.id === systemId);
}

export function getComponentById(vessel: Vessel, componentId: string): VesselComponent | undefined {
  for (const system of vessel.systems) {
    const component = system.components.find((c) => c.id === componentId);
    if (component) return component;
  }
  return undefined;
}

export function getAllComponents(vessel: Vessel): VesselComponent[] {
  return vessel.systems.flatMap((s) => s.components);
}

export function getComponentsByTag(vessel: Vessel, tag: string): VesselComponent[] {
  return getAllComponents(vessel).filter((c) => c.tags.includes(tag));
}

export function getRelatedComponents(vessel: Vessel, componentId: string): VesselComponent[] {
  const component = getComponentById(vessel, componentId);
  if (!component) return [];
  return component.relatedComponentIds
    .map((id) => getComponentById(vessel, id))
    .filter((c): c is VesselComponent => c !== undefined);
}

export function getComponentSystem(vessel: Vessel, componentId: string): VesselSystem | undefined {
  return vessel.systems.find((s) => s.components.some((c) => c.id === componentId));
}
