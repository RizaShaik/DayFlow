import { useTheme } from '../../hooks/useTheme.js';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border
                 text-text hover:bg-surface-alt transition-colors"
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}
