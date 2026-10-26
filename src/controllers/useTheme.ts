import { useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getThemeColors, LIGHT_COLORS } from '../constants/theme';
import { ThemeMode } from '../models/types';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  return {
    themeMode,
    setThemeMode,
    isDark,
    colors,
  };
}
