'use client';

import { useSyncExternalStore } from 'react';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export const ThemeToggle = () => {
  const mounted = useIsMounted();
  const { resolvedTheme, setTheme } = useTheme();

  if (!mounted) {
    return <div className="h-10 w-10 rounded-xl border border-border" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
