import { useMemo, useState } from 'react';
import { Scene } from '@scene/Scene';
import { AppShell } from '@ui/layout/AppShell';
import { LoadingScreen } from '@ui/layout/LoadingScreen';
import { AppErrorBoundary } from '@ui/layout/AppErrorBoundary';
import { FallbackScreen } from '@ui/layout/FallbackScreen';
import { isWebGLSupported } from '@lib/webgl';

/**
 * App — root composition.
 *
 * Layer order (bottom → top):
 *   1. Scene (R3F Canvas, z-0) — fills the viewport, pointer events pass
 *      through where no interactive UI element is present
 *   2. AppShell (DOM UI, z-10) — absolute overlay, pointer-events:none root
 *   3. LoadingScreen (z-50) — covers both layers until the scene is ready,
 *      then fades out via AnimatePresence
 *
 * Failure states:
 *   - No WebGL → FallbackScreen replaces the app entirely (checked once;
 *     support can't change without a reload anyway)
 *   - GPU context lost → recovery overlay until the context restores
 *   - Render error anywhere → AppErrorBoundary catches and offers reload
 *
 * Nothing else belongs here. State, data, and logic live in stores and hooks.
 */
export default function App() {
  const webglSupported = useMemo(isWebGLSupported, []);
  const [contextLost, setContextLost] = useState(false);

  if (!webglSupported) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#020c1b]">
        <FallbackScreen variant="unsupported" />
      </div>
    );
  }

  return (
    <AppErrorBoundary variant={contextLost ? 'context-lost' : 'error'}>
      <div className="relative h-full w-full overflow-hidden bg-[#020c1b]">
        {/*
         * Skip link — visually hidden until focused via Tab key.
         * Allows keyboard users to jump straight to the systems navigation
         * without tabbing through the 3D canvas context first.
         */}
        <a
          href="#systems-nav"
          className="
            sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60]
            focus:glass focus:rounded-lg focus:px-3 focus:py-1.5 focus:text-xs
            focus:text-ocean-300 focus:pointer-events-auto
          "
        >
          Skip to systems navigation
        </a>

        <Scene
          onContextLost={() => setContextLost(true)}
          onContextRestored={() => setContextLost(false)}
        />
        <AppShell />
        <LoadingScreen />

        {contextLost && <FallbackScreen variant="context-lost" />}
      </div>
    </AppErrorBoundary>
  );
}
