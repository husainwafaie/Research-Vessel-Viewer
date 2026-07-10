import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ActivePanel = 'component' | 'systems' | 'tour' | null;

export type RenderQuality = 'high' | 'low';

const QUALITY_STORAGE_KEY = 'rvv-quality';

// Read once at module init; localStorage can throw in private/locked-down
// browsing modes, so failures just fall back to high
function loadStoredQuality(): RenderQuality {
  try {
    return localStorage.getItem(QUALITY_STORAGE_KEY) === 'low' ? 'low' : 'high';
  } catch {
    return 'high';
  }
}

interface UIState {
  activePanel: ActivePanel;
  sidebarExpanded: boolean;
  isLoading: boolean;
  loadingProgress: number;
  /** Underwater ambience mute (audio only plays underwater). */
  audioMuted: boolean;
  /** Render quality — 'low' halves particle counts and seafloor tessellation. */
  quality: RenderQuality;
}

interface UIActions {
  openPanel: (panel: NonNullable<ActivePanel>) => void;
  closePanel: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  toggleAudioMuted: () => void;
  toggleQuality: () => void;
}

// subscribeWithSelector: useUnderwaterAudio subscribes to audioMuted without
// re-rendering (same pattern as scene.store)
export const useUIStore = create<UIState & UIActions>()(
  subscribeWithSelector((set) => ({
  activePanel: null,
  sidebarExpanded: true,
  isLoading: true,
  loadingProgress: 0,
  audioMuted: false,
  quality: loadStoredQuality(),

  openPanel: (panel) => set({ activePanel: panel }),

  closePanel: () => set({ activePanel: null }),

  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  setLoading: (loading) => set({ isLoading: loading }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  toggleAudioMuted: () => set((s) => ({ audioMuted: !s.audioMuted })),

  toggleQuality: () =>
    set((s) => {
      const quality: RenderQuality = s.quality === 'high' ? 'low' : 'high';
      try {
        localStorage.setItem(QUALITY_STORAGE_KEY, quality);
      } catch {
        /* private mode — preference just won't persist */
      }
      return { quality };
    }),
  })),
);
