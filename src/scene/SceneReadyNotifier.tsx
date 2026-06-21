import { useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { useUIStore } from '@store/ui.store';

/**
 * SceneReadyNotifier — lives inside the Canvas, outside Suspense.
 *
 * Bridges the Three.js DefaultLoadingManager (tracked by useProgress) into
 * the UI store so the DOM-layer LoadingScreen can react to load progress and
 * fade out when the scene is ready.
 *
 * Dismiss logic:
 *   - Scene is "ready" when useProgress reports !active && progress >= 100,
 *     OR after a 5 s wall-clock fallback (guards procedural assets like Sky
 *     and Water that never fire DefaultLoadingManager events).
 *   - A MINIMUM_DISPLAY_MS floor ensures the loading animation is always
 *     visible long enough for portfolio visitors to register it, even on
 *     very fast connections where assets are already cached.
 */

const MINIMUM_DISPLAY_MS = 1500; // always show the loading screen for at least this long

export function SceneReadyNotifier() {
  const { active, progress } = useProgress();
  const setLoading         = useUIStore((s) => s.setLoading);
  const setLoadingProgress = useUIStore((s) => s.setLoadingProgress);

  // Wall-clock timestamp of when this component mounted (≈ scene init time)
  const mountedAtMs = useRef(Date.now());

  // Helper: dismiss after honoring the minimum display floor
  const dismiss = (delayMs = 0) => {
    const elapsed  = Date.now() - mountedAtMs.current;
    const waitMore = Math.max(0, MINIMUM_DISPLAY_MS - elapsed);
    const t = setTimeout(() => setLoading(false), waitMore + delayMs);
    return () => clearTimeout(t);
  };

  // Mirror Three.js load progress into the store
  useEffect(() => {
    setLoadingProgress(progress);

    if (!active && progress >= 100) {
      // Brief extra pause lets the first rendered frame appear so the canvas
      // isn't blank the instant the overlay fades out.
      return dismiss(300);
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, progress]);

  // Fallback: always dismiss after 5 s (hard ceiling — never stuck indefinitely)
  useEffect(() => {
    return dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
