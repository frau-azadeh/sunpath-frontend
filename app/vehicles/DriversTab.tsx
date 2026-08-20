'use client';

import { useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, Loader2, RefreshCw, Search } from 'lucide-react';

import { DriverStats } from '@/components/drivers/DriverStats';
import { DriverTableRow } from '@/components/drivers/DriverTableRow';
import { faNumber } from '@/lib/format';
import type { Driver } from '@/types/driver';

type LoadState = 'loading' | 'error' | 'success';

interface Props {
  drivers: Driver[];
  driversState: LoadState;
  isRefreshing: boolean;
  onRefresh: () => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLocaleLowerCase('fa')
    .replace(/[۰-۹]/g, (character) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(character)))
    .replace(/[٠-٩]/g, (character) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(character)));
};

export function DriversTab({
  drivers,
  driversState,
  isRefreshing,
  onRefresh,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredDrivers = useMemo(() => {
    const query = normalizeText(search);

    if (!query) {
      return drivers;
    }

    return drivers.filter((driver) => {
      const fullName = normalizeText(
        `${driver.firstName ?? ''} ${driver.lastName ?? ''}`,
      );

      const nationalId = normalizeText(driver.nationalId ?? '');

      const phone = normalizeText(driver.phone ?? '');

      return (
        fullName.includes(query) ||
        nationalId.includes(query) ||
        phone.includes(query)
      );
    });
  }, [drivers, search]);

  const stats = useMemo(
    () => ({
      total: drivers.length,

      licensed: drivers.filter((driver) => driver.licenseType >= 1).length,

      active: drivers.filter((driver) => driver.licenseType >= 2).length,
    }),
    [drivers],
  );

  return (
    <motion.div
      key="tab-drivers"
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
      }}
      className="flex flex-col gap-6"
    >
      <DriverStats {...stats} />

      <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800/50 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجو بر اساس نام، کد ملی یا تلفن..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-4 pr-12 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </button>

            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              تعداد: {faNumber(filteredDrivers.length)} نفر
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead>
              <tr className="bg-neutral-50/50 text-xs font-bold text-neutral-500 dark:bg-neutral-800/30 dark:text-neutral-400">
                <th className="px-6 py-5">اطلاعات فردی</th>

                <th className="px-6 py-5">کد ملی</th>

                <th className="px-6 py-5">اطلاعات تماس</th>

                <th className="px-6 py-5">وضعیت گواهینامه</th>

                <th className="px-6 py-5 text-center">عملیات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {driversState === 'loading' ? (
                <LoadingState />
              ) : driversState === 'error' ? (
                <ErrorState onRetry={onRefresh} />
              ) : filteredDrivers.length === 0 ? (
                <EmptyState hasFilter={search.trim().length > 0} />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredDrivers.map((driver) => (
                    <DriverTableRow
                      key={driver.id}
                      driver={driver}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={48} />

          <span className="text-sm text-neutral-500">
            در حال دریافت لیست رانندگان...
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
          <span className="text-sm text-red-500">
            خطایی در برقراری ارتباط با سرور رخ داد
          </span>

          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-neutral-900"
          >
            تلاش دوباره
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="rounded-full bg-neutral-50 p-6 dark:bg-neutral-800/50">
            {hasFilter ? (
              <Search size={48} className="opacity-30" />
            ) : (
              <Inbox size={48} className="opacity-30" />
            )}
          </div>

          <span className="text-sm font-medium">
            {hasFilter
              ? 'هیچ راننده‌ای با این مشخصات یافت نشد'
              : 'هنوز راننده‌ای در سیستم ثبت نشده است'}
          </span>
        </div>
      </td>
    </tr>
  );
}
