import type { SystemCategory } from '@domain/types';

export interface CategoryConfig {
  label: string;
  color: string;       // Tailwind-safe hex for inline styles
  tailwindBg: string;  // Tailwind class for backgrounds
  tailwindText: string;
  tailwindBorder: string;
}

export const CATEGORY_CONFIG: Record<SystemCategory, CategoryConfig> = {
  navigation: {
    label: 'Navigation',
    color: '#0ea5e9',
    tailwindBg: 'bg-sky-500/20',
    tailwindText: 'text-sky-400',
    tailwindBorder: 'border-sky-500/30',
  },
  communication: {
    label: 'Communication',
    color: '#06b6d4',
    tailwindBg: 'bg-cyan-500/20',
    tailwindText: 'text-cyan-400',
    tailwindBorder: 'border-cyan-500/30',
  },
  scientific: {
    label: 'Scientific',
    color: '#10b981',
    tailwindBg: 'bg-emerald-500/20',
    tailwindText: 'text-emerald-400',
    tailwindBorder: 'border-emerald-500/30',
  },
  propulsion: {
    label: 'Propulsion',
    color: '#f97316',
    tailwindBg: 'bg-orange-500/20',
    tailwindText: 'text-orange-400',
    tailwindBorder: 'border-orange-500/30',
  },
  power: {
    label: 'Power',
    color: '#eab308',
    tailwindBg: 'bg-yellow-500/20',
    tailwindText: 'text-yellow-400',
    tailwindBorder: 'border-yellow-500/30',
  },
  launch: {
    label: 'Launch & Recovery',
    color: '#f59e0b',
    tailwindBg: 'bg-amber-500/20',
    tailwindText: 'text-amber-400',
    tailwindBorder: 'border-amber-500/30',
  },
  mapping: {
    label: 'Ocean Mapping',
    color: '#14b8a6',
    tailwindBg: 'bg-teal-500/20',
    tailwindText: 'text-teal-400',
    tailwindBorder: 'border-teal-500/30',
  },
  mission: {
    label: 'Mission',
    color: '#a855f7',
    tailwindBg: 'bg-purple-500/20',
    tailwindText: 'text-purple-400',
    tailwindBorder: 'border-purple-500/30',
  },
  crew: {
    label: 'Crew',
    color: '#6366f1',
    tailwindBg: 'bg-indigo-500/20',
    tailwindText: 'text-indigo-400',
    tailwindBorder: 'border-indigo-500/30',
  },
};
