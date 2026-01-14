import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'es' | 'de' | 'fr' | 'ru';

interface UIStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
