import { useEffect, useState } from 'react';
import { IconSun, IconMoon } from './icons';
import { getActiveTheme, toggleTheme } from '../lib/theme';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(null);

  useEffect(() => {
    setThemeState(getActiveTheme());
  }, []);

  if (!theme) return null;

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={() => setThemeState(toggleTheme())}
      aria-label={isDark ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
      title={isDark ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
    >
      <span className="theme-icon-stack">
        <span className={`theme-icon ${isDark ? 'theme-icon-active' : 'theme-icon-inactive-sun'}`}>
          <IconSun size={17} />
        </span>
        <span className={`theme-icon ${!isDark ? 'theme-icon-active' : 'theme-icon-inactive-moon'}`}>
          <IconMoon size={17} />
        </span>
      </span>
    </button>
  );
}
