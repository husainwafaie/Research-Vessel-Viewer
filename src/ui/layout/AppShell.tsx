/**
 * AppShell — DOM UI layer composited over the 3D canvas.
 *
 * Structure (current — expands with each milestone):
 *   AppShell
 *   ├── Header (title + milestone badge)      ← this milestone
 *   ├── SystemsSidebar                         ← Milestone 1.8
 *   ├── ComponentPanel                         ← Milestone 1.7
 *   ├── TourPanel                              ← Milestone 1.9
 *   └── CameraHUD (reset, controls legend)    ← Milestone 1.7
 *
 * Important: this div must be pointer-events:none by default so mouse
 * events pass through to the canvas. Individual interactive UI elements
 * re-enable pointer-events with pointer-events:auto.
 */
export function AppShell() {
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none select-none"
      aria-label="Research Vessel Explorer UI"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto">
          <div className="text-data text-ocean-500 text-xs uppercase tracking-widest mb-0.5">
            Oceanographic Research Vessel
          </div>
          <h1 className="text-white text-lg font-light tracking-wide leading-none">
            R/V Pelagic Horizon
          </h1>
        </div>

        <div className="text-data text-ocean-600 text-xs text-right">
          <div>Deep-Sea Research Vessel Explorer</div>
          <div className="text-ocean-700">Milestone 1.2 — Environment</div>
        </div>
      </header>

      {/* ── Controls hint (bottom center) ───────────────────── */}
      <footer className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="glass rounded-full px-4 py-1.5 flex items-center gap-3 text-xs text-ocean-400 text-data">
          <span>Drag to orbit</span>
          <span className="text-ocean-700">·</span>
          <span>Scroll to zoom</span>
          <span className="text-ocean-700">·</span>
          <span>Right-drag to pan</span>
        </div>
      </footer>
    </div>
  );
}
