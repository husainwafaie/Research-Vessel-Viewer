import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * createFishGeometry — procedural fish mesh: a lathed body plus a flat
 * tail-fin quad, merged into one BufferGeometry (~90 triangles).
 *
 * Local-space convention (matters for orientation and animation):
 *   +Z = head, −Z = tail. Object3D.lookAt() aims the +Z axis, so a scratch
 *   dummy can orient every instance along its swim direction in one call.
 *   X = lateral (flattened), Y = dorsal/ventral.
 *
 * @param length body length nose→tail in local units (uniform-scaled per fish)
 * @param height maximum body height in local units
 */
export function createFishGeometry(
  length: number,
  height: number,
): THREE.BufferGeometry {
  const half = length / 2;
  const r = height / 2;

  // Lathe profile along +Y: tail (−half) → nose (+half); x is the radius.
  // Fattest point sits ~35% back from the nose; the caudal peduncle
  // (tail stem) pinches nearly closed before the fin.
  const profile = [
    new THREE.Vector2(0.015 * r, -half),        // tail tip
    new THREE.Vector2(0.18 * r, -half * 0.6),   // caudal peduncle
    new THREE.Vector2(0.72 * r, -half * 0.1),   // rear body
    new THREE.Vector2(1.0 * r, half * 0.3),     // fattest point
    new THREE.Vector2(0.55 * r, half * 0.75),   // head taper
    new THREE.Vector2(0.02 * r, half),          // nose
  ];

  const body = new THREE.LatheGeometry(profile, 8);
  body.rotateX(Math.PI / 2); // lathe axis +Y → +Z, head now at +Z
  body.scale(0.38, 1, 1);    // flatten laterally — fish are tall, not round

  // Tail fin: flat quad in the YZ plane just behind the peduncle.
  // PlaneGeometry starts in the XY plane; rotateY(π/2) stands it up.
  const fin = new THREE.PlaneGeometry(length * 0.22, height * 1.4);
  fin.rotateY(Math.PI / 2);
  fin.translate(0, 0, -half - length * 0.08);

  const merged = mergeGeometries([body, fin]);
  merged.computeBoundingSphere();
  return merged;
}
