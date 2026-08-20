'use client';

import { useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import { Loader2, Navigation, Plus, RefreshCw, Search } from 'lucide-react';

import { DispatchCard } from '@/components/dispatch/DispatchCard';
import { faNumber } from '@/lib/format';
import type { Dispatch } from '@/types/dispatch';
import type { Driver } from '@/types/driver';
import type { Vehicle } from '@/types/vehicle';

interface Props {
  dispatches: Dispatch[];
  vehicles: Vehicle[];
  drivers: Driver[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onAdd: () => void;
  onEdit: (dispatch: Dispatch) => void;
  onDelete: (dispatch: Dispatch) => Promise<void>;
  onStatusChange: (id: number, status: string) => Promise<void>;
}

const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLocaleLowerCase('fa')
    .replace(/[۰-۹]/g, (character) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(character)))
    .replace(/[٠-٩]/g, (character) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(character)));
};

export function DispatchesTab({
  dispatches,
  vehicles,
  drivers,
  isLoading,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredDispatches = useMemo(() => {
    const query = normalizeText(search);

    if (!query) {
      return dispatches;
    }

    return dispatches.filter((dispatch) => {
      const title = normalizeText(dispatch.title ?? '');

      const origin = normalizeText(dispatch.originTitle ?? '');

      const destination = normalizeText(dispatch.destinationTitle ?? '');

      return (
        title.includes(query) ||
        origin.includes(query) ||
        destination.includes(query)
      );
    });
  }, [dispatches, search]);

  return (
    <motion.div
      key="tab-dispatches"
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
      <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی مأموریت، مبدأ یا مقصد..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-4 pr-12 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-orange-500/50 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <RefreshCw
                size={16}
                className={isLoading ? 'animate-spin' : ''}
              />
            </button>

            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              تعداد کل مأموریت‌ها: {faNumber(filteredDispatches.length)} مورد
            </span>
          </div>
        </div>

        {isLoading && dispatches.length === 0 ? (
          <LoadingState />
        ) : filteredDispatches.length === 0 ? (
          <EmptyState hasSearch={search.trim().length > 0} onAdd={onAdd} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDispatches.map((item) => (
              <DispatchCard
                key={item.id}
                dispatch={item}
                vehicle={vehicles.find(
                  (vehicle) => vehicle.id === item.vehicleId,
                )}
                driver={drivers.find((driver) => driver.id === item.driverId)}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-orange-500" size={42} />

        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          در حال دریافت مأموریت‌ها...
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  hasSearch,
  onAdd,
}: {
  hasSearch: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <div className="rounded-full bg-neutral-50 p-6 dark:bg-neutral-800/50">
        <Navigation size={48} className="opacity-30" />
      </div>

      <span className="mt-3 text-sm font-medium">
        {hasSearch
          ? 'هیچ مأموریتی با این جست‌وجو پیدا نشد'
          : 'هنوز مأموریت یا تخصیصی ایجاد نشده است'}
      </span>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700"
        >
          <Plus size={16} />
          ایجاد اولین تخصیص
        </button>
      )}
    </div>
  );
}
