import type { Vessel } from '@domain/types';
import {
  navigationSystem,
  scientificSystem,
  launchSystem,
  propulsionSystem,
  aviationSystem,
} from './systems';

export const vessel: Vessel = {
  id: 'rv_pelagic_horizon',
  name: 'R/V Pelagic Horizon',
  class: 'Global-Class Oceanographic Research Vessel',
  description:
    'A 90-meter global-class research vessel equipped for multi-disciplinary ocean science, deep-sea exploration, and long-duration expeditions in all ocean basins.',
  defaultCamera: {
    position: [40, 20, 60],
    target: [0, 0, 0],
    fov: 50,
  },
  systems: [
    navigationSystem,
    scientificSystem,
    launchSystem,
    propulsionSystem,
    aviationSystem,
  ],
};
