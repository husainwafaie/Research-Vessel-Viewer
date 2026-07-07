import { useEffect } from 'react';
import { useSceneStore } from '@store/scene.store';
import { useUIStore } from '@store/ui.store';
import { underwaterAudio } from '@lib/underwaterAudio';

/**
 * useUnderwaterAudio — binds the procedural soundscape to app state.
 *
 * - Entering underwater mode starts the engine. When the mode change comes
 *   from the Dive button, the zustand subscriber fires synchronously inside
 *   the click, satisfying the browser autoplay gesture requirement. When it
 *   comes from scrolling below the waterline (no gesture), the context
 *   starts suspended — a window pointerdown listener resumes it on the
 *   user's next interaction.
 * - Ambience level follows display depth: quiet just under the surface,
 *   full pressure-rumble at 60 m+.
 * - Mute state lives in ui.store (see the AppShell speaker toggle).
 *
 * Non-reactive by design: subscriptions update the engine directly without
 * re-rendering the host component (cameraDepth changes every frame).
 */
export function useUnderwaterAudio(): void {
  useEffect(() => {
    const levelFor = (mode: string, depth: number): number =>
      mode === 'underwater' ? 0.4 + 0.6 * Math.min(1, depth / 60) : 0;

    const unsubMode = useSceneStore.subscribe(
      (s) => s.cameraMode,
      (mode) => {
        if (mode === 'underwater') underwaterAudio.ensureStarted();
        const { cameraDepth } = useSceneStore.getState();
        underwaterAudio.setLevel(levelFor(mode, cameraDepth));
      },
    );

    const unsubDepth = useSceneStore.subscribe(
      (s) => s.cameraDepth,
      (depth) => {
        const { cameraMode } = useSceneStore.getState();
        underwaterAudio.setLevel(levelFor(cameraMode, depth));
      },
    );

    const unsubMuted = useUIStore.subscribe(
      (s) => s.audioMuted,
      (muted) => underwaterAudio.setMuted(muted),
    );
    underwaterAudio.setMuted(useUIStore.getState().audioMuted);

    // Recover from gesture-less dives (scroll below the waterline)
    const resume = () => underwaterAudio.resumeIfSuspended();
    window.addEventListener('pointerdown', resume);

    return () => {
      unsubMode();
      unsubDepth();
      unsubMuted();
      window.removeEventListener('pointerdown', resume);
    };
  }, []);
}
