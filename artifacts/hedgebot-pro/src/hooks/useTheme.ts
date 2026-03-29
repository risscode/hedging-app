import { useState, useEffect } from 'react';
import { getTheme, setTheme, applyTheme, type Theme } from '../lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  const set = (t: Theme) => {
    setTheme(t);
    setThemeState(t);
  };

  return { theme, toggle, set, isDark: theme === 'dark' };
}
