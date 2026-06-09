export interface AnimationConfig {
  duration: number;
  easing?: (t: number) => number;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export function animate(config: AnimationConfig): () => void {
  const { duration, easing = (t) => t, onUpdate, onComplete } = config;
  const start = performance.now();
  let rafId: number;

  function tick(now: number) {
    const elapsed = now - start;
    const raw = Math.min(elapsed / duration, 1);
    const progress = easing(raw);

    onUpdate(progress);

    if (raw < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
