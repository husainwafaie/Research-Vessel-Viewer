import type { Tour } from '@domain/types';

export const oceanMappingTour: Tour = {
  id: 'ocean_mapping',
  name: 'Ocean Mapping Mission',
  description:
    'Follow an active seafloor mapping deployment from bridge departure through sonar operation and ROV readiness.',
  estimatedDurationMs: 42000,
  steps: [
    {
      componentId: 'bridge',
      narration:
        'The bridge coordinates every aspect of the research mission, from departure planning to on-station dynamic positioning that holds the vessel steady within two meters while the sonar array maps the seafloor below.',
      dwellMs: 6000,
    },
    {
      componentId: 'helipad',
      narration:
        'The forward helideck serves as a rapid logistics hub — crew rotations and priority cargo can be transferred while the vessel remains on station, avoiding the fuel and time cost of returning to port mid-mission.',
      dwellMs: 5500,
    },
    {
      componentId: 'multibeam_sonar',
      narration:
        'Mounted flush with the keel to minimize bubble interference, the multibeam sonar continuously paints the seafloor in three dimensions. A single transit across an unexplored ridge can reveal geologic features no human eye has ever seen.',
      dwellMs: 7000,
    },
    {
      componentId: 'aframe',
      narration:
        'The A-frame can lower a towed vehicle or oceanographic rosette to within meters of the ocean floor at 4,000 meters depth, while the heave compensation system absorbs the vessel\'s pitch and roll to keep the instrument stable.',
      dwellMs: 6500,
    },
    {
      componentId: 'rov_bay',
      narration:
        'The ROV hangar is where deep-sea exploration begins. The vehicle can be ready for launch in under 30 minutes and will descend to depths no human can reach, transmitting live HD video and collecting samples from the ocean floor.',
      dwellMs: 7000,
    },
  ],
};
