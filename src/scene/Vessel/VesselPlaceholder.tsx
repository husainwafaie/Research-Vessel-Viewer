/**
 * VesselPlaceholder — multi-part box silhouette standing in for the real GLTF model.
 *
 * Coordinate convention (matches future real vessel):
 *   Origin = midship at waterline
 *   +X = starboard, -X = port
 *   +Y = up, -Y = down (keel)
 *   +Z = bow, -Z = stern
 *
 * Waterline is y = 0. Parts below y=0 are obscured by the ocean plane,
 * which correctly implies the hull draft.
 *
 * This component is replaced wholesale in Milestone 1.4 (vessel model loaded).
 * No logic lives here — it's a visual placeholder only.
 */

import { useRef } from 'react';
import * as THREE from 'three';

const HULL_MATERIAL = {
  color: '#3a4f63',
  roughness: 0.8,
  metalness: 0.2,
} as const;

const SUPER_MATERIAL = {
  color: '#4f6478',
  roughness: 0.7,
  metalness: 0.25,
};

const EQUIP_MATERIAL = {
  color: '#6a7f90',
  roughness: 0.55,
  metalness: 0.4,
};

export function VesselPlaceholder() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {/* ── Hull ─────────────────────────────────────────────── */}
      {/* Main hull — 90m long, 14m beam, 8m depth. Center at y=1 so ~5m freeboard */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 8, 90]} />
        <meshStandardMaterial {...HULL_MATERIAL} />
      </mesh>

      {/* Slightly tapered bow fairing */}
      <mesh position={[0, 2.5, 42]} castShadow>
        <boxGeometry args={[12, 5, 8]} />
        <meshStandardMaterial {...HULL_MATERIAL} />
      </mesh>

      {/* ── Main Deck ─────────────────────────────────────────── */}
      <mesh position={[0, 5.2, 0]} receiveShadow>
        <boxGeometry args={[14.5, 0.4, 90]} />
        <meshStandardMaterial color="#2a3545" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* ── Helipad (forward) ─────────────────────────────────── */}
      <mesh position={[0, 5.6, 32]} receiveShadow>
        <boxGeometry args={[13, 0.3, 22]} />
        <meshStandardMaterial color="#1e2a35" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Helipad H marking (inset slightly) */}
      <mesh position={[0, 5.85, 32]}>
        <boxGeometry args={[6, 0.05, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} opacity={0.6} transparent />
      </mesh>

      {/* ── Superstructure ────────────────────────────────────── */}
      {/* Main superstructure block */}
      <mesh position={[0, 9, -2]} castShadow>
        <boxGeometry args={[13, 8, 28]} />
        <meshStandardMaterial {...SUPER_MATERIAL} />
      </mesh>

      {/* Bridge deck */}
      <mesh position={[0, 14, 0]} castShadow>
        <boxGeometry args={[12.5, 4, 16]} />
        <meshStandardMaterial {...SUPER_MATERIAL} />
      </mesh>

      {/* Bridge windows — subtle darker band */}
      <mesh position={[0, 14.8, 8.1]}>
        <boxGeometry args={[12, 1.8, 0.2]} />
        <meshStandardMaterial color="#0a1420" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Bridge wing port */}
      <mesh position={[-7, 14, 0]} castShadow>
        <boxGeometry args={[2, 0.3, 6]} />
        <meshStandardMaterial {...SUPER_MATERIAL} />
      </mesh>

      {/* Bridge wing starboard */}
      <mesh position={[7, 14, 0]} castShadow>
        <boxGeometry args={[2, 0.3, 6]} />
        <meshStandardMaterial {...SUPER_MATERIAL} />
      </mesh>

      {/* ── Radar / Communications Mast ───────────────────────── */}
      <mesh position={[0, 22, 1]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 12, 8]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      {/* Radar dish / scanner */}
      <mesh position={[0, 28.5, 1]} castShadow>
        <boxGeometry args={[6, 0.5, 1.5]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      {/* Secondary antenna */}
      <mesh position={[0, 31, 1]}>
        <cylinderGeometry args={[0.08, 0.08, 5, 6]} />
        <meshStandardMaterial color="#718096" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* ── Crane (mid-deck, starboard) ───────────────────────── */}
      {/* Crane base */}
      <mesh position={[5, 7.5, -12]} castShadow>
        <cylinderGeometry args={[0.8, 1, 4, 8]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      {/* Crane boom */}
      <mesh position={[5, 12, -12]} rotation={[0, 0, Math.PI * 0.15]} castShadow>
        <boxGeometry args={[0.6, 14, 0.6]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      {/* ── A-Frame (stern) ───────────────────────────────────── */}
      <mesh position={[-4, 11, -40]} rotation={[0, 0, Math.PI * 0.12]} castShadow>
        <boxGeometry args={[0.6, 14, 0.6]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      <mesh position={[4, 11, -40]} rotation={[0, 0, -Math.PI * 0.12]} castShadow>
        <boxGeometry args={[0.6, 14, 0.6]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      {/* A-Frame crossbar */}
      <mesh position={[0, 17, -40]} castShadow>
        <boxGeometry args={[9, 0.5, 0.5]} />
        <meshStandardMaterial {...EQUIP_MATERIAL} />
      </mesh>

      {/* ── ROV Bay Doors (port stern) ────────────────────────── */}
      <mesh position={[-7.2, 6, -28]} castShadow>
        <boxGeometry args={[0.3, 5, 10]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* ── Funnel / Exhaust ──────────────────────────────────── */}
      <mesh position={[0, 17, -14]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 5, 12]} />
        <meshStandardMaterial color="#1a2530" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}
