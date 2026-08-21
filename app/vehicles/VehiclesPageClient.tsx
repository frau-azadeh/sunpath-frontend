'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Car,
  Loader2,
  Navigation,
  Plus,
  RefreshCw,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { DispatchFormModal } from '@/components/dispatch/DispatchFormModal';
import { DispatchesTab } from '@/components/dispatch/DispatchesTab';
import { DriversTab } from '@/components/dispatch/DriversTab';
import { VehiclesTab } from '@/components/dispatch/VehiclesTab';
import { DriverFormModal } from '@/components/drivers/DriverFormModal';
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal';
import { dispatchService } from '@/services/dispatchService';
import { driverService } from '@/services/driverService';
import { vehicleService } from '@/services/vehicleService';
import { useDispatchStore } from '@/store/dispatch-store';
import type { CreateDispatchRequest, Dispatch } from '@/types/dispatch';
import type {
  CreateDriverRequest,
  Driver,
  UpdateDriverRequest,
} from '@/types/driver';
import type { CreateVehicleRequest, Vehicle } from '@/types/vehicle';

type ActiveTab = 'vehicles' | 'drivers' | 'dispatches';
type LoadState = 'loading' | 'error' | 'success';

interface Props {
  initialDrivers: Driver[];
  initialDriversError: boolean;
}

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
}

