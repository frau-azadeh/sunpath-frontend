'use client';

import { useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Inbox, Loader2, RefreshCw, Search, X } from 'lucide-react';

import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleTableRow } from '@/components/vehicles/VehicleTableRow';
import { faNumber } from '@/lib/format';
import type { Vehicle } from '@/types/vehicle';

type LoadState = 'loading' | 'error' | 'success';

type VehicleStatusFilter = 'all' | 'active' | 'inactive';

type VehicleTypeFilter = 'all' | '0' | '1' | '2' | '3';

interface Props {
  vehicles: Vehicle[];
  vehiclesState: LoadState;
  isRefreshing: boolean;
  onRefresh: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLocaleLowerCase('fa')
    .replace(/[۰-۹]/g, (character) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(character)))
    .replace(/[٠-٩]/g, (character) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(character)));
};

export function VehiclesTab({
  vehicles,
  vehiclesState,
  isRefreshing,
  onRefresh,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>('all');

  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>('all');

  const filteredVehicles = useMemo(() => {
    const query = normalizeText(search);

    return vehicles.filter((vehicle) => {
      const searchableValues = [
        vehicle.plateNumber ?? '',
        vehicle.model ?? '',
        vehicle.insuranceNumber ?? '',
        vehicle.currentDriverName ?? '',
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) => normalizeText(value).includes(query));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && vehicle.status === 1) ||
        (statusFilter === 'inactive' && vehicle.status === 0);

      const matchesType =
        typeFilter === 'all' || vehicle.vehicleType === Number(typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,

      active: vehicles.filter((vehicle) => vehicle.status === 1).length,

      trucks: vehicles.filter(
        (vehicle) => vehicle.vehicleType === 1 || vehicle.vehicleType === 2,
      ).length,

      cars: vehicles.filter((vehicle) => vehicle.vehicleType === 0).length,

      bikes: vehicles.filter((vehicle) => vehicle.vehicleType === 3).length,
    }),
    [vehicles],
  );

  const hasFilters =
    search.trim().length > 0 || statusFilter !== 'all' || typeFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  return (
    <motion.div
      key="tab-vehicles"
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
      <VehicleStats {...stats} />

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
              placeholder="جست‌وجو بر اساس پلاک، مدل یا نام راننده..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-4 pr-12 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as VehicleStatusFilter)
                }
                className="appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-8 pr-9 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
              >
                <option value="all">همه وضعیت‌ها</option>

                <option value="active">فعال</option>

                <option value="inactive">غیرفعال</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as VehicleTypeFilter)
              }
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            >
              <option value="all">همه انواع خودرو</option>

              <option value="0">سواری</option>

              <option value="1">وانت و نیسان</option>

              <option value="2">کامیون و تریلی</option>

              <option value="3">موتورسیکلت</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400"
              >
                <X size={14} />
                پاک‌کردن فیلترها
              </button>
            )}

            <div className="hidden h-6 w-px bg-neutral-200 dark:bg-neutral-800 md:block" />

            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              تعداد: {faNumber(filteredVehicles.length)} خودرو
            </span>

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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead>
              <tr className="bg-neutral-50/50 text-xs font-bold text-neutral-500 dark:bg-neutral-800/30 dark:text-neutral-400">
                <th className="px-6 py-5">اطلاعات خودرو</th>

                <th className="px-6 py-5">نوع خودرو</th>

                <th className="px-6 py-5">سرعت و موقعیت</th>

                <th className="px-6 py-5">وضعیت</th>

                <th className="px-6 py-5 text-center">عملیات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {vehiclesState === 'loading' ? (
                <LoadingState />
              ) : vehiclesState === 'error' ? (
                <ErrorState onRetry={onRefresh} />
              ) : filteredVehicles.length === 0 ? (
                <EmptyState hasFilter={hasFilters} />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredVehicles.map((vehicle) => (
                    <VehicleTableRow
                      key={vehicle.id}
                      vehicle={vehicle}
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
            در حال دریافت لیست خودروها...
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
              ? 'هیچ خودرویی با این مشخصات یافت نشد'
              : 'هنوز خودرویی در سیستم ثبت نشده است'}
          </span>
        </div>
      </td>
    </tr>
  );
}
