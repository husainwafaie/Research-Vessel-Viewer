import * as THREE from 'three';

/**
 * Single source of truth for sun position.
 * Imported by VesselSky, Ocean, and Lighting so they all agree.
 *
 * Azimuth 45° (NE) + elevation 50° keeps the sun well overhead
 * and roughly behind the default camera, so the vessel faces the
 * camera are front-lit from the overview angle.
 */
export const SUN_ELEVATION_DEG = 50;
export const SUN_AZIMUTH_DEG   = 45; // NE — aligns with default camera direction

function calcSunPosition(elevationDeg: number, azimuthDeg: number): THREE.Vector3 {
  const phi   = THREE.MathUtils.degToRad(90 - elevationDeg);
  const theta = THREE.MathUtils.degToRad(azimuthDeg);
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

export const SUN_POSITION  = calcSunPosition(SUN_ELEVATION_DEG, SUN_AZIMUTH_DEG);
export const SUN_DIRECTION = SUN_POSITION.clone().normalize();
