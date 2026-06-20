import { SUN_POSITION } from './sunConfig';

const SUN_LIGHT_POSITION = SUN_POSITION.clone().multiplyScalar(400);

export function Lighting() {
  return (
    <>
      {/* Sky / ground ambient — blue-grey sky bounce */}
      <hemisphereLight args={[0xa8c8e0, 0x0c1a28, 2.0]} />

      {/* Deep shadow fill */}
      <ambientLight intensity={0.4} color={0x3060a0} />

      {/* Primary sun — golden afternoon, casts shadows */}
      <directionalLight
        position={[SUN_LIGHT_POSITION.x, SUN_LIGHT_POSITION.y, SUN_LIGHT_POSITION.z]}
        intensity={5.0}
        color={0xffd090}
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

      {/* Water-bounce fill — cool blue tint on underside of hull */}
      <directionalLight
        position={[0, -20, 0]}
        intensity={0.3}
        color={0x2060c0}
      />
    </>
  );
}
