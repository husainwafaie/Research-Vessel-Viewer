/**
 * mulberry32 — small deterministic PRNG.
 *
 * Used by procedural scene content (fish schools, seafloor scatter) so
 * layouts are reproducible across remounts: the same seed always yields the
 * same sequence, keeping placement a pure function of the seed rather than
 * of mount timing.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
