import type { VesselSystem } from '@domain/types';

export const navigationSystem: VesselSystem = {
  id: 'navigation',
  name: 'Navigation Systems',
  category: 'navigation',
  description:
    'Integrated navigation and positioning systems enabling precise maneuvering and station-keeping in open-ocean and polar environments.',
  relatedSystemIds: ['communication', 'mission'],
  components: [
    {
      id: 'bridge',
      systemId: 'navigation',
      name: 'Bridge',
      shortDescription: 'Central command and navigation hub of the vessel',
      longDescription:
        'The bridge is the operational nerve center of the vessel, housing the integrated bridge system (IBS) that consolidates navigation, propulsion control, communication, and safety monitoring into a unified workstation environment. Officers maintain continuous situational awareness through a 270° panoramic view supplemented by radar, ECDIS, and AIS overlays.',
      facts: [
        { label: 'Visibility', value: '270°', unit: 'arc' },
        { label: 'Bridge Wing Span', value: '24', unit: 'm' },
        { label: 'ECDIS Displays', value: '4' },
        { label: 'Radar Systems', value: 'X-band + S-band' },
        { label: 'Dynamic Positioning', value: 'DP-2 Class' },
      ],
      camera: {
        position: [0, 12, 25],
        target: [0, 8, 0],
        fov: 50,
      },
      meshBindings: [
        // Deck 4 = bridge deck — the main enclosed bridge structure
        { meshName: '* Deck 4_0', role: 'primary' },
        { meshName: '* Deck 4_1', role: 'primary' },
        { meshName: '* Deck 4_2', role: 'primary' },
        { meshName: '* Deck 4_3', role: 'primary' },
        { meshName: '* Deck 4_4', role: 'primary' },
        // Deck 5 = wheelhouse / bridge top level
        { meshName: 'Deck 5 walls_0', role: 'highlight' },
        { meshName: 'Deck 5 walls_1', role: 'highlight' },
        { meshName: 'Deck 5 floor_0', role: 'highlight' },
      ],
      animations: [],
      relatedComponentIds: ['radar_mast', 'propulsion_main'],
      tourStops: [
        {
          tourId: 'ocean_mapping',
          order: 1,
          narration:
            'The bridge coordinates every aspect of the research mission, from departure planning to on-station dynamic positioning that holds the vessel steady within two meters while the sonar array maps the seafloor below.',
          dwellMs: 6000,
        },
      ],
      tags: ['navigation', 'command', 'bridge', 'DP'],
    },
    {
      id: 'radar_mast',
      systemId: 'navigation',
      name: 'Radar Mast',
      shortDescription: 'Multi-band radar and antenna array for navigation and communication',
      longDescription:
        'The integrated mast supports a suite of navigation and communication antennas in a carefully designed arrangement that minimizes mutual interference. Dual radar systems — an X-band for short-range precision and an S-band for long-range and adverse-weather performance — provide overlapping coverage. GPS, GLONASS, and Galileo receivers feed the dynamic positioning system with continuous position fixes.',
      facts: [
        { label: 'X-band Radar Range', value: '96', unit: 'nm' },
        { label: 'S-band Radar Range', value: '96', unit: 'nm' },
        { label: 'Mast Height', value: '18', unit: 'm above waterline' },
        { label: 'GNSS Systems', value: 'GPS / GLONASS / Galileo' },
        { label: 'AIS Class', value: 'Class A Transponder' },
      ],
      camera: {
        position: [0, 20, 15],
        target: [0, 15, 0],
        fov: 45,
      },
      meshBindings: [
        // Main mast column and its cross-supports on Deck 3
        { meshName: 'Deck 3 mast_0',          role: 'primary' },
        { meshName: 'Deck 3 mast_1',          role: 'primary' },
        { meshName: 'Deck 3 mast_2',          role: 'primary' },
        { meshName: 'Deck 3 mast supports_0', role: 'primary' },
        // Crow's-nest / instrument platform at mast head
        { meshName: 'Nest base_0',            role: 'primary' },
        { meshName: 'Nest mid_0',             role: 'primary' },
        { meshName: 'Nest Top_0',             role: 'primary' },
        { meshName: 'Nest ladder_0',          role: 'highlight' },
        { meshName: 'Nest railing mid_0',     role: 'highlight' },
        { meshName: 'Nest railing top_0',     role: 'highlight' },
        // Radar heads and antenna domes
        { meshName: 'Nest radar 2_0',              role: 'highlight' },
        { meshName: 'Nest radar 3_0',              role: 'highlight' },
        { meshName: 'Next Radar 1_0',              role: 'highlight' },
        { meshName: 'Radar dome left_0',           role: 'highlight' },
        { meshName: 'Radar dome right_0',          role: 'highlight' },
        { meshName: 'Radar dome right Pole_0',     role: 'highlight' },
        { meshName: 'Radar dome right Pole.001_0', role: 'highlight' },
      ],
      animations: [
        { id: 'radar_spin', label: 'Radar Rotation', clipName: 'radar_spin_loop' },
      ],
      relatedComponentIds: ['bridge'],
      tourStops: [],
      tags: ['navigation', 'radar', 'antenna', 'GNSS'],
    },
  ],
};
