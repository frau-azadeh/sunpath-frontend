'use client';

import { useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Inbox, Loader2, Search, User, UserPlus } from 'lucide-react';

import { DriverStats } from '@/components/drivers/DriverStats';
import { DriverTableRow } from '@/components/drivers/DriverTableRow';
import { faNumber } from '@/lib/format';
import { driverService } from '@/services/driverService';
import type { Driver } from '@/types/driver';

type LoadState = 'loading' | 'error' | 'success';

type Props = {
  initialDrivers: Driver[];
  initialError: boolean;
};

export default function DriversPageClient({
  initialDrivers,
  initialError,
}: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [state, setState] = useState<LoadState>(
    initialError ? 'error' : 'success',
  );
  const [search, setSearch] = useState('');

  const handleRetry = async () => {
    setState('loading');

    try {
      const data = await driverService.getAll();
      setDrivers(data);
      setState('success');
    } catch {
      setState('error');
    }
  };

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return drivers;

    return drivers.filter((d) => {
      const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
      return fullName.includes(q) || d.nationalId.toLowerCase().includes(q);
    });
  }, [drivers, search]);

  const stats = useMemo(
    () => ({
      total: drivers.length,
      licensed: drivers.filter((d) => d.licenseType >= 1).length,
      active: drivers.filter((d) => d.licenseType >= 2).length,
    }),
    [drivers],
  );

  return (
    <div className="flex flex-col gap-6 font-vazir">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:block">
            <User className="text-orange-500" size={24} />
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              لیست کامل و وضعیت فعالیت رانندگان سیستم
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-orange-600/40 active:scale-95"
        >
          <UserPlus size={18} />
          ثبت راننده جدید
        </button>
      </header>

      <DriverStats {...stats} />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 dark:border-slate-800/50 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام یا کد ملی..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-12 pl-4 text-sm outline-none transition-all focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Filter size={14} />
              فیلتر پیشرفته
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <span className="text-xs text-slate-500">
              تعداد: {faNumber(filteredData.length)} نفر
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 dark:bg-slate-800/30 dark:text-slate-400">
                <th className="px-6 py-5">اطلاعات فردی</th>
                <th className="px-6 py-5">کد ملی</th>
                <th className="px-6 py-5">اطلاعات تماس</th>
                <th className="px-6 py-5">وضعیت گواهینامه</th>
                <th className="px-6 py-5 text-center">عملیات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {state === 'loading' ? (
                <LoadingState />
              ) : state === 'error' ? (
                <ErrorState onRetry={handleRetry} />
              ) : filteredData.length === 0 ? (
                <EmptyState />
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredData.map((driver) => (
                    <DriverTableRow key={driver.id} driver={driver} />
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}

/* --- زیرمجموعه‌ها --- */

function LoadingState() {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <Loader2
              className="absolute top-0 animate-spin text-orange-500"
              size={48}
            />
          </div>
          <span className="text-sm font-medium text-slate-500">
            در حال دریافت لیست رانندگان...
          </span>
        </div>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="rounded-full bg-slate-50 p-6 dark:bg-slate-800/50">
            <Inbox size={48} className="opacity-20" />
          </div>
          <span className="text-sm font-medium">
            هیچ راننده‌ای با این مشخصات یافت نشد
          </span>
        </div>
      </td>
    </tr>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-500">
            خطایی در برقراری ارتباط با سرور رخ داد
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
          >
            تلاش دوباره
          </button>
        </div>
      </td>
    </tr>
  );
}