export default function VehiclesPageClient({
  initialDrivers,
  initialDriversError,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('vehicles');

  // =========================================================
  // Vehicles
  // =========================================================

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesState, setVehiclesState] = useState<LoadState>('loading');

  const [isRefreshingVehicles, setIsRefreshingVehicles] = useState(false);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  const [vehiclePendingDelete, setVehiclePendingDelete] =
    useState<Vehicle | null>(null);

  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // =========================================================
  // Drivers
  // =========================================================

  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers ?? []);

  const [driversState, setDriversState] = useState<LoadState>(
    initialDriversError ? 'error' : 'loading',
  );

  const [isRefreshingDrivers, setIsRefreshingDrivers] = useState(false);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);

  const [driverPendingDelete, setDriverPendingDelete] = useState<Driver | null>(
    null,
  );

  const [isDeletingDriver, setIsDeletingDriver] = useState(false);

  const [driverError, setDriverError] = useState<string | null>(null);

  // =========================================================
  // Dispatch
  // =========================================================

  const {
    dispatches,
    loading: dispatchesLoading,
    error: dispatchesError,
    fetchDispatches,
    createDispatch,
    updateDispatchStatus,
    clearError: clearDispatchError,
  } = useDispatchStore();

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(
    null,
  );

  // =========================================================
  // Vehicles API
  // =========================================================

  const loadVehicles = useCallback(
    async (withRefreshLoader = false): Promise<void> => {
      if (withRefreshLoader) {
        setIsRefreshingVehicles(true);
      } else {
        setVehiclesState('loading');
      }

      setVehicleError(null);

      try {
        const data = await vehicleService.getAll();

        if (!Array.isArray(data)) {
          throw new Error('ساختار پاسخ خودروها معتبر نیست.');
        }

        setVehicles(data);
        setVehiclesState('success');
      } catch (error: unknown) {
        setVehicleError(getErrorMessage(error));
        setVehiclesState('error');
      } finally {
        if (withRefreshLoader) {
          setIsRefreshingVehicles(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVehicles();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadVehicles]);

  // =========================================================
  // Drivers API
  // =========================================================

  const loadDrivers = useCallback(
    async (withRefreshLoader = false): Promise<void> => {
      if (withRefreshLoader) {
        setIsRefreshingDrivers(true);
      } else {
        setDriversState('loading');
      }

      setDriverError(null);

      try {
        const data = await driverService.getAll();

        if (!Array.isArray(data)) {
          throw new Error('ساختار پاسخ رانندگان معتبر نیست.');
        }

        setDrivers(data);
        setDriversState('success');
      } catch (error: unknown) {
        setDriverError(getErrorMessage(error));
        setDriversState('error');
      } finally {
        if (withRefreshLoader) {
          setIsRefreshingDrivers(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDrivers();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDrivers]);

  // =========================================================
  // Dispatch API
  // =========================================================

  useEffect(() => {
    const controller = new AbortController();

    void fetchDispatches(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchDispatches]);

  const handleRefreshDispatches = async (): Promise<void> => {
    await fetchDispatches();
  };

  // =========================================================
  // Vehicle Actions
  // =========================================================

  const handleOpenCreateVehicle = (): void => {
    setSelectedVehicle(null);
    setVehicleError(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle): void => {
    setSelectedVehicle(vehicle);
    setVehicleError(null);
    setIsVehicleModalOpen(true);
  };

  const handleCloseVehicleModal = (): void => {
    if (isSubmittingVehicle) {
      return;
    }

    setIsVehicleModalOpen(false);
    setSelectedVehicle(null);
    setVehicleError(null);
  };

  const handleVehicleSubmit = async (
    data: CreateVehicleRequest,
  ): Promise<void> => {
    setIsSubmittingVehicle(true);
    setVehicleError(null);

    try {
      if (selectedVehicle) {
        await vehicleService.update(selectedVehicle.id, data);
      } else {
        await vehicleService.create(data);
      }

      await loadVehicles(true);

      setIsVehicleModalOpen(false);
      setSelectedVehicle(null);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setVehicleError(message);

      throw new Error(message);
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  const handleConfirmDeleteVehicle = async (): Promise<void> => {
    if (!vehiclePendingDelete) {
      return;
    }

    setIsDeletingVehicle(true);
    setVehicleError(null);

    try {
      await vehicleService.remove(vehiclePendingDelete.id);

      setVehicles((currentVehicles) =>
        currentVehicles.filter(
          (vehicle) => vehicle.id !== vehiclePendingDelete.id,
        ),
      );

      setVehiclePendingDelete(null);

      if (selectedVehicle?.id === vehiclePendingDelete.id) {
        setSelectedVehicle(null);
        setIsVehicleModalOpen(false);
      }
    } catch (error: unknown) {
      setVehicleError(getErrorMessage(error));
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  // =========================================================
  // Driver Actions
  // =========================================================

  const handleOpenCreateDriver = (): void => {
    setSelectedDriver(null);
    setDriverError(null);
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: Driver): void => {
    setSelectedDriver(driver);
    setDriverError(null);
    setIsDriverModalOpen(true);
  };

  const handleCloseDriverModal = (): void => {
    if (isSubmittingDriver) {
      return;
    }

    setIsDriverModalOpen(false);
    setSelectedDriver(null);
    setDriverError(null);
  };

  const handleDriverSubmit = async (
    data: CreateDriverRequest,
  ): Promise<void> => {
    setIsSubmittingDriver(true);
    setDriverError(null);

    try {
      if (selectedDriver) {
        const updateRequest: UpdateDriverRequest = {
          id: selectedDriver.id,
          ...data,
        };

        await driverService.update(selectedDriver.id, updateRequest);
      } else {
        await driverService.create(data);
      }

      await loadDrivers(true);

      setIsDriverModalOpen(false);
      setSelectedDriver(null);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setDriverError(message);

      throw new Error(message);
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  const handleConfirmDeleteDriver = async (): Promise<void> => {
    if (!driverPendingDelete) {
      return;
    }

    setIsDeletingDriver(true);
    setDriverError(null);

    try {
      await driverService.remove(driverPendingDelete.id);

      setDrivers((currentDrivers) =>
        currentDrivers.filter((driver) => driver.id !== driverPendingDelete.id),
      );

      setDriverPendingDelete(null);

      if (selectedDriver?.id === driverPendingDelete.id) {
        setSelectedDriver(null);
        setIsDriverModalOpen(false);
      }
    } catch (error: unknown) {
      setDriverError(getErrorMessage(error));
    } finally {
      setIsDeletingDriver(false);
    }
  };

  // =========================================================
  // Dispatch Actions
  // =========================================================

  const handleOpenCreateDispatch = (): void => {
    clearDispatchError();
    setSelectedDispatch(null);
    setIsDispatchModalOpen(true);
  };

  const handleOpenEditDispatch = (dispatch: Dispatch): void => {
    clearDispatchError();
    setSelectedDispatch(dispatch);
    setIsDispatchModalOpen(true);
  };

  const handleCloseDispatchModal = (): void => {
    if (isSubmittingDispatch) {
      return;
    }

    setIsDispatchModalOpen(false);
    setSelectedDispatch(null);
  };

  const handleDispatchSubmit = async (
    data: CreateDispatchRequest,
  ): Promise<void> => {
    setIsSubmittingDispatch(true);
    clearDispatchError();

    try {
      // فعلاً API و store فقط createDispatch را دارند.
      // برای ویرایش واقعی، در مرحله بعد updateDispatch را
      // به dispatchService و useDispatchStore اضافه می‌کنیم.
      await createDispatch(data);

      await fetchDispatches();

      setIsDispatchModalOpen(false);
      setSelectedDispatch(null);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleDeleteDispatch = async (dispatch: Dispatch): Promise<void> => {
    try {
      await dispatchService.remove(dispatch.id);

      // حذف لوکال انجام نمی‌دهیم؛ لیست مجدداً از Store / API خوانده می‌شود.
      await fetchDispatches();
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
    }
  };

  const handleStatusChange = async (
    id: number,
    status: string,
  ): Promise<void> => {
    try {
      await updateDispatchStatus(id, {
        status,
      });

      await fetchDispatches();
    } catch (error: unknown) {
      console.error(error);
    }
  };

  // =========================================================
  // Active Error
  // =========================================================

  const activeError =
    activeTab === 'vehicles'
      ? vehicleError
      : activeTab === 'drivers'
        ? driverError
        : dispatchesError;

  const handleCloseError = (): void => {
    if (activeTab === 'vehicles') {
      setVehicleError(null);
    } else if (activeTab === 'drivers') {
      setDriverError(null);
    } else {
      clearDispatchError();
    }
  };

  return (
    <>
      <div dir="rtl" className="flex flex-col gap-6 font-vazir">
        {/* =================================================
            Header
        ================================================= */}

        <header className="flex flex-col gap-5 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              {activeTab === 'vehicles' ? (
                <Car size={28} />
              ) : activeTab === 'drivers' ? (
                <Users size={28} />
              ) : (
                <Navigation size={28} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-neutral-900 dark:text-white">
                  مدیریت جامع ناوگان 
                </h1>

                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                  SunPath Fleet
                </span>
              </div>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                پایش، تخصیص خودرو به راننده کنترل مأموریت‌ها
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-2xl border border-neutral-200 bg-neutral-100/80 p-1.5 dark:border-neutral-800 dark:bg-neutral-950">
              <TabButton
                active={activeTab === 'vehicles'}
                onClick={() => setActiveTab('vehicles')}
                icon={<Car size={15} />}
                label="خودروها"
                count={vehicles.length}
              />

              <TabButton
                active={activeTab === 'drivers'}
                onClick={() => setActiveTab('drivers')}
                icon={<User size={15} />}
                label="رانندگان"
                count={drivers.length}
              />

              <TabButton
                active={activeTab === 'dispatches'}
                onClick={() => setActiveTab('dispatches')}
                icon={<Navigation size={15} />}
                label="تخصیص و مأموریت‌ها"
                count={dispatches.length}
              />
            </div>

            {activeTab === 'vehicles' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadVehicles(true)}
                  disabled={isRefreshingVehicles}
                  aria-label="بارگذاری مجدد خودروها"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <RefreshCw
                    size={17}
                    className={isRefreshingVehicles ? 'animate-spin' : ''}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateVehicle}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700"
                >
                  <Plus size={18} />
                  ثبت خودرو جدید
                </button>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadDrivers(true)}
                  disabled={isRefreshingDrivers}
                  aria-label="بارگذاری مجدد رانندگان"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <RefreshCw
                    size={17}
                    className={isRefreshingDrivers ? 'animate-spin' : ''}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateDriver}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700"
                >
                  <UserPlus size={18} />
                  ثبت راننده جدید
                </button>
              </div>
            )}

            {activeTab === 'dispatches' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRefreshDispatches()}
                  disabled={dispatchesLoading}
                  aria-label="بارگذاری مجدد مأموریت‌ها"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <RefreshCw
                    size={17}
                    className={dispatchesLoading ? 'animate-spin' : ''}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateDispatch}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700"
                >
                  <Navigation size={18} />
                  ثبت
                </button>
              </div>
            )}
          </div>
        </header>

        {/* =================================================
            Error
        ================================================= */}

        <AnimatePresence initial={false}>
          {activeError && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              role="alert"
              className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              <div className="flex min-w-0 items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />

                <p className="text-sm leading-6">{activeError}</p>
              </div>

              <button
                type="button"
                onClick={handleCloseError}
                aria-label="بستن پیام خطا"
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <X size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            Tabs
        ================================================= */}

        {activeTab === 'vehicles' && (
          <VehiclesTab
            vehicles={vehicles}
            vehiclesState={vehiclesState}
            isRefreshing={isRefreshingVehicles}
            onRefresh={() => void loadVehicles(true)}
            onEdit={handleOpenEditVehicle}
            onDelete={(vehicle) => {
              setVehicleError(null);
              setVehiclePendingDelete(vehicle);
            }}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversTab
            drivers={drivers}
            driversState={driversState}
            isRefreshing={isRefreshingDrivers}
            onRefresh={() => void loadDrivers(true)}
            onEdit={handleOpenEditDriver}
            onDelete={(driver) => {
              setDriverError(null);
              setDriverPendingDelete(driver);
            }}
          />
        )}

        {activeTab === 'dispatches' && (
          <DispatchesTab
            dispatches={dispatches}
            vehicles={vehicles}
            drivers={drivers}
            isLoading={dispatchesLoading}
            onRefresh={handleRefreshDispatches}
            onAdd={handleOpenCreateDispatch}
            onEdit={handleOpenEditDispatch}
            onDelete={handleDeleteDispatch}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* =====================================================
          Modals
      ===================================================== */}

      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        initialData={selectedVehicle}
        isSubmitting={isSubmittingVehicle}
        onClose={handleCloseVehicleModal}
        onSubmit={handleVehicleSubmit}
      />

      <DriverFormModal
        isOpen={isDriverModalOpen}
        initialData={selectedDriver}
        isSubmitting={isSubmittingDriver}
        onClose={handleCloseDriverModal}
        onSubmit={handleDriverSubmit}
      />

      <DispatchFormModal
        isOpen={isDispatchModalOpen}
        mode={selectedDispatch ? 'edit' : 'create'}
        initialData={selectedDispatch}
        vehicles={vehicles}
        drivers={drivers}
        isSubmitting={isSubmittingDispatch}
        onClose={handleCloseDispatchModal}
        onSubmit={handleDispatchSubmit}
      />

      {/* =====================================================
          Delete Vehicle
      ===================================================== */}

      <ConfirmDeleteModal
        isOpen={Boolean(vehiclePendingDelete)}
        title="حذف خودرو"
        isDeleting={isDeletingVehicle}
        onCancel={() => {
          if (!isDeletingVehicle) {
            setVehiclePendingDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteVehicle}
      >
        آیا از حذف خودرو با پلاک{' '}
        <strong dir="ltr" className="mx-1 text-neutral-900 dark:text-white">
          {vehiclePendingDelete?.plateNumber}
        </strong>{' '}
        اطمینان دارید؟
      </ConfirmDeleteModal>

      {/* =====================================================
          Delete Driver
      ===================================================== */}

      <ConfirmDeleteModal
        isOpen={Boolean(driverPendingDelete)}
        title="حذف راننده"
        isDeleting={isDeletingDriver}
        onCancel={() => {
          if (!isDeletingDriver) {
            setDriverPendingDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteDriver}
      >
        آیا از حذف راننده{' '}
        <strong className="mx-1 text-neutral-900 dark:text-white">
          {driverPendingDelete?.firstName} {driverPendingDelete?.lastName}
        </strong>{' '}
        اطمینان دارید؟
      </ConfirmDeleteModal>
    </>
  );
}

/* ============================================================
   Tab Button
============================================================ */

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}

function TabButton({ active, onClick, icon, label, count }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
        active
          ? 'text-orange-700 dark:text-orange-400'
          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTabBadge"
          className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-neutral-900"
        />
      )}

      <span className="relative z-10">{icon}</span>

      <span className="relative z-10">{label}</span>

      <span className="relative z-10 rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
        {count.toLocaleString('fa-IR')}
      </span>
    </button>
  );
}

/* ============================================================
   Delete Modal
============================================================ */

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

function ConfirmDeleteModal({
  isOpen,
  title,
  children,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-vazir"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            type="button"
            aria-label="بستن پنجره حذف"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            disabled={isDeleting}
            className="absolute inset-0 h-full w-full cursor-default bg-neutral-950/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 14,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 14,
            }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5 dark:border-neutral-800">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <Trash2 size={21} />
                </div>

                <div>
                  <h2 className="text-base font-black text-neutral-900 dark:text-white">
                    {title}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    این عملیات قابل بازگشت نیست.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                aria-label="بستن پنجره حذف"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                {children}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 p-5 dark:border-neutral-800 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}

                {isDeleting ? 'در حال حذف...' : 'تایید و حذف'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
