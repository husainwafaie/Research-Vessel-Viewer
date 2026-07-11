import { describe, it, expect } from 'vitest';
import { mulberry32 } from './random';

/**
 * The PRNG underpins deterministic scene layout (fish schools, seafloor
 * rocks): the same seed must always produce the same sequence, or layouts
 * change between dives and the "pure function of time" invariant breaks.
 */
describe('mulberry32', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = mulberry32(0xf15c);
    const b = mulberry32(0xf15c);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const first10a = Array.from({ length: 10 }, a);
    const first10b = Array.from({ length: 10 }, b);
    expect(first10a).not.toEqual(first10b);
  });

  it('stays within [0, 1) and covers the range', () => {
    const rand = mulberry32(42);
    let min = 1;
    let max = 0;
    for (let i = 0; i < 10_000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBeLessThan(0.01);
    expect(max).toBeGreaterThan(0.99);
  });
});
