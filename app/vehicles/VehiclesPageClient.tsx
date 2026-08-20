'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { DriverFormModal } from '@/components/drivers/DriverFormModal';
import { DriverStats } from '@/components/drivers/DriverStats';
import { DriverTableRow } from '@/components/drivers/DriverTableRow';
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleTableRow } from '@/components/vehicles/VehicleTableRow';
import { faNumber } from '@/lib/format';
import { driverService } from '@/services/driverService';
import { vehicleService } from '@/services/vehicleService';
import type {
  CreateDriverRequest,
  Driver,
  UpdateDriverRequest,
} from '@/types/driver';
import type { CreateVehicleRequest, Vehicle } from '@/types/vehicle';

type ActiveTab = 'vehicles' | 'drivers';
type LoadState = 'loading' | 'error' | 'success';
type VehicleStatusFilter = 'all' | 'active' | 'inactive';
type VehicleTypeFilter = 'all' | '0' | '1' | '2' | '3';

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

const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLocaleLowerCase('fa')
    .replace(/[۰-۹]/g, (character) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(character)))
    .replace(/[٠-٩]/g, (character) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(character)));
};

export default function VehiclesPageClientPageClient({
  initialDrivers,
  initialDriversError,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('vehicles');

  // --- وضعیت‌های مربوط به خودروها ---
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesState, setVehiclesState] = useState<LoadState>('loading');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>('all');
  const [isRefreshingVehicles, setIsRefreshingVehicles] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [vehiclePendingDelete, setVehiclePendingDelete] =
    useState<Vehicle | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // --- وضعیت‌های مربوط به رانندگان ---
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [driversState, setDriversState] = useState<LoadState>(
    initialDriversError ? 'error' : 'success',
  );
  const [driverSearch, setDriverSearch] = useState('');
  const [isRefreshingDrivers, setIsRefreshingDrivers] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [driverPendingDelete, setDriverPendingDelete] = useState<Driver | null>(
    null,
  );
  const [isDeletingDriver, setIsDeletingDriver] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);

  // ==================== عملیات خودروها ====================
  const loadVehicles = useCallback(
    async (withRefreshLoader = false): Promise<void> => {
      try {
        const data = await vehicleService.getAll();
        setVehicles(Array.isArray(data) ? data : []);
        setVehiclesState('success');
        setVehicleError(null);
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
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const data = await vehicleService.getAll();
        if (isMounted) {
          setVehicles(Array.isArray(data) ? data : []);
          setVehiclesState('success');
          setVehicleError(null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setVehicleError(getErrorMessage(error));
          setVehiclesState('error');
        }
      }
    };

    void fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = normalizeText(vehicleSearch);

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
  }, [vehicles, vehicleSearch, statusFilter, typeFilter]);

  const vehicleStatsData = useMemo(
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

  const handleRefreshVehicles = async (): Promise<void> => {
    setIsRefreshingVehicles(true);
    await loadVehicles(true);
  };

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
    if (isSubmittingVehicle) return;
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
    if (!vehiclePendingDelete) return;

    setIsDeletingVehicle(true);
    setVehicleError(null);

    try {
      await vehicleService.remove(vehiclePendingDelete.id);

      setVehicles((currentVehicles) =>
        currentVehicles.filter(
          (vehicle) => vehicle.id !== vehiclePendingDelete.id,
        ),
      );

      if (selectedVehicle?.id === vehiclePendingDelete.id) {
        setSelectedVehicle(null);
        setIsVehicleModalOpen(false);
      }

      setVehiclePendingDelete(null);
    } catch (error: unknown) {
      setVehicleError(getErrorMessage(error));
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  const clearVehicleFilters = (): void => {
    setVehicleSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveVehicleFilters =
    vehicleSearch.trim().length > 0 ||
    statusFilter !== 'all' ||
    typeFilter !== 'all';

  // ==================== عملیات رانندگان ====================
  const loadDrivers = async (withRefreshLoader = false): Promise<void> => {
    if (withRefreshLoader) setIsRefreshingDrivers(true);
    else setDriversState('loading');

    setDriverError(null);

    try {
      const data = await driverService.getAll();
      setDrivers(data);
      setDriversState('success');
    } catch (error: unknown) {
      setDriverError(getErrorMessage(error));
      setDriversState('error');
    } finally {
      if (withRefreshLoader) setIsRefreshingDrivers(false);
    }
  };

  const filteredDrivers = useMemo(() => {
    const query = driverSearch.trim().toLocaleLowerCase('fa');

    if (!query) return drivers;

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
  }, [drivers, driverSearch]);

  const driverStatsData = useMemo(
    () => ({
      total: drivers.length,
      licensed: drivers.filter((driver) => driver.licenseType >= 1).length,
      active: drivers.filter((driver) => driver.licenseType >= 2).length,
    }),
    [drivers],
  );

  const handleOpenCreateDriver = () => {
    setSelectedDriver(null);
    setDriverError(null);
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverError(null);
    setIsDriverModalOpen(true);
  };

  const handleCloseDriverModal = () => {
    if (isSubmittingDriver) return;
    setIsDriverModalOpen(false);
    setSelectedDriver(null);
    setDriverError(null);
  };

  const handleDriverSubmit = async (data: CreateDriverRequest) => {
    setIsSubmittingDriver(true);
    setDriverError(null);

    try {
      if (selectedDriver) {
        const updateRequest: UpdateDriverRequest = {
          id: selectedDriver.id,
          ...data,
        };

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

  const handleConfirmDeleteDriver = async () => {
    if (!driverPendingDelete) return;

    setIsDeletingDriver(true);
    setDriverError(null);

    try {
      await driverService.remove(driverPendingDelete.id);

      setDrivers((currentDrivers) =>
        currentDrivers.filter((driver) => driver.id !== driverPendingDelete.id),
      );

      if (selectedDriver?.id === driverPendingDelete.id) {
        setSelectedDriver(null);
        setIsDriverModalOpen(false);
      }

      setDriverPendingDelete(null);
    } catch (error: unknown) {
      setDriverError(getErrorMessage(error));
    } finally {
      setIsDeletingDriver(false);
    }
  };

  return (
    <>
      <div dir="rtl" className="flex flex-col gap-6 font-vazir">
        {/* ================= Header و نوار تب‌ها ================= */}
        <header className="flex flex-col gap-5 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              {activeTab === 'vehicles' ? (
                <Car size={28} />
              ) : (
                <Users size={28} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-neutral-900 dark:text-white">
                  مدیریت جامع ناوگان و رانندگان
                </h1>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                  SunPath Fleet
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                پایش، ثبت و کنترل وضعیت ناوگان خودرویی و کادر رانندگان
              </p>
            </div>
          </div>

          {/* تب‌ها و دکمه Action بر اساس تب فعال */}
          <div className="flex flex-wrap items-center gap-3">
            {/* انتخاب‌گر تب با انیمیشن روان */}
            <div className="flex rounded-2xl border border-neutral-200 bg-neutral-100/80 p-1.5 dark:border-neutral-800 dark:bg-neutral-950">
              <button
                type="button"
                onClick={() => setActiveTab('vehicles')}
                className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'vehicles'
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {activeTab === 'vehicles' && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-neutral-900"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Car size={16} className="relative z-10" />
                <span className="relative z-10">خودروها</span>
                <span className="relative z-10 rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
                  {faNumber(vehicles.length)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('drivers')}
                className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'drivers'
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {activeTab === 'drivers' && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-neutral-900"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <User size={16} className="relative z-10" />
                <span className="relative z-10">رانندگان</span>
                <span className="relative z-10 rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
                  {faNumber(drivers.length)}
                </span>
              </button>
            </div>

            {/* دکمه‌های عملیات اصلی هماهنگ با تب انتخابی */}
            {activeTab === 'vehicles' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRefreshVehicles()}
                  disabled={isRefreshingVehicles}
                  aria-label="به‌روزرسانی خودروها"
                  title="به‌روزرسانی"
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
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-orange-600/40 active:scale-95"
                >
                  <Plus size={18} />
                  ثبت خودرو جدید
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadDrivers(true)}
                  disabled={isRefreshingDrivers}
                  aria-label="به‌روزرسانی رانندگان"
                  title="به‌روزرسانی"
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
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-orange-600/40 active:scale-95"
                >
                  <UserPlus size={18} />
                  ثبت راننده جدید
                </button>
              </div>
            )}
          </div>
        </header>

        {/* خطاهای عملیاتی */}
        <AnimatePresence initial={false}>
          {(activeTab === 'vehicles' ? vehicleError : driverError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
              className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              <div className="flex min-w-0 items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <p className="text-sm leading-6">
                  {activeTab === 'vehicles' ? vehicleError : driverError}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  activeTab === 'vehicles'
                    ? setVehicleError(null)
                    : setDriverError(null)
                }
                aria-label="بستن پیام خطا"
                title="بستن"
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <X size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= تب ۱: خودروها ================= */}
        {activeTab === 'vehicles' && (
          <motion.div
            key="tab-vehicles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <VehicleStats {...vehicleStatsData} />

            <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800/50 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full max-w-md">
                  <Search
                    className="absolute right-4 top-1/2 -tranneutral-y-1/2 text-neutral-400"
                    size={18}
                  />

                  <input
                    type="search"
                    value={vehicleSearch}
                    onChange={(event) => setVehicleSearch(event.target.value)}
                    placeholder="جست‌وجو بر اساس پلاک، مدل یا نام راننده..."
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-4 pr-12 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Filter
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -tranneutral-y-1/2 text-neutral-400"
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value as VehicleStatusFilter,
                        )
                      }
                      className="appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-8 pr-9 text-xs font-semibold text-neutral-600 outline-none transition-colors focus:border-orange-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
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
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-600 outline-none transition-colors focus:border-orange-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                  >
                    <option value="all">همه انواع خودرو</option>
                    <option value="0">سواری</option>
                    <option value="1">وانت و نیسان</option>
                    <option value="2">کامیون و تریلی</option>
                    <option value="3">موتورسیکلت</option>
                  </select>

                  {hasActiveVehicleFilters && (
                    <button
                      type="button"
                      onClick={clearVehicleFilters}
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400"
                    >
                      <X size={14} />
                      پاک‌کردن فیلترها
                    </button>
                  )}

                  <div className="hidden h-6 w-px bg-neutral-200 dark:bg-neutral-800 md:block" />

                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    تعداد: {faNumber(filteredVehicles.length)} خودرو
                  </span>
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
                      <LoadingState text="در حال دریافت لیست خودروها..." />
                    ) : vehiclesState === 'error' ? (
                      <ErrorState
                        onRetry={() => void handleRefreshVehicles()}
                      />
                    ) : filteredVehicles.length === 0 ? (
                      <EmptyState
                        hasFilter={hasActiveVehicleFilters}
                        emptyText="هنوز خودرویی در سیستم ثبت نشده است"
                        filterText="هیچ خودرویی با این مشخصات یافت نشد"
                      />
                    ) : (
                      <AnimatePresence mode="popLayout" initial={false}>
                        {filteredVehicles.map((vehicle) => (
                          <VehicleTableRow
                            key={vehicle.id}
                            vehicle={vehicle}
                            onEdit={handleOpenEditVehicle}
                            onDelete={(v) => {
                              setVehicleError(null);
                              setVehiclePendingDelete(v);
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        )}

        {/* ================= تب ۲: رانندگان ================= */}
        {activeTab === 'drivers' && (
          <motion.div
            key="tab-drivers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <DriverStats {...driverStatsData} />

            <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800/50 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full max-w-md">
                  <Search
                    className="absolute right-4 top-1/2 -tranneutral-y-1/2 text-neutral-400"
                    size={18}
                  />

                  <input
                    type="search"
                    value={driverSearch}
                    onChange={(event) => setDriverSearch(event.target.value)}
                    placeholder="جستجو بر اساس نام، کد ملی یا تلفن..."
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-4 pr-12 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    <Filter size={14} />
                    فیلتر پیشرفته
                  </button>

                  <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />

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
                      <LoadingState text="در حال دریافت لیست رانندگان..." />
                    ) : driversState === 'error' ? (
                      <ErrorState onRetry={() => void loadDrivers()} />
                    ) : filteredDrivers.length === 0 ? (
                      <EmptyState
                        hasFilter={driverSearch.trim().length > 0}
                        emptyText="هنوز راننده‌ای در سیستم ثبت نشده است"
                        filterText="هیچ راننده‌ای با این مشخصات یافت نشد"
                      />
                    ) : (
                      <AnimatePresence mode="popLayout" initial={false}>
                        {filteredDrivers.map((driver) => (
                          <DriverTableRow
                            key={driver.id}
                            driver={driver}
                            onEdit={handleOpenEditDriver}
                            onDelete={(d) => {
                              setDriverError(null);
                              setDriverPendingDelete(d);
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        )}
      </div>

      {/* مودال خودرو */}
      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        initialData={selectedVehicle}
        isSubmitting={isSubmittingVehicle}
        onClose={handleCloseVehicleModal}
        onSubmit={handleVehicleSubmit}
      />

      {/* مودال راننده */}
      <DriverFormModal
        isOpen={isDriverModalOpen}
        initialData={selectedDriver}
        isSubmitting={isSubmittingDriver}
        onClose={handleCloseDriverModal}
        onSubmit={handleDriverSubmit}
      />

      {/* مودال تایید حذف خودرو */}
      <ConfirmDeleteModal
        isOpen={Boolean(vehiclePendingDelete)}
        title="حذف خودرو"
        isDeleting={isDeletingVehicle}
        onCancel={() => {
          if (!isDeletingVehicle) setVehiclePendingDelete(null);
        }}
        onConfirm={handleConfirmDeleteVehicle}
      >
        آیا از حذف خودرو با پلاک{' '}
        <strong dir="ltr" className="mx-1 text-neutral-900 dark:text-white">
          {vehiclePendingDelete?.plateNumber}
        </strong>{' '}
        اطمینان دارید؟
      </ConfirmDeleteModal>

      {/* مودال تایید حذف راننده */}
      <ConfirmDeleteModal
        isOpen={Boolean(driverPendingDelete)}
        title="حذف راننده"
        isDeleting={isDeletingDriver}
        onCancel={() => {
          if (!isDeletingDriver) setDriverPendingDelete(null);
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

// ================= کامپوننت‌های کمکی مشترک =================

function LoadingState({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={5} className="py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="h-12 w-12 rounded-full border-4 border-neutral-100 dark:border-neutral-800" />
            <Loader2
              className="absolute inset-0 animate-spin text-orange-500"
              size={48}
            />
          </div>
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {text}
          </span>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({
  hasFilter,
  emptyText,
  filterText,
}: {
  hasFilter: boolean;
  emptyText: string;
  filterText: string;
}) {
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
            {hasFilter ? filterText : emptyText}
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
            className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            تلاش دوباره
          </button>
        </div>
      </td>
    </tr>
  );
}

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
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.18 }}
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
                aria-label="بستن"
                title="بستن"
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
                {isDeleting ? 'در حال حذف...' : 'تایید و حذف'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
