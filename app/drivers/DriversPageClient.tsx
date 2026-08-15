'use client';

import { useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Filter,
  Inbox,
  Loader2,
  Search,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';

import { DriverFormModal } from '@/components/drivers/DriverFormModal';
import { DriverStats } from '@/components/drivers/DriverStats';
import { DriverTableRow } from '@/components/drivers/DriverTableRow';
import { faNumber } from '@/lib/format';
import { driverService } from '@/services/driverService';
import type {
  CreateDriverRequest,
  Driver,
  UpdateDriverRequest,
} from '@/types/driver';

type LoadState = 'loading' | 'error' | 'success';

type Props = {
  initialDrivers: Driver[];
  initialError: boolean;
};

function getErrorMessage(error: unknown): string {
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

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
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

    if (typeof parsed.title === 'string' && parsed.title.trim()) {
      return parsed.title;
    }
  } catch {
    return message;
  }

  return message;
}

export default function DriversPageClient({
  initialDrivers,
  initialError,
}: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);

  const [state, setState] = useState<LoadState>(
    initialError ? 'error' : 'success',
  );

  const [search, setSearch] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [driverPendingDelete, setDriverPendingDelete] = useState<Driver | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [operationError, setOperationError] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fa');

    if (!query) {
      return drivers;
    }

    return drivers.filter((driver) => {
      const fullName =
        `${driver.firstName} ${driver.lastName}`.toLocaleLowerCase('fa');

      const nationalId = driver.nationalId.toLocaleLowerCase('fa');
      const phone = driver.phone.toLocaleLowerCase('fa');

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

  const handleRetry = async () => {
    setState('loading');
    setOperationError(null);

    try {
      const data = await driverService.getAll();

      setDrivers(data);
      setState('success');
    } catch (error: unknown) {
      setOperationError(getErrorMessage(error));
      setState('error');
    }
  };

  const handleOpenCreate = () => {
    setSelectedDriver(null);
    setOperationError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setOperationError(null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormModalOpen(false);
    setSelectedDriver(null);
    setOperationError(null);
  };

  const handleSubmit = async (data: CreateDriverRequest) => {
    setIsSubmitting(true);
    setOperationError(null);

    try {
      if (selectedDriver) {
        const updateRequest: UpdateDriverRequest = {
          id: selectedDriver.id,
          ...data,
        };

        /*
         * اگر متد update در سرویس Driver برگرداند، می‌توان همان مقدار
         * برگشتی را جایگزین کرد. این نسخه با Promise<void> نیز سازگار است.
         */
        await driverService.update(selectedDriver.id, updateRequest);

        const updatedDriver: Driver = {
          ...selectedDriver,
          ...data,
        };

        setDrivers((currentDrivers) =>
          currentDrivers.map((driver) =>
            driver.id === selectedDriver.id ? updatedDriver : driver,
          ),
        );
      } else {
        const createdDriver = await driverService.create(data);

        setDrivers((currentDrivers) => [
          createdDriver,
          ...currentDrivers.filter((driver) => driver.id !== createdDriver.id),
        ]);
      }

      setIsFormModalOpen(false);
      setSelectedDriver(null);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setOperationError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (driver: Driver) => {
    setOperationError(null);
    setDriverPendingDelete(driver);
  };

  const handleCancelDelete = () => {
    if (isDeleting) {
      return;
    }

    setDriverPendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!driverPendingDelete) {
      return;
    }

    setIsDeleting(true);
    setOperationError(null);

    try {
      await driverService.remove(driverPendingDelete.id);

      setDrivers((currentDrivers) =>
        currentDrivers.filter((driver) => driver.id !== driverPendingDelete.id),
      );

      if (selectedDriver?.id === driverPendingDelete.id) {
        setSelectedDriver(null);
        setIsFormModalOpen(false);
      }

      setDriverPendingDelete(null);
    } catch (error: unknown) {
      setOperationError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 font-vazir">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:block">
              <User className="text-orange-500" size={24} />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                مدیریت رانندگان
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                لیست کامل و وضعیت فعالیت رانندگان سیستم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-orange-600/40 active:scale-95"
          >
            <UserPlus size={18} />
            ثبت راننده جدید
          </button>
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
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                aria-label="بستن پیام خطا"
                title="بستن"
              >
                <X size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام، کد ملی یا تلفن..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Filter size={14} />
                فیلتر پیشرفته
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

              <span className="text-xs text-slate-500 dark:text-slate-400">
                تعداد: {faNumber(filteredData.length)} نفر
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
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
                  <EmptyState hasSearch={search.trim().length > 0} />
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredData.map((driver) => (
                      <DriverTableRow
                        key={driver.id}
                        driver={driver}
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

      <DriverFormModal
        isOpen={isFormModalOpen}
        initialData={selectedDriver}
        isSubmitting={isSubmitting}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationModal
        driver={driverPendingDelete}
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
            در حال دریافت لیست رانندگان...
          </span>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="rounded-full bg-slate-50 p-6 dark:bg-slate-800/50">
            <Inbox size={48} className="opacity-30" />
          </div>

          <span className="text-sm font-medium">
            {hasSearch
              ? 'هیچ راننده‌ای با این مشخصات یافت نشد'
              : 'هنوز راننده‌ای در سیستم ثبت نشده است'}
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
            onClick={onRetry}
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
  driver: Driver | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

function DeleteConfirmationModal({
  driver,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {driver && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-driver-title"
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
                    id="delete-driver-title"
                    className="text-base font-black text-slate-900 dark:text-white"
                  >
                    حذف راننده
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
                آیا از حذف راننده
                <strong className="mx-1 text-slate-900 dark:text-white">
                  {driver.firstName} {driver.lastName}
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

                {isDeleting ? 'در حال حذف...' : 'حذف راننده'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
