import type { VesselSystem } from '@domain/types';

export const launchSystem: VesselSystem = {
  id: 'launch',
  name: 'Launch & Recovery Systems',
  category: 'launch',
  description:
    'Heavy-lift and over-the-side deployment systems for ROVs, scientific equipment, and sampling gear in sea states up to SS4.',
  relatedSystemIds: ['scientific', 'mission'],
  components: [
    {
      id: 'aframe',
      systemId: 'launch',
      name: 'A-Frame Launch System',
      shortDescription: 'Over-the-stern gantry for deep-sea equipment deployment',
      longDescription:
        'The stern A-frame provides a stable over-the-stern deployment capability for the vessel\'s heavy scientific payloads. The hydraulic system allows the A-frame to swing outboard, positioning equipment clear of the vessel\'s wake for safe water entry. An integrated active heave compensation winch maintains constant tension on the tether regardless of vessel motion, protecting sensitive instruments during deployment and recovery.',
      facts: [
        { label: 'Safe Working Load', value: '10', unit: 'tonnes' },
        { label: 'Outreach', value: '5.5', unit: 'm' },
        { label: 'Wire Capacity', value: '9,000', unit: 'm' },
        { label: 'Heave Compensation', value: 'Active ±3m stroke' },
        { label: 'Max Sea State', value: 'SS4' },
      ],
      camera: {
        position: [-20, 8, 0],
        target: [-15, 3, 0],
        fov: 50,
      },
      meshBindings: [
        // Crane B = the main stern crane / A-frame LARS on the aft deck
        { meshName: 'Crane B main_0',          role: 'primary' },
        { meshName: 'Crane B Arm_0',           role: 'primary' },
        { meshName: 'Crane B Base_0',          role: 'primary' },
        { meshName: 'Crane B Base supports_0', role: 'highlight' },
        { meshName: 'Crane B pulley_0',        role: 'highlight' },
      ],
      animations: [
        { id: 'aframe_deploy', label: 'Deploy A-Frame', clipName: 'aframe_swing_out' },
        { id: 'aframe_recover', label: 'Recover A-Frame', clipName: 'aframe_swing_in' },
      ],
      relatedComponentIds: ['rov_bay', 'crane_main'],
      tourStops: [
        {
          tourId: 'ocean_mapping',
          order: 4,
          narration:
            'The A-frame can lower a towed vehicle or oceanographic rosette to within meters of the ocean floor at 4,000 meters depth, while the heave compensation system absorbs the vessel\'s pitch and roll to keep the instrument stable.',
          dwellMs: 6500,
        },
      ],
      tags: ['launch', 'recovery', 'LARS', 'A-frame', 'winch'],
    },
    {
      id: 'crane_main',
      systemId: 'launch',
      name: 'Main Deck Crane',
      shortDescription: 'Knuckle-boom crane for deck cargo and over-side deployments',
      longDescription:
        'The hydraulic knuckle-boom crane serves both as a deck cargo handler and as a secondary science deployment system. Its articulated boom provides precise positioning in confined deck spaces and can reach outboard of the rail for equipment deployment or recovery. A constant-tension mode protects fragile scientific equipment during transfer operations in moderate sea states.',
      facts: [
        { label: 'Capacity at Full Reach', value: '3', unit: 'tonnes' },
        { label: 'Max Reach', value: '12', unit: 'm' },
        { label: 'Slew Range', value: '360°' },
        { label: 'Wire Rope Capacity', value: '200', unit: 'm' },
      ],
      camera: {
        position: [5, 10, -15],
        target: [0, 5, -10],
        fov: 55,
      },
      meshBindings: [
        // Deck 3 crane = knuckle-boom crane mounted on the main deck superstructure
        { meshName: 'Deck 3 crane base_0', role: 'primary' },
        { meshName: 'Deck 3 crane arm_0',  role: 'primary' },
        // Effer cranes = additional articulated deck cranes (port/starboard/centre)
        { meshName: 'Effer Crane Right_0',  role: 'primary' },
        { meshName: 'Effer Crane Left_0',   role: 'primary' },
        { meshName: 'Effer Crane Middle_0', role: 'primary' },
        { meshName: 'Effer Crane Pulley_0', role: 'highlight' },
        { meshName: 'Crane_Effer.009_0',    role: 'highlight' },
      ],
      animations: [
        { id: 'crane_extend', label: 'Extend Boom', clipName: 'crane_boom_extend' },
        { id: 'crane_slew', label: 'Slew Crane', clipName: 'crane_slew_90' },
      ],
      relatedComponentIds: ['aframe', 'rov_bay'],
      tourStops: [],
      tags: ['crane', 'launch', 'cargo', 'deck'],
    },
    {
      id: 'rov_bay',
      systemId: 'launch',
      name: 'ROV Deployment Bay',
      shortDescription: 'Dedicated hangar and launch facility for remotely operated vehicles',
      longDescription:
        'The ROV hangar provides a dedicated, weather-protected facility for the vessel\'s deep-rated remotely operated vehicle. The overhead rail system allows the ROV to be moved from its maintenance cradle to the launch position without deck crane intervention. The adjacent control room houses the pilot workstation, real-time telemetry systems, and data recording infrastructure for extended dive operations.',
      facts: [
        { label: 'Max ROV Class', value: 'Work-class (3,000 kg)' },
        { label: 'Tether Length', value: '6,000', unit: 'm' },
        { label: 'Max Operating Depth', value: '6,000', unit: 'm' },
        { label: 'Launch Method', value: 'Side-launch LARS' },
        { label: 'Control Room', value: '6-seat pilot station' },
      ],
      camera: {
        position: [-18, 5, -8],
        target: [-12, 2, -5],
        fov: 55,
      },
      meshBindings: [
        // Cranehouse = the enclosed equipment building on the aft deck that
        // serves as the ROV hangar and control-room structure.
        { meshName: '* Cranehouse_0',        role: 'primary' },
        { meshName: '* Cranehouse_1',        role: 'primary' },
        { meshName: '* Cranehouse ladder_0', role: 'highlight' },
      ],
      animations: [
        { id: 'rov_deploy', label: 'Deploy ROV', clipName: 'rov_launch_sequence' },
      ],
      relatedComponentIds: ['aframe', 'multibeam_sonar'],
      tourStops: [
        {
          tourId: 'ocean_mapping',
          order: 5,
          narration:
            'The ROV hangar is where deep-sea exploration begins. The vehicle can be ready for launch in under 30 minutes and will descend to depths no human can reach, transmitting live HD video and collecting samples from the ocean floor.',
          dwellMs: 7000,
        },
      ],
      tags: ['ROV', 'launch', 'deep-sea', 'hangar'],
    },
  ],
};
