import { ComponentPanel } from '@ui/panels/ComponentPanel';
import { SystemsSidebar } from '@ui/panels/SystemsSidebar';
import { TourPanel } from '@ui/panels/TourPanel';
import { DepthGauge } from '@ui/panels/DepthGauge';
import { useUIStore } from '@store/ui.store';
import { useComponentFocus } from '@hooks/useComponentFocus';
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';
import { allTours } from '@data/tours';
import { useTourStore } from '@store/tour.store';
import { useSceneStore } from '@store/scene.store';

/**
 * AppShell — DOM UI layer composited over the 3D canvas.
 *
 * pointer-events:none by default — interactive children re-enable with
 * pointer-events:auto so mouse events pass through to the canvas everywhere else.
 *
 * Layout during normal browsing:
 *   Header (vessel name + Overview/Tour buttons)
 *   SystemsSidebar (left)
 *   ComponentPanel (right, when component selected)
 *   Footer hint
 *
 * Layout during tour:
 *   Header (vessel name + Exit button suppressed — use TourPanel ✕)
 *   SystemsSidebar (left, dims to show which system is active)
 *   TourPanel (bottom-centre, owns narration + controls)
 *   ComponentPanel suppressed (TourPanel takes that role)
 *   Footer hint replaced with tour prompt
 */
