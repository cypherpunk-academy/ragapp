import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@philo/settings';

export type ColorSchemePreference = 'system' | 'light' | 'dark';
export type FontSizeLevel = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

type Settings = {
  colorScheme: ColorSchemePreference;
  fontSizeLevel: FontSizeLevel;
};

type SettingsContextValue = Settings & {
  setColorScheme: (value: ColorSchemePreference) => void;
  setFontSizeLevel: (value: FontSizeLevel) => void;
};

const VALID_FONT_LEVELS: FontSizeLevel[] = ['small', 'medium', 'large', 'xlarge', 'xxlarge'];
const DEFAULT: Settings = { colorScheme: 'system', fontSizeLevel: 'large' };

const SettingsContext = createContext<SettingsContextValue>({
  ...DEFAULT,
  setColorScheme: () => {},
  setFontSizeLevel: () => {},
});

function applyColorScheme(pref: ColorSchemePreference) {
  Appearance.setColorScheme(pref === 'system' ? null : pref);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  // Load from AsyncStorage on mount and apply
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        const merged: Settings = {
          colorScheme: parsed.colorScheme ?? DEFAULT.colorScheme,
          fontSizeLevel: VALID_FONT_LEVELS.includes(parsed.fontSizeLevel as FontSizeLevel)
            ? (parsed.fontSizeLevel as FontSizeLevel)
            : DEFAULT.fontSizeLevel,
        };
        setSettings(merged);
        applyColorScheme(merged.colorScheme);
      } catch {
        // ignore malformed stored value
      }
    });
  }, []);

  const setColorScheme = useCallback((value: ColorSchemePreference) => {
    setSettings((prev) => {
      const next = { ...prev, colorScheme: value };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyColorScheme(value);
      return next;
    });
  }, []);

  const setFontSizeLevel = useCallback((value: FontSizeLevel) => {
    setSettings((prev) => {
      const next = { ...prev, fontSizeLevel: value };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, setColorScheme, setFontSizeLevel }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
