import { useSceneStore } from '@store/scene.store';

/**
 * Atmosphere — fog and background color.
 *
 * Surface mode  (cameraMode !== 'underwater'):
 *   FogExp2 density 0.0007 — moderate ocean haze, horizon visible at ~1.4 km
 *   Background #020c1b — deep midnight ocean blue
 *
 * Underwater mode (cameraMode === 'underwater'):
 *   FogExp2 density 0.028 — dense, light scatters over a few dozen metres
 *   Background #000a14 — near-black abyss
 *   Color #011520 — deep bioluminescent blue-green tint
 *
 * R3F reconciles JSX prop changes into Three.js object mutations so we get
 * smooth instant switching without needing imperative scene.fog assignments.
 */
export function Atmosphere() {
  const isUnderwater = useSceneStore((s) => s.cameraMode === 'underwater');

  return (
    <>
      <color
        attach="background"
        args={[isUnderwater ? '#000a14' : '#020c1b']}
      />
      <fogExp2
        attach="fog"
        color={isUnderwater ? '#011520' : '#0a1828'}
        density={isUnderwater ? 0.028 : 0.0007}
      />
    </>
  );
}
