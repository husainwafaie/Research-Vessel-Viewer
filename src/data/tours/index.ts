export { oceanMappingTour } from './ocean-mapping';
export { beneathTheHullTour } from './beneath-the-hull';

import type { Tour } from '@domain/types';
import { oceanMappingTour } from './ocean-mapping';
import { beneathTheHullTour } from './beneath-the-hull';

export const allTours: Tour[] = [oceanMappingTour, beneathTheHullTour];

export function getTourById(id: string): Tour | undefined {
  return allTours.find((t) => t.id === id);
}
