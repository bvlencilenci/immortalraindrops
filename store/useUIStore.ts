import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'es' | 'de' | 'fr' | 'ru';

export interface SiteConfig {
  video_overlay_opacity?: number;
  scanline_intensity?: number;
  grid_anim_speed?: number;
  typography_scale?: number;
  volume_cap?: number;
  crossfade_duration?: number;
  radio_buffer_time?: number;
  [key: string]: any;
}

interface UIStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  siteConfig: SiteConfig;
  setSiteConfig: (config: SiteConfig) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      siteConfig: {},
      setSiteConfig: (config) => set({ siteConfig: config }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
