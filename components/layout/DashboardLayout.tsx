'use client';

import { type ReactNode, useState, useSyncExternalStore } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import Sidebar from '@/components/dashboard/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const emptySubscribe = () => () => {};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const toggleTheme = () => {
    const currentTheme = resolvedTheme ?? theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const isDark = mounted && (resolvedTheme ?? theme) === 'dark';

  return (
    <main className="min-h-screen bg-neutral-50 p-4 font-vazir text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:flex">
          <Sidebar />
        </aside>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-neutral-950/30 backdrop-blur-[1px] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 28,
              }}
              className="fixed right-4 top-4 z-50 h-[calc(100vh-2rem)] w-72 rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:hidden"
            >
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex h-16 items-center justify-between rounded-3xl border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-xl border border-neutral-200 p-2 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200 lg:hidden"
                aria-label="باز کردن منو"
              >
                <Menu size={18} />
              </button>

              <p className="text-base text-neutral-500 dark:text-neutral-400 md:text-xl">
                مدیریت لحظه‌ای ناوگان و شبیه‌سازی
              </p>
            </div>

            <div className="flex items-center gap-2">
              {mounted ? (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-xl border border-neutral-200 p-2 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200"
                  aria-label={
                    isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'
                  }
                  title={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              ) : (
                <span
                  className="h-10 w-10 rounded-xl border border-neutral-200 dark:border-neutral-800"
                  aria-hidden="true"
                />
              )}

              <div className="hidden items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800 md:flex">
                <div className="h-8 w-8 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />

                <div className="text-right">
                  <p className="text-sm font-medium leading-4">Azadeh</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </section>
      </div>
    </main>
  );
};
