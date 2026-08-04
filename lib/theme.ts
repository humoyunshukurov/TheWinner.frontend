const STORAGE_KEY = 'nt_theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getActiveTheme() {
  return getStoredTheme() || getSystemTheme();
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const next = getActiveTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
