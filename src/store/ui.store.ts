import { create } from 'zustand';

export type ActivePanel = 'component' | 'systems' | 'tour' | null;

interface UIState {
  activePanel: ActivePanel;
  sidebarExpanded: boolean;
  isLoading: boolean;
  loadingProgress: number;
}

interface UIActions {
  openPanel: (panel: NonNullable<ActivePanel>) => void;
  closePanel: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  activePanel: null,
  sidebarExpanded: true,
  isLoading: true,
  loadingProgress: 0,

  openPanel: (panel) => set({ activePanel: panel }),

  closePanel: () => set({ activePanel: null }),

  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  setLoading: (loading) => set({ isLoading: loading }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
}));