export function AppShell() {
  const activePanel        = useUIStore((s) => s.activePanel);
  const sidebarExpanded    = useUIStore((s) => s.sidebarExpanded);
  const toggleSidebar      = useUIStore((s) => s.toggleSidebar);
  const { selectedId }     = useComponentFocus();
  const startTour          = useTourStore((s) => s.startTour);
  const activeTour         = useTourStore((s) => s.activeTour);
  const resetCamera        = useSceneStore((s) => s.resetCamera);
  const clearSelection     = useSceneStore((s) => s.clearSelection);
  const closePanel         = useUIStore((s) => s.closePanel);
  const enterUnderwater    = useSceneStore((s) => s.enterUnderwater);
  const exitUnderwater     = useSceneStore((s) => s.exitUnderwater);
  const isUnderwater       = useSceneStore((s) => s.cameraMode === 'underwater');

  const isTourActive = activeTour !== null;

  // Global keyboard shortcuts: Escape, Arrow keys, Space
  useKeyboardShortcuts();

  function handleReset() {
    clearSelection();
    closePanel();
    resetCamera({ position: [80, 30, 120], target: [0, 5, 0], fov: 50 });
  }

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none select-none"
      role="application"
      aria-label="R/V Pelagic Horizon — Interactive Explorer"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 flex items-start justify-between p-4">
        <div className="flex items-start gap-3 pointer-events-auto">
          {/* Mobile systems toggle — hidden on md+ where sidebar is always visible */}
          {!isTourActive && (
            <button
              onClick={toggleSidebar}
              className="md:hidden glass rounded-lg p-2 mt-0.5 text-ocean-400 hover:text-white transition-colors shrink-0"
              aria-label={sidebarExpanded ? 'Close systems panel' : 'Open systems panel'}
              aria-expanded={sidebarExpanded}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <rect y="1" width="14" height="1.5" rx="0.75" fill="currentColor" />
                <rect y="6.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
                <rect y="11.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
          )}
          <div>
            <div className="text-data text-ocean-500 text-xs uppercase tracking-widest mb-0.5">
              Oceanographic Research Vessel
            </div>
            <h1 className="text-white text-lg font-light tracking-wide leading-none">
              R/V Pelagic Horizon
            </h1>
          </div>
        </div>

        {/* ── Top-right controls ──────────────────────────── */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Reset camera — hidden during tour (use Exit tour instead) */}
          {selectedId && !isTourActive && (
            <button
              onClick={handleReset}
              className="glass rounded-lg px-3 py-1.5 text-xs text-ocean-300 hover:text-white transition-colors flex items-center gap-1.5"
              aria-label="Reset camera to overview"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 6a5 5 0 1 0 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Overview
            </button>
          )}

          {/* Dive / Surface toggle — hidden during tour */}
          {!isTourActive && (
            isUnderwater ? (
              <button
                onClick={exitUnderwater}
                className="glass rounded-lg px-3 py-1.5 text-xs text-cyan-300 hover:text-white transition-colors flex items-center gap-1.5"
                aria-label="Surface — return to above-water view"
              >
                {/* Up arrow */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Surface
              </button>
            ) : (
              <button
                onClick={enterUnderwater}
                className="glass rounded-lg px-3 py-1.5 text-xs text-ocean-300 hover:text-white transition-colors flex items-center gap-1.5"
                aria-label="Dive — explore beneath the hull"
              >
                {/* Down arrow */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Dive
              </button>
            )
          )}

          {/* Tour launcher — hidden while tour is running or underwater */}
          {!isTourActive && !isUnderwater && (
            <button
              onClick={() => startTour(allTours[0])}
              className="glass rounded-lg px-3 py-1.5 text-xs text-ocean-300 hover:text-white transition-colors flex items-center gap-1.5"
              aria-label="Start guided tour"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polygon points="3,1 11,6 3,11" fill="currentColor" />
              </svg>
              Guided Tour
            </button>
          )}
        </div>
      </header>

      {/* ── Left: Systems navigation sidebar ───────────────── */}
      {/*
        * Remains visible during tour — active system is highlighted,
        * giving users context about which part of the vessel is featured.
        * pointer-events are disabled during tour so clicks don't interrupt.
        */}
      <div className={isTourActive ? 'pointer-events-none opacity-50' : ''}>
        <SystemsSidebar />
      </div>

      {/* ── Right: Component detail panel ─────────────────────
        * Suppressed during tour — TourPanel owns the narration role.
        */}
      {activePanel === 'component' && !isTourActive && (
        <ComponentPanel />
      )}

      {/* ── Bottom-centre: Tour panel (AnimatePresence handles mount/exit) */}
      <TourPanel />

      {/* ── Bottom-right: Depth gauge — visible in underwater mode only */}
      <DepthGauge />

      {/* ── Bottom: Controls hint + attribution ─────────────── */}
      <footer className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
        <div className="glass rounded-full px-4 py-1.5 flex items-center gap-3 text-xs text-ocean-500 text-data">
          {isTourActive ? (
            <>
              <span>← → navigate</span>
              <span className="text-ocean-700">·</span>
              <span>Space pause</span>
              <span className="text-ocean-700">·</span>
              <span>Esc exit</span>
            </>
          ) : isUnderwater ? (
            <>
              <span>Drag to orbit hull</span>
              <span className="text-ocean-700">·</span>
              <span>Scroll to zoom</span>
              <span className="text-ocean-700">·</span>
              <span>Surface to return</span>
            </>
          ) : (
            <>
              <span>Drag to orbit</span>
              <span className="text-ocean-700">·</span>
              <span>Scroll to zoom</span>
              <span className="text-ocean-700">·</span>
              <span>Click marker to explore</span>
              <span className="text-ocean-700">·</span>
              <span>Esc to reset</span>
            </>
          )}
        </div>

        {/* CC attribution — required by the vessel model licence (CC BY 4.0) */}
        <p className="text-data text-ocean-800 text-xs pointer-events-auto">
          3D model:{' '}
          <a
            href="https://skfb.ly/6tpP9"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ocean-500 transition-colors underline underline-offset-2"
          >
            RCRV
          </a>{' '}
          by{' '}
          <a
            href="https://sketchfab.com/alan.dennis"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ocean-500 transition-colors underline underline-offset-2"
          >
            Alan Dennis
          </a>{' '}
          ·{' '}
          <a
            href="http://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ocean-500 transition-colors underline underline-offset-2"
          >
            CC BY 4.0
          </a>
        </p>
      </footer>
    </div>
  );
}
