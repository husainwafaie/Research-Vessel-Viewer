import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@store/ui.store';

/**
 * LoadingScreen — full-viewport overlay shown while the 3D scene initialises.
 *
 * Visual design:
 *   - Three concentric sonar rings that pulse outward with staggered delays,
 *     evoking the multibeam sonar that defines the vessel's research mission.
 *   - Vessel name + class label in the scene's typographic style.
 *   - Progress bar driven by Three.js DefaultLoadingManager via the UI store.
 *   - AnimatePresence fades the whole overlay out once isLoading becomes false.
 *
 * z-index 50 keeps it above the Canvas (z-0) and AppShell (z-10).
 */
export function LoadingScreen() {
  const isLoading      = useUIStore((s) => s.isLoading);
  const loadingProgress = useUIStore((s) => s.loadingProgress);

  // Clamp progress to at least 8% so the bar is always visible on first paint
  const barWidth = Math.max(loadingProgress, 8);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020c1b]"
          role="status"
          aria-label="Loading scene"
          aria-live="polite"
        >
          {/* ── Sonar ring animation ───────────────────────── */}
          <div className="relative w-28 h-28 mb-10 flex items-center justify-center">
            {/* Three rings with staggered delays */}
            {[0, 0.9, 1.8].map((delay, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-ocean-600/50"
                style={{
                  animationName: 'sonar-ring',
                  animationDuration: '2.7s',
                  animationTimingFunction: 'ease-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${delay}s`,
                }}
              />
            ))}

            {/* Static outer reference ring */}
            <div className="absolute inset-0 rounded-full border border-ocean-900" />

            {/* Centre vessel icon — simplified hull outline */}
            <svg
              width="36"
              height="20"
              viewBox="0 0 36 20"
              fill="none"
              className="text-ocean-600"
              aria-hidden
            >
              {/* Hull */}
              <path
                d="M2 14 C2 14 6 8 18 8 C30 8 34 14 34 14 L30 17 C30 17 24 19 18 19 C12 19 6 17 6 17 Z"
                fill="currentColor"
                fillOpacity="0.4"
                stroke="currentColor"
                strokeWidth="1"
              />
              {/* Superstructure */}
              <rect x="12" y="3" width="12" height="7" rx="1"
                fill="currentColor" fillOpacity="0.6" />
              {/* Mast */}
              <line x1="18" y1="3" x2="18" y2="0"
                stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>

          {/* ── Vessel identity ────────────────────────────── */}
          <p className="text-data text-ocean-600 text-xs uppercase tracking-widest mb-2">
            Oceanographic Research Vessel
          </p>
          <h1 className="text-white text-2xl font-light tracking-wide mb-8">
            R/V Pelagic Horizon
          </h1>

          {/* ── Progress bar ───────────────────────────────── */}
          <div className="w-52 h-px bg-ocean-900 relative overflow-hidden mb-3">
            <motion.div
              className="absolute inset-y-0 left-0 bg-ocean-500"
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          <p className="text-data text-ocean-700 text-xs tracking-widest">
            INITIALIZING SYSTEMS
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
