'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Car,
  Filter,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleTableRow } from '@/components/vehicles/VehicleTableRow';
import { faNumber } from '@/lib/format';
import { vehicleService } from '@/services/vehicleService';
import type { CreateVehicleRequest, Vehicle } from '@/types/vehicle';

type LoadState = 'loading' | 'error' | 'success';

type VehicleStatusFilter = 'all' | 'active' | 'inactive';

type VehicleTypeFilter = 'all' | '0' | '1' | '2' | '3';

const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'خطای پیش‌بینی‌نشده‌ای رخ داد.';
  }

  const message = error.message.trim();

  if (!message) {
    return 'خطایی در ارتباط با سرور رخ داد.';
  }

  try {
    const parsed = JSON.parse(message) as {
      message?: unknown;
      title?: unknown;
      errors?: Record<string, string[]>;
    };

    if (
      typeof parsed.message === 'string' &&
      parsed.message.trim().length > 0
    ) {
      return parsed.message;
    }

    if (parsed.errors && typeof parsed.errors === 'object') {
      const validationMessages = Object.values(parsed.errors)
        .flat()
        .filter((item): item is string => typeof item === 'string');

      if (validationMessages.length > 0) {
        return validationMessages.join('، ');
      }
    }

    if (typeof parsed.title === 'string' && parsed.title.trim().length > 0) {
      return parsed.title;
    }
  } catch {
    return message;
  }

  return message;
};

const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLocaleLowerCase('fa')
    .replace(/[۰-۹]/g, (character) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(character)))
    .replace(/[٠-٩]/g, (character) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(character)));
};

