import * as THREE from 'three';
import type { Vector3Tuple } from '@domain/types';

export function tupleToVector3(tuple: Vector3Tuple): THREE.Vector3 {
  return new THREE.Vector3(...tuple);
}

export function vector3ToTuple(v: THREE.Vector3): Vector3Tuple {
  return [v.x, v.y, v.z];
}

export function lerpVector3(
  a: Vector3Tuple,
  b: Vector3Tuple,
  t: number,
): Vector3Tuple {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
