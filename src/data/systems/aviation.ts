import type { VesselSystem } from '@domain/types';

export const aviationSystem: VesselSystem = {
  id: 'aviation',
  name: 'Aviation Systems',
  category: 'mission',
  description:
    'Helideck and aviation support systems enabling helicopter operations for crew transfer, aerial survey, and emergency response.',
  relatedSystemIds: ['mission', 'communication'],
  components: [
    {
      id: 'helipad',
      systemId: 'aviation',
      name: 'Helideck',
      shortDescription: 'Certified helicopter landing deck for crew transfer and survey operations',
      longDescription:
        'The forward helideck is certified for medium-lift helicopter operations up to the Sikorsky S-92 class. The deck structure is engineered with a dedicated drainage system, non-slip surface coating, and tie-down grid for aircraft securing. Aviation fuel storage and a refueling station allow extended rotary-wing operations during multi-week research cruises. The deck layout provides a clear approach from three sectors with lighting systems for night operations.',
      facts: [
        { label: 'Deck Diameter', value: '23', unit: 'm (D-value)' },
        { label: 'Max Aircraft Mass', value: '12,000', unit: 'kg' },
        { label: 'Certification', value: 'ICAO Annex 14 / CAP 437' },
        { label: 'Fuel Capacity', value: '8,000', unit: 'L Jet A-1' },
        { label: 'Night Operations', value: 'Full ICAO lighting' },
      ],
      camera: {
        position: [0, 14, -20],
        target: [0, 8, -12],
        fov: 55,
      },
      meshBindings: [
        { meshName: 'helipad_deck', role: 'primary' },
        { meshName: 'helipad_markings', role: 'highlight' },
        { meshName: 'helipad_netting', role: 'highlight' },
      ],
      animations: [],
      relatedComponentIds: ['bridge', 'crane_main'],
      tourStops: [
        {
          tourId: 'ocean_mapping',
          order: 2,
          narration:
            'The forward helideck serves as a rapid logistics hub — crew rotations and priority cargo can be transferred while the vessel remains on station, avoiding the fuel and time cost of returning to port mid-mission.',
          dwellMs: 5500,
        },
      ],
      tags: ['helipad', 'aviation', 'helicopter', 'deck'],
    },
  ],
};
