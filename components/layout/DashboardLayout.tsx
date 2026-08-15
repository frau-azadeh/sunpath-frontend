'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';

import Sidebar from '@/components/dashboard/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const currentTheme = resolvedTheme ?? theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 font-vazir text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4">
        {/* Desktop Sidebar */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex">
          <Sidebar />
        </aside>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed right-4 top-4 z-50 h-[calc(100vh-2rem)] w-72 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
            >
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex h-16 items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 dark:border-slate-800 dark:text-slate-200 lg:hidden"
                aria-label="باز کردن منو"
              >
                <Menu size={18} />
              </button>

              <div>

                <p className="text-base text-slate-500 dark:text-slate-400 md:text-xl">
                  مدیریت لحظه‌ای ناوگان و شبیه‌سازی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                  aria-label="Toggle theme"
                  type="button"
                >
                  {(resolvedTheme ?? theme) === 'dark' ? (
                    <Sun size={18} />
                  ) : (
                    <Moon size={18} />
                  )}
                </button>
              )}

              <div className="hidden items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 md:flex">
                <div className="h-8 w-8 rounded-full border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
                <div className="text-right">
                  <p className="text-sm font-medium leading-4">Azadeh</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
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
