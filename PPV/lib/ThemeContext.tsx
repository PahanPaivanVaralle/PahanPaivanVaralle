import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'Ruusu' | 'Auringonlasku' | 'Meri' | 'Metsä';

export interface Theme {
  name: ThemeName;
  gradient: [string, string];
  tabBar: string;
  button: string;
}

export const THEMES: Theme[] = [
  {
    name: 'Ruusu',
    gradient: ['rgba(181, 218, 206, 1)', 'rgba(236, 192, 209, 1)'],
    tabBar: 'rgba(236, 192, 209, 0.8)',
    button: 'rgba(236, 192, 209, 1)',
  },
  {
    name: 'Auringonlasku',
    gradient: ['rgba(255, 210, 130, 1)', 'rgba(255, 120, 100, 1)'],
    tabBar: 'rgba(255, 150, 100, 0.8)',
    button: 'rgba(255, 210, 130, 1)',
  },
  {
    name: 'Meri',
    gradient: ['rgba(160, 220, 240, 1)', 'rgba(70, 130, 200, 1)'],
    tabBar: 'rgba(70, 130, 200, 0.8)',
    button: 'rgba(160, 220, 240, 1)',
  },
  {
    name: 'Metsä',
    gradient: ['rgba(160, 230, 180, 1)', 'rgba(60, 160, 80, 1)'],
    tabBar: 'rgba(60, 160, 80, 0.8)',
    button: 'rgba(160, 230, 180, 1)',
  },
];

const THEME_KEY = 'ppv_theme';

interface ThemeContextType {
  theme: Theme;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  setThemeName: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      const found = saved ? THEMES.find((t) => t.name === saved) : null;
      setTheme(found ?? THEMES[0]);
    });
  }, []);

  const setThemeName = (name: ThemeName) => {
    const found = THEMES.find((t) => t.name === name);
    if (!found) return;
    setTheme(found);
    AsyncStorage.setItem(THEME_KEY, name);
  };

  if (!theme) return null;

  return (
    <ThemeContext.Provider value={{ theme, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
