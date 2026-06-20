/**
 * Atmosphere — fog and background color.
 *
 * Using FogExp2 (exponential falloff) rather than linear Fog:
 * - More natural for open water where haze accumulates non-linearly
 * - Less obvious "fog wall" at the far clip distance
 *
 * Density tuning:
 * - 0.0005 — very clear, horizon visible at ~2km
 * - 0.0010 — moderate haze, realistic ocean atmosphere
 * - 0.0020 — thick haze, dramatic close-in feel
 */
export function Atmosphere() {
  return (
    <>
      {/* Deep ocean midnight-blue as canvas background (visible before Sky loads) */}
      <color attach="background" args={['#020c1b']} />

      {/* Exponential fog — color matches horizon haze in VesselSky golden hour */}
      <fogExp2 attach="fog" color="#0a1828" density={0.0007} />
    </>
  );
}
