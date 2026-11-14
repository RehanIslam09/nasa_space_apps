import { create } from 'zustand';

interface AppState {
  // Cinematic / audio controls
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;

  // Graphics / performance tier
  graphicsQuality: 'low' | 'medium' | 'high';
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high') => void;

  // Navigation / UI state
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isMuted: true,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setMuted: (isMuted) => set({ isMuted }),

  graphicsQuality: 'high',
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),

  activeSection: 'hero',
  setActiveSection: (activeSection) => set({ activeSection }),
}));
