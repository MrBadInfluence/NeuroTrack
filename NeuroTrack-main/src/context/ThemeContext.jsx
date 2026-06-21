import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storageGet, storageSet } from '../utils/storage';

export const THEME_KEY = 'neurotrack_theme_mode';

const ThemeContext = createContext({ mode: 'device', isDark: false, setMode: async () => {} });

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('device');
  const systemScheme = useColorScheme();

  useEffect(() => {
    storageGet(THEME_KEY).then(v => { if (v) setModeState(v); });
  }, []);

  const setMode = async (m) => {
    setModeState(m);
    await storageSet(THEME_KEY, m);
  };

  const isDark = mode === 'dark' || (mode === 'device' && systemScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
