import { SUN_POSITION } from './sunConfig';

const SUN_LIGHT_POSITION = SUN_POSITION.clone().multiplyScalar(400);

export function Lighting() {
  return (
    <>
      {/*
       * Hemisphere light — sky / ground ambient.
       * High intensity ensures no face of the placeholder is pitch-black.
       * Will be tuned down when real PBR vessel model provides its own
       * ambient occlusion and lightmap data.
       */}
      <hemisphereLight args={[0xb0cce0, 0x1a2e40, 2.5]} />

      {/* Ambient fill — prevents completely black shadows */}
      <ambientLight intensity={0.6} color={0x4070a0} />

      {/*
       * Primary sun — positioned NE and high (50° elevation).
       * Azimuth 45° (NE) means the default camera (also NE) looks
       * toward a front-lit vessel.
       */}
      <directionalLight
        position={[SUN_LIGHT_POSITION.x, SUN_LIGHT_POSITION.y, SUN_LIGHT_POSITION.z]}
        intensity={3.5}
        color={0xfff0c8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={1000}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={100}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />

      {/*
       * Soft fill from the opposite side (SW + low).
       * Ensures shadow faces on the placeholder still read as grey,
       * not pure black. Intensity reduced for the real model.
       */}
      <directionalLight
        position={[-200, 60, -200]}
        intensity={1.2}
        color={0x6090c0}
      />

      {/* Water-bounce — cool upward fill on hull underside */}
      <directionalLight
        position={[0, -30, 0]}
        intensity={0.4}
        color={0x2060c0}
      />
    </>
  );
}
