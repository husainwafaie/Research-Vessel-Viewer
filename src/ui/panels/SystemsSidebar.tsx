import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vessel } from '@data/vessel';
import { CATEGORY_CONFIG } from '@data/categoryConfig';
import { useComponentFocus } from '@hooks/useComponentFocus';

const SIDEBAR_VARIANTS = {
  hidden: { x: -320, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 32 },
  },
};

export function SystemsSidebar() {
  const { focus, selectedId } = useComponentFocus();
  // Track which system sections are expanded
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(vessel.systems.map((s) => s.id)),
  );

  function toggleSystem(systemId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(systemId)) next.delete(systemId);
      else next.add(systemId);
      return next;
    });
  }

  return (
    <motion.nav
      variants={SIDEBAR_VARIANTS}
      initial="hidden"
      animate="visible"
      className="absolute left-4 top-16 bottom-16 w-64 flex flex-col gap-0 pointer-events-auto"
      aria-label="Vessel systems navigation"
    >
      <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="text-data text-ocean-500 text-xs uppercase tracking-widest">
            Systems
          </div>
        </div>

        {/* ── System list ──────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 py-1">
          {vessel.systems.map((system) => {
            const catCfg  = CATEGORY_CONFIG[system.category];
            const isOpen  = expanded.has(system.id);

            return (
              <div key={system.id}>
                {/* System header */}
                <button
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left group"
                  onClick={() => toggleSystem(system.id)}
                  aria-expanded={isOpen}
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
                    className={`text-ocean-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M1.5 3.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Component list */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
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
                            style={
                              isSelected
                                ? { borderLeftColor: catCfg.color }
                                : undefined
                            }
                            aria-current={isSelected ? 'true' : undefined}
                          >
                            <span
                              className="w-1 h-1 rounded-full shrink-0"
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
  );
}
