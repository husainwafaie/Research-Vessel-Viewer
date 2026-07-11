import { describe, it, expect } from 'vitest';
import {
  terrainHeight,
  TERRAIN_GLSL,
  TERRAIN_MAX,
  DUNE_FREQ,
  DUNE_AMP,
  DETAIL_FREQ,
  DETAIL_AMP,
} from './seafloorHeight';

/**
 * seafloorHeight is the contract between the GPU (Seafloor displacement)
 * and the CPU (SeafloorScatter rock seating). If the JS mirror drifts from
 * the GLSL, rocks float above or sink below the visible dunes.
 */
describe('terrainHeight (JS mirror)', () => {
  it('is deterministic — same input, same output', () => {
    expect(terrainHeight(123.4, -567.8)).toBe(terrainHeight(123.4, -567.8));
    expect(terrainHeight(0, 0)).toBe(terrainHeight(0, 0));
  });

  it('stays within [0, TERRAIN_MAX] across the seafloor plane', () => {
    for (let x = -1000; x <= 1000; x += 40) {
      for (let z = -1000; z <= 1000; z += 40) {
        const h = terrainHeight(x, z);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(TERRAIN_MAX);
      }
    }
  });

  it('produces actual relief, not a flat plane', () => {
    const samples: number[] = [];
    for (let x = -500; x <= 500; x += 25) {
      samples.push(terrainHeight(x, x * 0.7));
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance =
      samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    expect(Math.sqrt(variance)).toBeGreaterThan(0.5);
  });

  it('handles negative coordinates without discontinuities at zero', () => {
    // GLSL fract()/floor() and Math.floor both round toward −∞; adjacent
    // samples across the origin must not jump more than the noise slope
    const step = 0.5;
    const before = terrainHeight(-step, 0);
    const at = terrainHeight(0, 0);
    const after = terrainHeight(step, 0);
    const maxSlopePerUnit = (DUNE_AMP * DUNE_FREQ + DETAIL_AMP * DETAIL_FREQ) * 20;
    expect(Math.abs(at - before)).toBeLessThan(maxSlopePerUnit);
    expect(Math.abs(after - at)).toBeLessThan(maxSlopePerUnit);
  });
});

describe('TERRAIN_GLSL', () => {
  it('embeds the same frequency/amplitude constants as the JS mirror', () => {
    expect(TERRAIN_GLSL).toContain(DUNE_FREQ.toFixed(4));
    expect(TERRAIN_GLSL).toContain(DUNE_AMP.toFixed(2));
    expect(TERRAIN_GLSL).toContain(DETAIL_FREQ.toFixed(4));
    expect(TERRAIN_GLSL).toContain(DETAIL_AMP.toFixed(2));
  });

  it('defines the functions the shaders call', () => {
    expect(TERRAIN_GLSL).toContain('float terrainHash(vec2 p)');
    expect(TERRAIN_GLSL).toContain('float terrainNoise(vec2 p)');
    expect(TERRAIN_GLSL).toContain('float terrainHeight(vec2 worldXZ)');
  });
});
