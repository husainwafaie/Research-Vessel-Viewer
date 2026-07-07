import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ActivePanel = 'component' | 'systems' | 'tour' | null;

interface UIState {
  activePanel: ActivePanel;
  sidebarExpanded: boolean;
  isLoading: boolean;
  loadingProgress: number;
  /** Underwater ambience mute (audio only plays underwater). */
  audioMuted: boolean;
}

interface UIActions {
  openPanel: (panel: NonNullable<ActivePanel>) => void;
  closePanel: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  toggleAudioMuted: () => void;
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

  openPanel: (panel) => set({ activePanel: panel }),

  closePanel: () => set({ activePanel: null }),

  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  setLoading: (loading) => set({ isLoading: loading }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  toggleAudioMuted: () => set((s) => ({ audioMuted: !s.audioMuted })),
  })),
);
