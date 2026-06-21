import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vessel } from '@data/vessel';
import { CATEGORY_CONFIG } from '@data/categoryConfig';
import { useComponentFocus } from '@hooks/useComponentFocus';
import { useUIStore } from '@store/ui.store';

/**
 * SystemsSidebar — left-side navigation panel listing all vessel systems and
 * their components.
 *
 * Responsive behaviour:
 *   ≥ 768 px (md)  — always visible; sidebarExpanded state is ignored so
 *                    the panel never disappears on a desktop resize.
 *   < 768 px        — hidden by default; slides in from the left when
 *                    sidebarExpanded is true. Auto-closes when a component
 *                    is selected so the 3D canvas stays readable on mobile.
 *
 * The toggle button lives in AppShell's header so it sits in a consistent
 * position regardless of sidebar state.
 */
export function SystemsSidebar() {
  const { focus, selectedId } = useComponentFocus();
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useUIStore((s) => s.setSidebarExpanded);

  // Track which system sections are expanded (all open by default)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(vessel.systems.map((s) => s.id)),
  );

  // Detect mobile breakpoint
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // On mobile: auto-close sidebar when a component is selected
  useEffect(() => {
    if (isMobile && selectedId) {
      setSidebarExpanded(false);
    }
  }, [isMobile, selectedId, setSidebarExpanded]);

  // On desktop the sidebar is always visible; on mobile use the store flag
  const isVisible = !isMobile || sidebarExpanded;

  function toggleSystem(systemId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(systemId)) next.delete(systemId);
      else next.add(systemId);
      return next;
    });
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            id="systems-nav"
            className="absolute left-4 top-16 bottom-16 w-56 md:w-64 flex flex-col pointer-events-auto z-20"
            aria-label="Vessel systems navigation"
          >
            <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
              {/* ── Header ─────────────────────────────────────── */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="text-data text-ocean-500 text-xs uppercase tracking-widest">
                  Systems
                </div>
                {/* Close button — mobile only */}
                {isMobile && (
                  <button
                    onClick={() => setSidebarExpanded(false)}
                    className="text-ocean-600 hover:text-ocean-300 transition-colors -mr-1"
                    aria-label="Close systems panel"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* ── System list ──────────────────────────────────── */}
              <div className="overflow-y-auto flex-1 py-1">
                {vessel.systems.map((system) => {
                  const catCfg = CATEGORY_CONFIG[system.category];
                  const isOpen = expanded.has(system.id);

                  return (
                    <div key={system.id}>
                      {/* System header */}
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left group"
                        onClick={() => toggleSystem(system.id)}
                        aria-expanded={isOpen}
                        aria-controls={`system-${system.id}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: catCfg.color }}
                        />
                        <span className="text-xs text-ocean-200 group-hover:text-white transition-colors flex-1 leading-tight">
                          {system.name}
                        </span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          aria-hidden
                          className={`text-ocean-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <path d="M1.5 3.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {/* Component list */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            id={`system-${system.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {system.components.map((component) => {
                              const isSelected = selectedId === component.id;

                              return (
                                <button
                                  key={component.id}
                                  onClick={() => focus(component.id)}
                                  className={`
                                    w-full flex items-center gap-2 pl-8 pr-4 py-2 text-left
                                    transition-colors text-xs leading-tight
                                    ${isSelected
                                      ? 'text-white bg-white/[0.06] border-l-2'
                                      : 'text-ocean-400 hover:text-ocean-200 hover:bg-white/[0.02] border-l-2 border-transparent'
                                    }
                                  `}
                                  style={isSelected ? { borderLeftColor: catCfg.color } : undefined}
                                  aria-current={isSelected ? 'page' : undefined}
                                >
                                  <span
                                    className="w-1 h-1 rounded-full shrink-0"
                                    aria-hidden
                                    style={{ background: isSelected ? catCfg.color : 'currentColor' }}
                                  />
                                  {component.name}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* ── Footer ───────────────────────────────────────── */}
              <div className="px-4 py-2.5 border-t border-white/5">
                <div className="text-data text-ocean-700 text-xs">
                  {vessel.systems.reduce((n, s) => n + s.components.length, 0)} components
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile backdrop — tap outside to close */}
      <AnimatePresence>
        {isMobile && sidebarExpanded && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 z-10 pointer-events-auto"
            onClick={() => setSidebarExpanded(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </>
  );
}
