import { getAllComponents } from '@domain/selectors';
import { vessel } from '@data/vessel';
import { HotspotMarker } from './HotspotMarker';
import type { CameraTarget, Vector3Tuple } from '@domain/types';

/**
 * Placeholder-era position overrides.
 *
 * The camera/hotspot values in the domain data are calibrated for the final
 * vessel GLTF model. While using the box placeholder, we override positions
 * here so hotspots land on visible geometry.
 *
 * DELETE this map when the real vessel model is integrated (Milestone 1.3/1.4).
 * The system will automatically fall back to component.camera values.
 */
const PLACEHOLDER: Partial<
  Record<string, { hotspot: Vector3Tuple; camera: CameraTarget }>
> = {
  bridge: {
    hotspot: [0, 16, 4],
    camera: { position: [0, 26, 48], target: [0, 14, 3], fov: 50 },
  },
  radar_mast: {
    hotspot: [0, 29, 1],
    camera: { position: [20, 38, 22], target: [0, 26, 1], fov: 45 },
  },
  helipad: {
    hotspot: [0, 7, 32],
    camera: { position: [0, 26, 62], target: [0, 6, 32], fov: 52 },
  },
  crane_main: {
    hotspot: [5, 15, -12],
    camera: { position: [30, 22, -5], target: [5, 12, -12], fov: 50 },
  },
  aframe: {
    hotspot: [0, 18, -40],
    camera: { position: [0, 28, -18], target: [0, 14, -40], fov: 52 },
  },
  rov_bay: {
    hotspot: [-8, 7, -28],
    camera: { position: [-35, 18, -22], target: [-8, 5, -28], fov: 50 },
  },
  multibeam_sonar: {
    hotspot: [0, 1, 0],
    camera: { position: [22, -2, 22], target: [0, -1, 0], fov: 48 },
  },
  adcp: {
    hotspot: [-7, 1, 10],
    camera: { position: [-28, -2, 18], target: [-5, -1, 10], fov: 50 },
  },
  propulsion_main: {
    hotspot: [0, 2, -47],
    camera: { position: [0, 12, -72], target: [0, 0, -44], fov: 52 },
  },
  thruster_bow: {
    hotspot: [0, 2, 44],
    camera: { position: [0, 12, 70], target: [0, 0, 44], fov: 52 },
  },
};

export function ComponentHotspots() {
  const components = getAllComponents(vessel);

  return (
    <group name="hotspots">
      {components.map((component) => {
        const override = PLACEHOLDER[component.id];
        const hotspotPos: Vector3Tuple = override
          ? override.hotspot
          : [
              component.camera.target[0],
              Math.max(component.camera.target[1], 1.5), // clamp above waterline
              component.camera.target[2],
            ];
        const cameraOverride = override?.camera;

        return (
          <HotspotMarker
            key={component.id}
            component={component}
            position={hotspotPos}
            cameraOverride={cameraOverride}
          />
        );
      })}
    </group>
  );
}
