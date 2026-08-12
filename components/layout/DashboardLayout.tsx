'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

import Sidebar from '@/components/dashboard/Sidebar';
import { ThemeToggle } from '../ThemeToggle';

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {isOpen && (
          <button
            aria-label="Close sidebar"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'fixed inset-y-0 right-0 z-50 w-64 border-l border-border bg-background transition-transform duration-300 ease-in-out md:translate-x-0',
            isOpen ? 'translate-x-0' : 'translate-x-full',
          ].join(' ')}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
            <span className="font-semibold">SunPath</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-border p-2"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col md:mr-64">
          <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-xl border border-border p-2 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              <div>
                <h1 className="text-base font-semibold tracking-tight md:text-lg">
                  SunPath Control Panel
                </h1>
                <p className="text-xs text-slate-500 md:text-sm">
                  Fleet tracking dashboard
                </p>
              </div>
            </div>

            <ThemeToggle />
          </header>

          <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
