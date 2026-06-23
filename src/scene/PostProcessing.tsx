import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import { useSceneStore } from '@store/scene.store';

/**
 * PostProcessing — all post-processing passes for the main scene.
 *
 * Lives inside the R3F Canvas so it can read the scene store and vary
 * parameters based on camera mode without lifting state outside the canvas.
 *
 * Passes:
 *   Bloom       — always on; lower threshold (0.70) catches the emissive
 *                 highlight pulse on selected meshes as well as the sky.
 *   Vignette    — always on; subtle edge darkening for cinematic feel.
 *   DepthOfField — active only in 'focused' mode; blurs scene background
 *                  while the selected component stays sharp.
 *
 * DepthOfField values:
 *   focusDistance  ≈ 0.008 → ~25 world-unit focus depth (near=0.5, far=6000)
 *   focalLength    = 0.018 → moderate depth of field falloff
 *   bokehScale     = 0 when inactive (no blur, no pipeline rebuild),
 *                  = 2.5 when focused (soft cinematic bokeh)
 */
export function PostProcessing() {
  const isFocused = useSceneStore((s) => s.cameraMode === 'focused');

  return (
    <EffectComposer>
      {/* Bloom — lower threshold so emissive pulse glows catch it */}
      <Bloom
        luminanceThreshold={0.70}
        luminanceSmoothing={0.85}
        intensity={0.55}
        mipmapBlur
      />

      {/* Vignette — subtle edge darkening */}
      <Vignette
        eskil={false}
        offset={0.38}
        darkness={0.68}
      />

      {/* Depth of field — bokehScale=0 is effectively a no-op, avoids
          rebuilding the effect pipeline on every selection toggle */}
      <DepthOfField
        focusDistance={0.008}
        focalLength={0.018}
        bokehScale={isFocused ? 2.5 : 0}
      />
    </EffectComposer>
  );
}
