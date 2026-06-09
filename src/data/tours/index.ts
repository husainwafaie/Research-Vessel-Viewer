export { oceanMappingTour } from './ocean-mapping';

import type { Tour } from '@domain/types';
import { oceanMappingTour } from './ocean-mapping';

export const allTours: Tour[] = [oceanMappingTour];

export function getTourById(id: string): Tour | undefined {
  return allTours.find((t) => t.id === id);
}
