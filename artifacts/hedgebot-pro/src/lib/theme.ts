export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  return (localStorage.getItem('bnb-theme') as Theme) ?? 'dark';
}

export function setTheme(theme: Theme) {
  localStorage.setItem('bnb-theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
