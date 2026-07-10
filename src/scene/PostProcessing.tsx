import { EffectComposer, Bloom, DepthOfField, Vignette, WaterEffect } from '@react-three/postprocessing';
import { useSceneStore } from '@store/scene.store';

/**
 * PostProcessing — all post-processing passes for the main scene.
 *
 * Lives inside the R3F Canvas so it can read the scene store and vary
 * parameters based on camera mode without lifting state outside the canvas.
 *
 * Passes:
 *   Bloom          — always on; lower threshold (0.70) catches emissive pulse
 *   Vignette       — always on; subtle edge darkening for cinematic feel
 *   DepthOfField   — active in 'focused' mode; bokehScale=0 prevents rebuild
 *   WaterEffect    — active underwater only; UV-warp distortion that makes
 *                    the scene shimmer as if seen through moving water.
 *                    factor=0 → disabled, factor=0.55 → moderate warp.
 *                    The built-in effect uses time + cos/sin on UV coords.
 */
export function PostProcessing() {
  const isFocused    = useSceneStore((s) => s.cameraMode === 'focused');
  const isUnderwater = useSceneStore((s) => s.isSubmerged);

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={isUnderwater ? 0.50 : 0.70}
        luminanceSmoothing={0.85}
        intensity={isUnderwater ? 0.90 : 0.55}
        mipmapBlur
      />

      <Vignette
        eskil={false}
        offset={isUnderwater ? 0.20 : 0.38}
        darkness={isUnderwater ? 0.88 : 0.68}
      />

      <DepthOfField
        focusDistance={0.008}
        focalLength={0.018}
        bokehScale={isFocused ? 2.5 : 0}
      />

      {/* Screen-space water warp — factor=0 is a true no-op (amplitude=0),
          so we always mount it and avoid pipeline rebuilds on mode switch.
          factor=0.55 underwater → visible UV warp without nausea. */}
      <WaterEffect factor={isUnderwater ? 0.55 : 0} />
    </EffectComposer>
  );
}
