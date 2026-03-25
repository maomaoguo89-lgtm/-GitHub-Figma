import { create } from 'zustand';
import { ThemePreset, ThemeColors } from './canvasStore';

interface ThemePresetState {
  presets: ThemePreset[];
  savePreset: (name: string, colors: ThemeColors) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, newName: string) => void;
}

const MAX_PRESETS = 3;

// Load presets from localStorage
const loadPresets = (): ThemePreset[] => {
  if (typeof window === 'undefined') return [];
  
  const saved = localStorage.getItem('themePresets');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Save presets to localStorage
const savePresetsToStorage = (presets: ThemePreset[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('themePresets', JSON.stringify(presets));
  }
};

export const useThemePresetStore = create<ThemePresetState>((set) => ({
  presets: loadPresets(),

  savePreset: (name, colors) =>
    set((state) => {
      // If we already have 3 presets, don't add more
      if (state.presets.length >= MAX_PRESETS) {
        console.warn('Maximum presets reached (3)');
        return state;
      }

      const newPreset: ThemePreset = {
        id: Date.now().toString(),
        name,
        colors,
      };

      const newPresets = [...state.presets, newPreset];
      savePresetsToStorage(newPresets);
      return { presets: newPresets };
    }),

  deletePreset: (id) =>
    set((state) => {
      const newPresets = state.presets.filter((p) => p.id !== id);
      savePresetsToStorage(newPresets);
      return { presets: newPresets };
    }),

  renamePreset: (id, newName) =>
    set((state) => {
      const newPresets = state.presets.map((p) =>
        p.id === id ? { ...p, name: newName } : p
      );
      savePresetsToStorage(newPresets);
      return { presets: newPresets };
    }),
}));
