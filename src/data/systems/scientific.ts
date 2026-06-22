import type { VesselSystem } from '@domain/types';

export const scientificSystem: VesselSystem = {
  id: 'scientific',
  name: 'Scientific Systems',
  category: 'scientific',
  description:
    'A comprehensive suite of ocean-science instrumentation for seafloor mapping, water column profiling, and deep-sea sampling.',
  relatedSystemIds: ['mapping', 'launch'],
  components: [
    {
      id: 'multibeam_sonar',
      systemId: 'scientific',
      name: 'Multibeam Sonar Array',
      shortDescription: 'High-resolution acoustic seafloor mapping system',
      longDescription:
        'The hull-mounted multibeam echo sounder emits a fan of acoustic pulses across a wide swath perpendicular to the vessel track. Return echoes are processed to produce centimeter-resolution bathymetric maps of the seafloor. The system simultaneously records water-column backscatter data, enabling detection of gas seeps, fish schools, and density layers without additional instrumentation.',
      facts: [
        { label: 'Frequency', value: '200–400', unit: 'kHz' },
        { label: 'Max Operating Depth', value: '7,000', unit: 'm' },
        { label: 'Swath Width', value: 'Up to 200°' },
        { label: 'Depth Resolution', value: '0.1', unit: '% water depth' },
        { label: 'Ping Rate', value: 'Up to 50', unit: 'Hz' },
      ],
      camera: {
        position: [12, -4, 0],
        target: [6, -6, 0],
        fov: 45,
      },
      meshBindings: [
        // Hull-mounted sonar: no discrete transducer mesh in the GLTF, so we
        // bind the mid-ship keel shell where the sonar array is flush-mounted.
        { meshName: 'Deck1 Mid Shell_0', role: 'primary' },
        { meshName: 'Deck1 Mid Shell_1', role: 'primary' },
        { meshName: 'Deck1 Mid Shell_2', role: 'primary' },
      ],
      animations: [
        { id: 'sonar_sweep', label: 'Sonar Sweep', clipName: 'sonar_sweep_anim' },
      ],
      relatedComponentIds: ['adcp', 'sub_bottom_profiler', 'rov_bay'],
      tourStops: [
        {
          tourId: 'ocean_mapping',
          order: 3,
          narration:
            'Mounted flush with the keel to minimize bubble interference, the multibeam sonar continuously paints the seafloor in three dimensions. A single transit across an unexplored ridge can reveal geologic features no human eye has ever seen.',
          dwellMs: 7000,
        },
      ],
      tags: ['sonar', 'mapping', 'acoustic', 'bathymetry'],
    },
    {
      id: 'adcp',
      systemId: 'scientific',
      name: 'Acoustic Doppler Current Profiler',
      shortDescription: 'Measures ocean current speed and direction through the water column',
      longDescription:
        'The hull-mounted ADCP uses the Doppler shift of acoustic returns from suspended particles to measure current velocity at discrete depth bins throughout the water column. Data is continuously streamed to the ship\'s scientific network, providing real-time current profiles used in ROV navigation planning, tracer studies, and oceanographic modeling.',
      facts: [
        { label: 'Frequency', value: '38 / 75 / 150', unit: 'kHz' },
        { label: 'Max Profiling Depth', value: '1,500', unit: 'm' },
        { label: 'Bin Resolution', value: '2–16', unit: 'm' },
        { label: 'Velocity Accuracy', value: '±1', unit: 'cm/s' },
      ],
      camera: {
        position: [-10, -4, 5],
        target: [-6, -6, 0],
        fov: 50,
      },
      meshBindings: [
        // No discrete ADCP transducer mesh in the GLTF; the model's pump
        // assembly occupies the hull well where the ADCP would be installed.
        { meshName: 'Pump_0',          role: 'primary' },
        { meshName: 'Pump supports_0', role: 'highlight' },
      ],
      animations: [],
      relatedComponentIds: ['multibeam_sonar', 'sub_bottom_profiler'],
      tourStops: [],
      tags: ['ADCP', 'oceanography', 'currents', 'acoustic'],
    },
  ],
};
