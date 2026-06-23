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
        // Helideck mesh centre ≈ [0, 10.36, -23.88]; overhead-ish elevated view
        position: [22, 22, -8],
        target:   [0, 10, -24],
        fov: 50,
      },
      meshBindings: [
        // The RCRV GLTF has no dedicated helideck mesh. The forward deck 3
        // area (Deck 3 front) and mid-ship deck 2 surfaces are the closest
        // visual approximation of the forward helideck landing zone.
        { meshName: 'Deck_3_front_0', role: 'primary' },
        { meshName: 'Deck_2_mid_0',   role: 'highlight' },
        { meshName: 'Deck_2_mid_1',   role: 'highlight' },
        { meshName: 'Deck_2_mid_2',   role: 'highlight' },
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
