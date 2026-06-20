import { getAllComponents } from '@domain/selectors';
import { vessel } from '@data/vessel';
import { PLACEHOLDER_POSITIONS } from '@data/placeholderPositions';
import { HotspotMarker } from './HotspotMarker';
import type { Vector3Tuple } from '@domain/types';

/**
 * ComponentHotspots — mounts one HotspotMarker per vessel component.
 *
 * Positions come from PLACEHOLDER_POSITIONS (shared with useComponentFocus)
 * while the real GLTF model is pending. When the real model arrives, delete
 * placeholderPositions.ts and let hotspot positions derive from component.camera.
 */
export function ComponentHotspots() {
  const components = getAllComponents(vessel);

  return (
    <group name="hotspots">
      {components.map((component) => {
        const override = PLACEHOLDER_POSITIONS[component.id];

        const hotspotPos: Vector3Tuple = override
          ? override.hotspot
          : [
              component.camera.target[0],
              Math.max(component.camera.target[1], 1.5),
              component.camera.target[2],
            ];

        return (
          <HotspotMarker
            key={component.id}
            component={component}
            position={hotspotPos}
            cameraOverride={override?.camera}
          />
        );
      })}
    </group>
  );
}
