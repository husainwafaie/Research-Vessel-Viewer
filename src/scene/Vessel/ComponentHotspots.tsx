import { getAllComponents } from '@domain/selectors';
import { vessel } from '@data/vessel';
import { HotspotMarker } from './HotspotMarker';
import type { Vector3Tuple } from '@domain/types';

/**
 * ComponentHotspots — mounts one HotspotMarker per vessel component.
 *
 * Hotspot world position is derived from component.camera.target (calibrated
 * from the real GLTF bounding-box centres in Milestone 2.3).  A floor of 1.5 m
 * ensures markers never sink below deck level.
 */
export function ComponentHotspots() {
  const components = getAllComponents(vessel);

  return (
    <group name="hotspots">
      {components.map((component) => {
        const hotspotPos: Vector3Tuple = [
          component.camera.target[0],
          Math.max(component.camera.target[1], 1.5),
          component.camera.target[2],
        ];

        return (
          <HotspotMarker
            key={component.id}
            component={component}
            position={hotspotPos}
          />
        );
      })}
    </group>
  );
}
