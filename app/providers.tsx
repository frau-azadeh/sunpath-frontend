'use client';

import type { ReactNode } from 'react';

import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';

function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      dir="rtl"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        classNames: {
          toast:
            'font-vazir border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100',
          title: 'font-vazir',
          description: 'font-vazir',
          actionButton: 'font-vazir',
          cancelButton: 'font-vazir',
        },
      }}
    />
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}

      <AppToaster />
    </ThemeProvider>
  );
}
