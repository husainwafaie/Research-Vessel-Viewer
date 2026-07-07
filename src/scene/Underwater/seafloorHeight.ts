/**
 * seafloorHeight — single source of truth for the seafloor terrain shape.
 *
 * The height field is defined once here in BOTH languages:
 *   - TERRAIN_GLSL: injected into the Seafloor vertex shader (GPU displaces
 *     the plane)
 *   - terrainHeight(): identical JS mirror so SeafloorScatter can sit rocks
 *     exactly on the displaced surface without reading back from the GPU
 *
 * The two implementations must stay formula-identical — the JS hash/noise
 * below mirror the GLSL line by line (GLSL fract() is x - floor(x), which
 * Math.floor reproduces for negatives too).
 */

/** Base plane height (world y) before displacement. */
export const FLOOR_Y = -55;

/** Coarse dune field: wavelength ~55 world units. */
export const DUNE_FREQ = 0.018;
export const DUNE_AMP = 5.0;

/** Fine ripple detail: wavelength ~17 world units. */
export const DETAIL_FREQ = 0.06;
export const DETAIL_AMP = 1.2;

/** Maximum terrain rise above FLOOR_Y (used for camera clamping). */
export const TERRAIN_MAX = DUNE_AMP + DETAIL_AMP;

/** GLSL: hash + value noise + terrainHeight(worldXZ) — world-space input. */
export const TERRAIN_GLSL = /* glsl */ `
  float terrainHash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
  float terrainNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(terrainHash(i),               terrainHash(i + vec2(1.0, 0.0)), f.x),
      mix(terrainHash(i + vec2(0.0, 1.0)), terrainHash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float terrainHeight(vec2 worldXZ) {
    return terrainNoise(worldXZ * ${DUNE_FREQ.toFixed(4)}) * ${DUNE_AMP.toFixed(2)}
         + terrainNoise(worldXZ * ${DETAIL_FREQ.toFixed(4)} + vec2(5.2, 1.3)) * ${DETAIL_AMP.toFixed(2)};
  }
`;

const fract = (x: number): number => x - Math.floor(x);

function hash(px: number, py: number): number {
  let hx = fract(px * 127.1);
  let hy = fract(py * 311.7);
  const d = hx * (hx + 19.19) + hy * (hy + 19.19);
  hx += d;
  hy += d;
  return fract(hx * hy);
}

function noise(px: number, py: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  let fx = px - ix;
  let fy = py - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a + (a - b + d - c) * fx) * fy;
}

/** Terrain rise above FLOOR_Y at a world XZ position (0 … TERRAIN_MAX). */
export function terrainHeight(worldX: number, worldZ: number): number {
  return (
    noise(worldX * DUNE_FREQ, worldZ * DUNE_FREQ) * DUNE_AMP +
    noise(worldX * DETAIL_FREQ + 5.2, worldZ * DETAIL_FREQ + 1.3) * DETAIL_AMP
  );
}
