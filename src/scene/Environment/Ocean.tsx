import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as THREE from 'three';
import { SUN_DIRECTION } from './sunConfig';

export function Ocean() {
  const waterNormals = useTexture('/textures/waternormals.jpg');
  const waterRef = useRef<Water | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    waterNormals.wrapS = THREE.RepeatWrapping;
    waterNormals.wrapT = THREE.RepeatWrapping;

    const waterGeometry = new THREE.PlaneGeometry(20000, 20000);

    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: SUN_DIRECTION, // now matches VesselSky and Lighting
      sunColor: 0xfff0d0,
      waterColor: 0x001428,
      distortionScale: 3.0,
      fog: true,
    });

    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    water.renderOrder = 0;

    scene.add(water);
    waterRef.current = water;

    return () => {
      scene.remove(water);
      waterGeometry.dispose();
    };
  }, [scene, waterNormals]);

  useFrame((_, delta) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.ShaderMaterial;
    mat.uniforms['time'].value += delta * 0.35;
  });

  return null;
}