export default function VehiclesPageClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>('all');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vehiclePendingDelete, setVehiclePendingDelete] =
    useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [operationError, setOperationError] = useState<string | null>(null);

  // تابع بارگذاری داده‌ها که فقط بعد از await، state را تغییر می‌دهد
  const loadVehicles = useCallback(
    async (withRefreshLoader = false): Promise<void> => {
      // ❗ نکته: این دو setState قبل از await انجام می‌شوند
      // برای جلوگیری از خطای react-hooks/set-state-in-effect،
      // باید این setState ها فقط بعد از اتمام عملیات async انجام شوند.
      // اما چون این تابع ممکن است از جای دیگر هم صدا زده شود،
      // برای جلوگیری از خطا از الگوی زیر استفاده می‌کنیم.

      try {
        const data = await vehicleService.getAll();

        setVehicles(Array.isArray(data) ? data : []);
        setState('success');
        setOperationError(null);
      } catch (error: unknown) {
        setOperationError(getErrorMessage(error));
        setState('error');
      } finally {
        if (withRefreshLoader) {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  // بارگذاری اولیه فقط یک‌بار در mount کامپوننت
  // برای جلوگیری از خطای set-state-in-effect،
  // setState های اولیه (loading) را از تابع loadVehicles حذف کردیم
  // و مقدار state اولیه را به 'loading' ست کردیم
  useEffect(() => {
    // ✅ اینجا هیچ setState سنکرونی قبل از await انجام نمی‌شود
    // بنابراین ESLint خطا نمی‌دهد
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const data = await vehicleService.getAll();
        if (isMounted) {
          setVehicles(Array.isArray(data) ? data : []);
          setState('success');
          setOperationError(null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setOperationError(getErrorMessage(error));
          setState('error');
        }
      }
    };

    void fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []); // خالی یعنی فقط یک‌بار اجرا می‌شود

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = normalizeText(search);

    return vehicles.filter((vehicle) => {
      const searchableValues = [
        vehicle.plateNumber,
        vehicle.model ?? '',
        vehicle.insuranceNumber ?? '',
        vehicle.currentDriverName ?? '',
      ];

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableValues.some((value) =>
          normalizeText(value).includes(normalizedQuery),
        );

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

  const handleRetry = async (): Promise<void> => {
    setState('loading');
    await loadVehicles();
  };

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    await loadVehicles(true);
  };

  const handleOpenCreate = (): void => {
    setSelectedVehicle(null);
    setOperationError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle): void => {
    setSelectedVehicle(vehicle);
    setOperationError(null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = (): void => {
    if (isSubmitting) {
      return;
    }

    setIsFormModalOpen(false);
    setSelectedVehicle(null);
    setOperationError(null);
  };

  const handleSubmit = async (data: CreateVehicleRequest): Promise<void> => {
    setIsSubmitting(true);
    setOperationError(null);

    try {
      if (selectedVehicle) {
        // ۱. عملیات ویرایش
        await vehicleService.update(selectedVehicle.id, data);
      } else {
        // ۲. عملیات ثبت جدید
        await vehicleService.create(data);
      }

      // بعد از هر دو عملیات، لیست را دوباره از سرور لود می‌کنیم
      await loadVehicles(true);

      setIsFormModalOpen(false);
      setSelectedVehicle(null);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setOperationError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (vehicle: Vehicle): void => {
    setOperationError(null);
    setVehiclePendingDelete(vehicle);
  };

  const handleCancelDelete = (): void => {
    if (isDeleting) {
      return;
    }

    setVehiclePendingDelete(null);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!vehiclePendingDelete) {
      return;
    }

    setIsDeleting(true);
    setOperationError(null);

    try {
      await vehicleService.remove(vehiclePendingDelete.id);

      setVehicles((currentVehicles) =>
        currentVehicles.filter(
          (vehicle) => vehicle.id !== vehiclePendingDelete.id,
        ),
      );

      if (selectedVehicle?.id === vehiclePendingDelete.id) {
        setSelectedVehicle(null);
        setIsFormModalOpen(false);
      }

      setVehiclePendingDelete(null);
    } catch (error: unknown) {
      setOperationError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = (): void => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== 'all' || typeFilter !== 'all';

  return (
    <>
      <div dir="rtl" className="flex flex-col gap-6 font-vazir">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:block">
              <Car className="text-orange-500" size={24} />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                مدیریت خودروها
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                لیست کامل و وضعیت خودروهای ناوگان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              aria-label="به‌روزرسانی خودروها"
              title="به‌روزرسانی"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-orange-600/40 active:scale-95"
            >
              <Plus size={18} />
              ثبت خودرو جدید
            </button>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {operationError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
              className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              <div className="flex min-w-0 items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />

                <p className="text-sm leading-6">{operationError}</p>
              </div>

              <button
                type="button"
                onClick={() => setOperationError(null)}
                aria-label="بستن پیام خطا"
                title="بستن"
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <X size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <VehicleStats {...stats} />

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
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجو بر اساس پلاک، مدل یا راننده..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Filter
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as VehicleStatusFilter)
                  }
                  className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-9 text-xs font-semibold text-slate-600 outline-none transition-colors focus:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
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
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none transition-colors focus:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                <option value="all">همه انواع خودرو</option>
                <option value="0">سواری</option>
                <option value="1">وانت و نیسان</option>
                <option value="2">کامیون و تریلی</option>
                <option value="3">موتورسیکلت</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  <X size={14} />
                  پاک‌کردن فیلترها
                </button>
              )}

              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 md:block" />

              <span className="text-xs text-slate-500 dark:text-slate-400">
                تعداد: {faNumber(filteredVehicles.length)} خودرو
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 dark:bg-slate-800/30 dark:text-slate-400">
                  <th className="px-6 py-5">اطلاعات خودرو</th>
                  <th className="px-6 py-5">نوع خودرو</th>
                  <th className="px-6 py-5">سرعت و موقعیت</th>
                  <th className="px-6 py-5">وضعیت</th>
                  <th className="px-6 py-5 text-center">عملیات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {state === 'loading' ? (
                  <LoadingState />
                ) : state === 'error' ? (
                  <ErrorState onRetry={handleRetry} />
                ) : filteredVehicles.length === 0 ? (
                  <EmptyState hasFilter={hasActiveFilters} />
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredVehicles.map((vehicle) => (
                      <VehicleTableRow
                        key={vehicle.id}
                        vehicle={vehicle}
                        onEdit={handleOpenEdit}
                        onDelete={handleRequestDelete}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      <VehicleFormModal
        isOpen={isFormModalOpen}
        initialData={selectedVehicle}
        isSubmitting={isSubmitting}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationModal
        vehicle={vehiclePendingDelete}
        isDeleting={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

function LoadingState() {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="h-12 w-12 rounded-full border-4 border-slate-100 dark:border-slate-800" />

            <Loader2
              className="absolute inset-0 animate-spin text-orange-500"
              size={48}
            />
          </div>

          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            در حال دریافت لیست خودروها...
          </span>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="rounded-full bg-slate-50 p-6 dark:bg-slate-800/50">
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-red-50 p-5 text-red-500 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle size={36} />
          </div>

          <p className="text-sm text-red-500 dark:text-red-400">
            خطایی در برقراری ارتباط با سرور رخ داد
          </p>

          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            تلاش دوباره
          </button>
        </div>
      </td>
    </tr>
  );
}

type DeleteConfirmationModalProps = {
  vehicle: Vehicle | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

function DeleteConfirmationModal({
  vehicle,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {vehicle && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-vehicle-title"
        >
          <motion.button
            type="button"
            aria-label="بستن پنجره حذف"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            disabled={isDeleting}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <Trash2 size={21} />
                </div>

                <div>
                  <h2
                    id="delete-vehicle-title"
                    className="text-base font-black text-slate-900 dark:text-white"
                  >
                    حذف خودرو
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    این عملیات قابل بازگشت نیست.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                aria-label="بستن"
                title="بستن"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                آیا از حذف خودرو با پلاک
                <strong
                  dir="ltr"
                  className="mx-1 text-slate-900 dark:text-white"
                >
                  {vehicle.plateNumber}
                </strong>
                اطمینان دارید؟
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}

                {isDeleting ? 'در حال حذف...' : 'حذف خودرو'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
