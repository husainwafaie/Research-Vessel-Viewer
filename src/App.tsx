import { Scene } from '@scene/Scene';
import { AppShell } from '@ui/layout/AppShell';

/**
 * App — root composition.
 *
 * Two children, always in this order:
 *   1. Scene (R3F Canvas) — fills the viewport, pointer events pass through
 *      where no interactive UI element is present
 *   2. AppShell (DOM UI) — absolute overlay, pointer-events:none by default
 *
 * Nothing else belongs here. State, data, and logic live in stores and hooks.
 */
export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-ocean-950">
      <Scene />
      <AppShell />
    </div>
  );
}
