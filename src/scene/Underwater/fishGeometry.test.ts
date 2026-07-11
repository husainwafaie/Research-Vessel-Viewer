import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createFishGeometry } from './fishGeometry';

/**
 * The geometry's local-space convention is load-bearing: FishSchools
 * orients instances with Object3D.lookAt(), which aims the +Z axis — so
 * the head MUST be at +Z or every fish swims backwards. The tail-weight
 * ramp in the wag shader likewise assumes tail = −Z.
 */
describe('createFishGeometry', () => {
  const length = 1;
  const height = 0.28;
  const geo = createFishGeometry(length, height);
  geo.computeBoundingBox();
  const box = geo.boundingBox as THREE.Box3;

  it('places the head at +Z (lookAt convention)', () => {
    // Nose reaches +length/2; nothing extends further forward
    expect(box.max.z).toBeCloseTo(length / 2, 1);
    // Tail side extends beyond −length/2 (the tail fin quad)
    expect(box.min.z).toBeLessThan(-length / 2);
  });

  it('is laterally flattened — fish are tall, not round', () => {
    const xExtent = box.max.x - box.min.x;
    const yExtent = box.max.y - box.min.y;
    expect(xExtent).toBeLessThan(yExtent);
  });

  it('respects the requested height envelope', () => {
    const yExtent = box.max.y - box.min.y;
    // Body ≤ height; tail fin is allowed to exceed it slightly (×1.4)
    expect(yExtent).toBeLessThanOrEqual(height * 1.5);
    expect(yExtent).toBeGreaterThan(height * 0.8);
  });

  it('is a lightweight merged mesh with the attributes lighting needs', () => {
    expect(geo.index).not.toBeNull();
    expect(geo.getAttribute('position')).toBeDefined();
    expect(geo.getAttribute('normal')).toBeDefined();
    expect(geo.getAttribute('uv')).toBeDefined();
    // ~90 triangles budgeted per fish — fail if it balloons
    const triangles = (geo.index as THREE.BufferAttribute).count / 3;
    expect(triangles).toBeLessThan(150);
    expect(triangles).toBeGreaterThan(30);
  });

  it('scales linearly with the length parameter', () => {
    const big = createFishGeometry(2, 0.56);
    big.computeBoundingBox();
    const bigBox = big.boundingBox as THREE.Box3;
    expect(bigBox.max.z).toBeCloseTo(1, 1);
  });
});
