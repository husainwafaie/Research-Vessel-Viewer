import type { VesselSystem } from '@domain/types';

export const propulsionSystem: VesselSystem = {
  id: 'propulsion',
  name: 'Propulsion Systems',
  category: 'propulsion',
  description:
    'Diesel-electric propulsion with azimuthing thrusters providing full 360° thrust vectoring and quiet operation essential for acoustic science work.',
  relatedSystemIds: ['navigation', 'power'],
  components: [
    {
      id: 'propulsion_main',
      systemId: 'propulsion',
      name: 'Azimuthing Propulsion System',
      shortDescription: 'Diesel-electric pod drives with full 360° thrust vectoring',
      longDescription:
        'The vessel uses a diesel-electric propulsion arrangement with two azimuthing podded drives replacing conventional shafts, rudders, and stern thrusters. Each pod houses a permanent-magnet electric motor directly coupled to a fixed-pitch propeller, eliminating gearboxes and shaft seals. The pods rotate continuously through 360°, providing propulsion and steering simultaneously. This arrangement dramatically reduces mechanical noise transmitted into the hull — a critical requirement for acoustic scientific operations.',
      facts: [
        { label: 'Drive Type', value: 'Azimuthing Pod × 2' },
        { label: 'Total Installed Power', value: '8,000', unit: 'kW' },
        { label: 'Max Speed', value: '14', unit: 'knots' },
        { label: 'Cruise Speed', value: '10', unit: 'knots' },
        { label: 'DP Class', value: 'DP-2' },
        { label: 'Noise Class', value: 'DNV Silent-R' },
      ],
      camera: {
        position: [-25, -3, 0],
        target: [-18, -5, 0],
        fov: 50,
      },
      meshBindings: [
        // Azimuthing pod drives are below the waterline and not modelled
        // as discrete meshes; bind the stern hull and exhaust as visible proxies.
        { meshName: 'Deck 0 Rear_0',       role: 'primary' },
        { meshName: 'Deck 1 rear shell_0', role: 'primary' },
        { meshName: 'Deck 1 rear shell_1', role: 'primary' },
        { meshName: 'Exhaust_0',           role: 'highlight' },
      ],
      animations: [
        { id: 'prop_spin', label: 'Propeller Rotation', clipName: 'propeller_spin_loop' },
      ],
      relatedComponentIds: ['thruster_bow', 'bridge'],
      tourStops: [],
      tags: ['propulsion', 'azimuth', 'diesel-electric', 'DP'],
    },
    {
      id: 'thruster_bow',
      systemId: 'propulsion',
      name: 'Bow Thruster Array',
      shortDescription: 'Transverse tunnel thrusters for precision station-keeping',
      longDescription:
        'Two retractable bow thrusters provide transverse thrust at the forward end of the vessel, working in concert with the azimuthing drives to achieve precise dynamic positioning. The thrusters are retractable to minimize drag and acoustic signature during transit. When deployed for station-keeping, the dynamic positioning system coordinates all thrust devices automatically, maintaining the vessel within a 2-meter position circle regardless of wind, wave, and current forces.',
      facts: [
        { label: 'Units', value: '2 × retractable tunnel thruster' },
        { label: 'Power Each', value: '1,000', unit: 'kW' },
        { label: 'Thrust Each', value: '120', unit: 'kN' },
        { label: 'Retraction Time', value: '90', unit: 'seconds' },
      ],
      camera: {
        position: [22, -2, 5],
        target: [16, -4, 0],
        fov: 55,
      },
      meshBindings: [
        // Bow thrusters are retractable tunnel thrusters flush with the hull;
        // bind the bow shell plates as the closest visible representation.
        { meshName: 'Deck 0 Front_0',        role: 'primary' },
        { meshName: 'Deck 1 front shell_0',  role: 'primary' },
        { meshName: 'Deck 1 front shell_1',  role: 'primary' },
        { meshName: 'Deck 1 front shell_2',  role: 'primary' },
        { meshName: 'Deck 1 front shell_3',  role: 'primary' },
      ],
      animations: [],
      relatedComponentIds: ['propulsion_main', 'bridge'],
      tourStops: [],
      tags: ['thruster', 'DP', 'station-keeping', 'propulsion'],
    },
  ],
};
