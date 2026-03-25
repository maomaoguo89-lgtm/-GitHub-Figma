import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'zh' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'zh' ? 'en' : 'zh' 
      })),
    }),
    {
      name: 'iooi-language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);