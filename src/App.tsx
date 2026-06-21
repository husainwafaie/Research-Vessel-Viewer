import { Scene } from '@scene/Scene';
import { AppShell } from '@ui/layout/AppShell';
import { LoadingScreen } from '@ui/layout/LoadingScreen';

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
 * Nothing else belongs here. State, data, and logic live in stores and hooks.
 */
export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020c1b]">
      <Scene />
      <AppShell />
      <LoadingScreen />
    </div>
  );
}
