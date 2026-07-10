import { motion, AnimatePresence } from 'framer-motion';
import { useTourStore } from '@store/tour.store';
import { getComponentById } from '@domain/selectors';
import { vessel } from '@data/vessel';

/**
 * TourPanel — bottom-centre DOM overlay shown while a tour is active.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │▓▓▓▓▓▓▓░░░░  ← progress bar (CSS anim)    │
 *   │  Ocean Mapping Mission  ● ● ○ ○ ○  ✕ Exit│
 *   │  Component Name                           │
 *   │  Narration text…                          │
 *   │  ← Previous    ⏸/▶     Next →            │
 *   └──────────────────────────────────────────┘
 *
 * The progress bar uses a CSS animation (`animation-play-state`) so it
 * freezes naturally when the tour is paused without a React re-render.
 * Keyed on `currentStepIndex` so it restarts each step transition.
 */
export function TourPanel() {
  const activeTour       = useTourStore((s) => s.activeTour);
  const currentStepIndex = useTourStore((s) => s.currentStepIndex);
  const isPlaying        = useTourStore((s) => s.isPlaying);
  const nextStep         = useTourStore((s) => s.nextStep);
  const previousStep     = useTourStore((s) => s.previousStep);
  const pauseTour        = useTourStore((s) => s.pauseTour);
  const resumeTour       = useTourStore((s) => s.resumeTour);
  const exitTour         = useTourStore((s) => s.exitTour);

  return (
    <AnimatePresence>
      {activeTour && (() => {
        const step      = activeTour.steps[currentStepIndex];
        const component = step?.componentId
          ? (getComponentById(vessel, step.componentId) ?? null)
          : null;
        // Camera steps carry their own heading; component steps use the name
        const stepHeading = component?.name ?? step?.title ?? null;
        const isFirst   = currentStepIndex === 0;
        const isLast    = currentStepIndex === activeTour.steps.length - 1;
        // Tour is "complete" when it has played through and isPlaying stopped at last step
        const isComplete = isLast && !isPlaying;

        return (
          <motion.div
            key="tour-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto z-20"
            style={{ width: 'min(680px, calc(100vw - 220px))' }}
            role="complementary"
            aria-label="Guided tour panel"
          >
            <div className="glass rounded-2xl overflow-hidden shadow-2xl">

              {/* ── Progress bar ──────────────────────────────────── */}
              <div className="h-0.5 bg-white/5 relative">
                <div
                  key={`progress-${currentStepIndex}`}
                  className="absolute inset-y-0 left-0 bg-ocean-400"
                  style={{
                    animationName: 'tour-progress',
                    animationDuration: `${step?.dwellMs ?? 6000}ms`,
                    animationTimingFunction: 'linear',
                    animationFillMode: 'forwards',
                    animationPlayState: isPlaying && !isComplete ? 'running' : 'paused',
                    width: isComplete ? '100%' : undefined,
                  }}
                />
              </div>

              <div className="px-6 py-4">

                {/* ── Header row: tour name + step dots + exit ─────── */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-data text-ocean-500 text-xs uppercase tracking-widest shrink-0">
                      {activeTour.name}
                    </span>

                    {/* Step indicator dots */}
                    <div className="flex items-center gap-1" role="tablist" aria-label="Tour steps">
                      {activeTour.steps.map((_, i) => (
                        <div
                          key={i}
                          role="tab"
                          aria-selected={i === currentStepIndex}
                          aria-label={`Step ${i + 1}`}
                          className={`rounded-full transition-all duration-300 ${
                            i === currentStepIndex
                              ? 'w-4 h-1.5 bg-ocean-400'
                              : i < currentStepIndex
                              ? 'w-1.5 h-1.5 bg-ocean-600'
                              : 'w-1.5 h-1.5 bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={exitTour}
                    className="text-ocean-600 hover:text-ocean-300 transition-colors text-xs ml-4 shrink-0"
                    aria-label="Exit guided tour"
                  >
                    ✕ Exit tour
                  </button>
                </div>

                {/* ── Narration area — cross-fades between steps ────── */}
                <div className="min-h-[4.5rem]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      {stepHeading && (
                        <p className="text-xs text-ocean-400 font-medium mb-1.5 uppercase tracking-wide">
                          {stepHeading}
                        </p>
                      )}
                      <p className="text-sm text-ocean-100 leading-relaxed">
                        {step?.narration}
                      </p>
                      {isComplete && (
                        <p className="text-xs text-ocean-500 mt-2 italic">
                          Tour complete — exit or restart from the beginning.
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── Controls row ──────────────────────────────────── */}
                <div className="flex items-center justify-between mt-4">

                  {/* Previous */}
                  <button
                    onClick={previousStep}
                    disabled={isFirst}
                    className="flex items-center gap-1.5 text-xs text-ocean-400 hover:text-white
                               disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous step"
                  >
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                      <path d="M5 1L1 5l4 4M1 5h10" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Previous
                  </button>

                  {/* Pause / Play toggle */}
                  <button
                    onClick={isPlaying ? pauseTour : resumeTour}
                    disabled={isComplete}
                    className="glass-light rounded-full w-9 h-9 flex items-center justify-center
                               text-ocean-300 hover:text-white disabled:opacity-25
                               disabled:cursor-not-allowed transition-colors"
                    aria-label={isPlaying ? 'Pause tour' : 'Resume tour'}
                  >
                    {isPlaying ? (
                      /* Pause icon */
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                        <rect x="0"   y="0" width="3.5" height="12" rx="1" fill="currentColor" />
                        <rect x="6.5" y="0" width="3.5" height="12" rx="1" fill="currentColor" />
                      </svg>
                    ) : (
                      /* Play icon */
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                        <polygon points="0,0 10,6 0,12" fill="currentColor" />
                      </svg>
                    )}
                  </button>

                  {/* Next */}
                  <button
                    onClick={nextStep}
                    disabled={isLast}
                    className="flex items-center gap-1.5 text-xs text-ocean-400 hover:text-white
                               disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next step"
                  >
                    Next
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                      <path d="M7 1l4 4-4 4M11 5H1" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
