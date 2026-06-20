import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComponentFocus } from '@hooks/useComponentFocus';
import { CATEGORY_CONFIG } from '@data/categoryConfig';
import { getComponentById } from '@domain/selectors';
import { vessel } from '@data/vessel';

const PANEL_VARIANTS = {
  hidden: { x: 380, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: 380,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.25 },
  }),
};

export function ComponentPanel() {
  const { component, system, blur, focus } = useComponentFocus();
  const [descExpanded, setDescExpanded] = useState(false);

  if (!component || !system) return null;

  const catCfg = CATEGORY_CONFIG[system.category];
  const relatedComponents = component.relatedComponentIds
    .map((id) => getComponentById(vessel, id))
    .filter(Boolean);

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={component.id}
        variants={PANEL_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute right-4 top-16 bottom-16 w-80 flex flex-col gap-3 pointer-events-auto"
        aria-label={`Component details: ${component.name}`}
        role="complementary"
      >
        {/* ── Header card ──────────────────────────────────── */}
        <motion.div
          variants={ITEM_VARIANTS}
          custom={0}
          initial="hidden"
          animate="visible"
          className="glass rounded-xl p-4"
        >
          {/* System badge */}
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium mb-3 ${catCfg.tailwindBg} ${catCfg.tailwindText} border ${catCfg.tailwindBorder}`}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: catCfg.color }}
            />
            {catCfg.label}
          </div>

          {/* Component name */}
          <h2 className="text-white text-lg font-light leading-tight mb-1">
            {component.name}
          </h2>

          {/* Short description */}
          <p className="text-ocean-300 text-xs leading-relaxed">
            {component.shortDescription}
          </p>

          {/* Close button */}
          <button
            onClick={blur}
            className="absolute top-3 right-3 text-ocean-600 hover:text-ocean-300 transition-colors"
            aria-label="Close component panel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>

        {/* ── Long description ─────────────────────────────── */}
        <motion.div
          variants={ITEM_VARIANTS}
          custom={1}
          initial="hidden"
          animate="visible"
          className="glass rounded-xl p-4"
        >
          <button
            className="w-full flex items-center justify-between text-left"
            onClick={() => setDescExpanded((v) => !v)}
            aria-expanded={descExpanded}
          >
            <span className="text-data text-ocean-400 text-xs uppercase tracking-widest">
              Overview
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`text-ocean-500 transition-transform ${descExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <AnimatePresence>
            {descExpanded && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden text-ocean-200 text-xs leading-relaxed mt-3"
              >
                {component.longDescription}
              </motion.p>
            )}
          </AnimatePresence>

          {!descExpanded && (
            <p className="text-ocean-400 text-xs leading-relaxed mt-2 line-clamp-3">
              {component.longDescription}
            </p>
          )}
        </motion.div>

        {/* ── Technical specifications ─────────────────────── */}
        {component.facts.length > 0 && (
          <motion.div
            variants={ITEM_VARIANTS}
            custom={2}
            initial="hidden"
            animate="visible"
            className="glass rounded-xl p-4"
          >
            <div className="text-data text-ocean-400 text-xs uppercase tracking-widest mb-3">
              Specifications
            </div>
            <div className="space-y-2">
              {component.facts.map((fact, i) => (
                <motion.div
                  key={fact.label}
                  custom={i}
                  variants={ITEM_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="text-ocean-500 text-xs shrink-0">{fact.label}</span>
                  <span className="text-data text-ocean-200 text-xs text-right">
                    {fact.value}
                    {fact.unit && (
                      <span className="text-ocean-500 ml-1">{fact.unit}</span>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Related components ───────────────────────────── */}
        {relatedComponents.length > 0 && (
          <motion.div
            variants={ITEM_VARIANTS}
            custom={3}
            initial="hidden"
            animate="visible"
            className="glass rounded-xl p-4"
          >
            <div className="text-data text-ocean-400 text-xs uppercase tracking-widest mb-3">
              Related Systems
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedComponents.map((related) => {
                if (!related) return null;
                return (
                  <button
                    key={related.id}
                    onClick={() => focus(related.id)}
                    className="glass-light rounded-full px-3 py-1 text-xs text-ocean-300 hover:text-white hover:glass transition-all border border-white/5 hover:border-white/15"
                  >
                    {related.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
