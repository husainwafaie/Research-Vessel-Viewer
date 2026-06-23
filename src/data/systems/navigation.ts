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
        // Bridge deck is at world centre ≈ [0, 14.87, -4.19]
        position: [25, 22, -25],
        target:   [0, 14, -4],
        fov: 50,
      },
      meshBindings: [
        // Deck 4 = bridge deck — the main enclosed bridge structure
        { meshName: '*_Deck_4_0', role: 'primary' },
        { meshName: '*_Deck_4_1', role: 'primary' },
        { meshName: '*_Deck_4_2', role: 'primary' },
        { meshName: '*_Deck_4_3', role: 'primary' },
        { meshName: '*_Deck_4_4', role: 'primary' },
        // Deck 5 = wheelhouse / bridge top level
        { meshName: 'Deck_5_walls_0', role: 'highlight' },
        { meshName: 'Deck_5_walls_1', role: 'highlight' },
        { meshName: 'Deck_5_floor_0', role: 'highlight' },
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
        // Mast base at world centre ≈ [0, 12.19, -30.32]; target upper mast
        position: [22, 30, -12],
        target:   [0, 20, -30],
        fov: 45,
      },
      meshBindings: [
        // Main mast column and its cross-supports on Deck 3
        { meshName: 'Deck_3_mast_0',          role: 'primary' },
        { meshName: 'Deck_3_mast_1',          role: 'primary' },
        { meshName: 'Deck_3_mast_2',          role: 'primary' },
        { meshName: 'Deck_3_mast_supports_0', role: 'primary' },
        // Crow's-nest / instrument platform at mast head
        { meshName: 'Nest_base_0',            role: 'primary' },
        { meshName: 'Nest_mid_0',             role: 'primary' },
        { meshName: 'Nest_Top_0',             role: 'primary' },
        { meshName: 'Nest_ladder_0',          role: 'highlight' },
        { meshName: 'Nest_railing_mid_0',     role: 'highlight' },
        { meshName: 'Nest_railing_top_0',     role: 'highlight' },
        // Radar heads and antenna domes
        { meshName: 'Nest_radar_2_0',             role: 'highlight' },
        { meshName: 'Nest_radar_3_0',             role: 'highlight' },
        { meshName: 'Next_Radar_1_0',             role: 'highlight' },
        { meshName: 'Radar_dome_left_0',          role: 'highlight' },
        { meshName: 'Radar_dome_right_0',         role: 'highlight' },
        { meshName: 'Radar_dome_right_Pole_0',    role: 'highlight' },
        { meshName: 'Radar_dome_right_Pole001_0', role: 'highlight' },
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
