import type { Tour } from '@domain/types';

/**
 * Beneath the Hull — underwater guided tour.
 *
 * Uses camera steps (explicit poses) rather than component focus: the tour
 * descends below the waterline and visits the underwater environment built
 * around the vessel — hull caustics, fish schools, god rays, bioluminescent
 * drifters, and the seafloor. CameraDepthWatcher switches the underwater
 * visuals and controls automatically as the camera submerges, and returns
 * everything to the surface state when the tour exits.
 *
 * Depth reference: display depth = −cameraY × 2.8 (CameraDepthWatcher).
 * The vessel keel sits at y ≈ −3; the seafloor dunes crest near y ≈ −49.
 */
export const beneathTheHullTour: Tour = {
  id: 'beneath_the_hull',
  name: 'Beneath the Hull',
  description:
    'Dive below the waterline and descend through the water column — from the sunlit hull down to the seafloor 150 metres below.',
  estimatedDurationMs: 47000,
  steps: [
    {
      title: 'Below the waterline',
      camera: { position: [18, -10, 40], target: [0, -3, 0] },
      narration:
        'A third of the vessel lives below the waterline. The hull draws three metres of draft, and from down here you can watch refracted sunlight play across the plating — the same caustic patterns that dance on the bottom of a swimming pool, scaled up to a 90-metre ship.',
      dwellMs: 8000,
    },
    {
      title: 'The sunlit zone',
      camera: { position: [10, -6, 25], target: [0, -1, 5] },
      narration:
        'The first twenty metres of ocean absorb almost all red light, which is why everything here reads blue-green. Look up: the underside of the surface acts as a shimmering mirror, and columns of sunlight pulse down through it wherever the waves align.',
      dwellMs: 7000,
    },
    {
      title: 'The mid-water community',
      camera: { position: [35, -12, 70], target: [0, -9, 30] },
      narration:
        'Research vessels attract life. Schools of silversides and jacks patrol the hull in slow orbits, feeding in the plankton drawn to the ship’s shadow. Marine snow — organic detritus sinking from the surface — drifts past them on its way to feed the communities below.',
      dwellMs: 8000,
    },
    {
      title: 'Falling light',
      camera: { position: [25, -18, 45], target: [-10, 0, 20] },
      narration:
        'Volumetric light shafts — crepuscular rays — mark the last reach of direct sunlight. Oceanographers call the boundary below the photic zone edge: past it, photosynthesis stops and the food web runs entirely on what sinks from above.',
      dwellMs: 7000,
    },
    {
      title: 'The twilight zone',
      camera: { position: [30, -34, 45], target: [0, -38, 0] },
      narration:
        'Below a hundred metres of display depth the water turns near-black, and biology makes its own light. The drifting sparks around you are bioluminescent plankton — the most common form of communication on Earth is not sound, but light like this.',
      dwellMs: 8000,
    },
    {
      title: 'The seafloor',
      camera: { position: [22, -42, 42], target: [0, -52, -10] },
      narration:
        'A hundred and fifty metres down, current-rippled sediment and scattered rock mark the bottom. Solitary groupers cruise the dune field. This is what the vessel’s multibeam sonar maps in three dimensions — terrain no sunlight has ever touched.',
      dwellMs: 9000,
    },
  ],
};
