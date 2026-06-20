import * as THREE from 'three';

/**
 * Single source of truth for sun position.
 * Imported by VesselSky, Ocean, and Lighting so they all agree.
 */
export const SUN_ELEVATION_DEG = 28; // degrees above horizon
export const SUN_AZIMUTH_DEG   = 90; // East — perpendicular to NE camera, sky looks blue

function calcSunPosition(elevationDeg: number, azimuthDeg: number): THREE.Vector3 {
  const phi   = THREE.MathUtils.degToRad(90 - elevationDeg);
  const theta = THREE.MathUtils.degToRad(azimuthDeg);
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

export const SUN_POSITION = calcSunPosition(SUN_ELEVATION_DEG, SUN_AZIMUTH_DEG);
// For Three.js Water (expects normalised direction vector)
export const SUN_DIRECTION = SUN_POSITION.clone().normalize();
