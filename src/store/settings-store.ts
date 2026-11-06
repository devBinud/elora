import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

/**
 * Device-level UI preferences. Persisted locally with AsyncStorage so they are
 * available instantly at startup, before Firebase or SQLite are ready.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    {
      name: 'elora.settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
