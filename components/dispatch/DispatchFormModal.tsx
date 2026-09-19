'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  Flag,
  Info,
  Loader2,
  MapPin,
  Milestone,
  Navigation,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

import LocationPickerMap from '@/components/dispatch/LocationPickerMap';
import type { CreateDispatchRequest, Dispatch } from '@/types/dispatch';
import type { Driver } from '@/types/driver';
import type { Vehicle } from '@/types/vehicle';

interface DispatchFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Dispatch | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDispatchRequest) => Promise<void>;
}

type Coords = {
  lat: number;
  lng: number;
};

type PickMode = 'origin' | 'destination';

type RouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  loading: boolean;
};

type DispatchFormValues = {
  vehicleId: number | '';
  driverId: number | '';
  title: string;
  description: string;
  originTitle: string;
  destinationTitle: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  pickMode: PickMode;
  formError: string | null;
};

const selectBase =
  'w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none transition dark:[color-scheme:dark]';

const inputLight =
  'border-neutral-200 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white';

const inputDark =
  'dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-orange-500 dark:focus:bg-neutral-900';

const selectOptionBase =
  'bg-white text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100';

/* ============================================================
   Vehicle / License Rules
============================================================ */

/**
 * vehicleType:
 * 0 = سواری
 * 1 = وانت / نیسان
 * 2 = کامیون / تریلی
 * 3 = موتورسیکلت
 *
 * licenseType:
 * 1 = پایه ۱
 * 2 = پایه ۲
 * 3 = پایه ۳
 *
 * قوانین فعلی سیستم:
 *
 * پایه ۱:
 * - سواری
 * - وانت / نیسان
 * - کامیون / تریلی
 *
 * پایه ۲:
 * - سواری
 * - وانت / نیسان
 *
 * پایه ۳:
 * - سواری
 *
 * موتورسیکلت:
 * در مدل فعلی Driver مجوز جداگانه موتور نداریم،
 * بنابراین هیچ‌کدام از پایه‌های ۱/۲/۳ به‌صورت خودکار
 * مجاز به موتور در نظر گرفته نمی‌شوند.
 */
function canDriverDriveVehicle(
  licenseType: number,
  vehicleType: number,
): boolean {
  switch (vehicleType) {
    // سواری
    case 0:
      return [1, 2, 3].includes(licenseType);

    // وانت / نیسان
    case 1:
      return [1, 2].includes(licenseType);

    // کامیون / تریلی
    case 2:
      return licenseType === 1;

    // موتورسیکلت
    case 3:
      return false;

    default:
      return false;
  }
}

function getVehicleTypeLabel(vehicleType: number): string {
  switch (vehicleType) {
    case 0:
      return 'سواری';

    case 1:
      return 'وانت / نیسان';

    case 2:
      return 'کامیون / تریلی';

    case 3:
      return 'موتورسیکلت';

    default:
      return 'نامشخص';
  }
}

function getLicenseTypeLabel(licenseType: number): string {
  switch (licenseType) {
    case 1:
      return 'پایه ۱';

    case 2:
      return 'پایه ۲';

    case 3:
      return 'پایه ۳';

    default:
      return 'نامشخص';
  }
}

function getRequiredLicenseDescription(vehicleType: number): string {
  switch (vehicleType) {
    case 0:
      return 'رانندگان دارای گواهینامه پایه ۱، ۲ یا ۳';

    case 1:
      return 'رانندگان دارای گواهینامه پایه ۱ یا ۲';

    case 2:
      return 'فقط رانندگان دارای گواهینامه پایه ۱';

    case 3:
      return 'برای موتورسیکلت باید مجوز موتور به اطلاعات راننده اضافه شود';

    default:
      return 'نوع خودرو مشخص نیست';
  }
}

/* ============================================================
   Helpers
============================================================ */

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} دقیقه`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  return remainingMinutes > 0
    ? `${hours} ساعت و ${remainingMinutes} دقیقه`
    : `${hours} ساعت`;
}

/* ============================================================
   Form Content
============================================================ */

function DispatchFormContent({
  mode,
  initialData,
  vehicles,
  drivers,
  isSubmitting,
  onClose,
  onSubmit,
}: Omit<DispatchFormModalProps, 'isOpen'>) {
  const [form, setForm] = useState<DispatchFormValues>(() => ({
    vehicleId: initialData?.vehicleId ?? '',
    driverId: initialData?.driverId ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    originTitle: initialData?.originTitle ?? '',
    destinationTitle: initialData?.destinationTitle ?? '',

    originCoords:
      initialData?.originLatitude != null &&
      initialData?.originLongitude != null
        ? {
            lat: initialData.originLatitude,
            lng: initialData.originLongitude,
          }
        : null,

    destinationCoords:
      initialData?.destinationLatitude != null &&
      initialData?.destinationLongitude != null
        ? {
            lat: initialData.destinationLatitude,
            lng: initialData.destinationLongitude,
          }
        : null,

    pickMode: 'origin',
    formError: null,
  }));

  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(
    null,
  );

  const isEditMode = mode === 'edit';

  /* ============================================================
     Selected Vehicle
  ============================================================ */

  const selectedVehicleObj = useMemo(() => {
    if (!form.vehicleId) {
      return undefined;
    }

    return vehicles.find((vehicle) => vehicle.id === Number(form.vehicleId));
  }, [form.vehicleId, vehicles]);

  /* ============================================================
     Smart Driver Filtering
  ============================================================ */

  const compatibleDrivers = useMemo(() => {
    if (!selectedVehicleObj) {
      return [];
    }

    return drivers.filter((driver) => {
      /*
       * راننده غیرفعال نباید قابل تخصیص باشد.
       */
      if (driver.isActive === false) {
        return false;
      }

      return canDriverDriveVehicle(
        Number(driver.licenseType),
        Number(selectedVehicleObj.vehicleType),
      );
    });
  }, [drivers, selectedVehicleObj]);

  const selectedDriverObj = useMemo(() => {
    if (!form.driverId) {
      return undefined;
    }

    return drivers.find((driver) => driver.id === Number(form.driverId));
  }, [drivers, form.driverId]);

  /* ============================================================
     Remove incompatible driver after vehicle change
  ============================================================ */

  useEffect(() => {
    if (!form.driverId || !selectedVehicleObj) {
      return;
    }

    const currentDriver = drivers.find(
      (driver) => driver.id === Number(form.driverId),
    );

    if (!currentDriver) {
      setForm((current) => ({
        ...current,
        driverId: '',
      }));

      return;
    }

    const isCompatible = canDriverDriveVehicle(
      Number(currentDriver.licenseType),
      Number(selectedVehicleObj.vehicleType),
    );

    const isActive = currentDriver.isActive !== false;

    if (!isCompatible || !isActive) {
      setForm((current) => ({
        ...current,
        driverId: '',
        formError:
          'راننده قبلی مجاز به رانندگی با خودروی انتخاب‌شده نیست. لطفاً راننده دیگری انتخاب کنید.',
      }));
    }
  }, [drivers, form.driverId, selectedVehicleObj]);

  /* ============================================================
     Route Estimate
  ============================================================ */

  useEffect(() => {
    if (!form.originCoords || !form.destinationCoords) {
      setRouteEstimate(null);
      return;
    }

    let isMounted = true;

    const calculateEta = async (): Promise<void> => {
      setRouteEstimate((previous) =>
        previous
          ? {
              ...previous,
              loading: true,
            }
          : {
              distanceKm: 0,
              durationMinutes: 0,
              durationFormatted: '',
              loading: true,
            },
      );

      try {
        const origin = form.originCoords;
        const destination = form.destinationCoords;

        if (!origin || !destination) {
          return;
        }

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${origin.lng},${origin.lat};` +
          `${destination.lng},${destination.lat}` +
          '?overview=false';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`OSRM request failed: ${response.status}`);
        }

        const data = (await response.json()) as {
          routes?: Array<{
            distance: number;
            duration: number;
          }>;
        };

        if (!isMounted) {
          return;
        }

        const route = data.routes?.[0];

        if (!route) {
          throw new Error('Route not found');
        }

        const distanceKm = Number((route.distance / 1000).toFixed(1));

        /*
         * OSRM ترافیک لحظه‌ای ارائه نمی‌کند.
         * این ضریب صرفاً حاشیه تخمینی زمان است.
         */
        const durationMinutes = Math.round((route.duration / 60) * 1.25);

        setRouteEstimate({
          distanceKm,
          durationMinutes,
          durationFormatted: formatDuration(durationMinutes),
          loading: false,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        const origin = form.originCoords;
        const destination = form.destinationCoords;

        if (!origin || !destination) {
          return;
        }

        /*
         * Haversine fallback
         */
        const earthRadiusKm = 6371;

        const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;

        const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((origin.lat * Math.PI) / 180) *
            Math.cos((destination.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        /*
         * 1.3 برای تقریب پیچ‌وخم مسیر جاده‌ای.
         */
        const estimatedDistanceKm = earthRadiusKm * c * 1.3;

        /*
         * سرعت میانگین فرضی 35km/h
         */
        const durationMinutes = Math.round((estimatedDistanceKm / 35) * 60);

        setRouteEstimate({
          distanceKm: Number(estimatedDistanceKm.toFixed(1)),
          durationMinutes,
          durationFormatted: formatDuration(durationMinutes),
          loading: false,
        });
      }
    };

    void calculateEta();

    return () => {
      isMounted = false;
    };
  }, [form.originCoords, form.destinationCoords]);

  /* ============================================================
     Vehicle Select
  ============================================================ */

  const handleVehicleSelect = (vehicleIdValue: string): void => {
    const vehicleId = vehicleIdValue ? Number(vehicleIdValue) : '';

    setForm((current) => ({
      ...current,
      vehicleId,
      /*
       * راننده را فعلاً نگه می‌داریم.
       * useEffect بالا بررسی می‌کند که با خودروی جدید
       * سازگار هست یا خیر.
       */
      formError: null,
    }));
  };

  /* ============================================================
     Driver Select
  ============================================================ */

  const handleDriverSelect = (driverIdValue: string): void => {
    const driverId = driverIdValue ? Number(driverIdValue) : '';

    setForm((currentForm) => {
      const selectedDriver = drivers.find((driver) => driver.id === driverId);

      const updatedOriginTitle =
        !currentForm.originTitle && selectedDriver
          ? `موقعیت جاری (${selectedDriver.firstName} ${selectedDriver.lastName})`
          : currentForm.originTitle;

      return {
        ...currentForm,
        driverId,
        originTitle: updatedOriginTitle,
        formError: null,
      };
    });
  };

  /* ============================================================
     Map
  ============================================================ */

  const handleMapSelect = (lat: number, lng: number): void => {
    setForm((currentForm) => {
      if (currentForm.pickMode === 'origin') {
        return {
          ...currentForm,
          originCoords: {
            lat,
            lng,
          },
          originTitle:
            currentForm.originTitle ||
            `مبدأ (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          pickMode: 'destination',
        };
      }

      return {
        ...currentForm,
        destinationCoords: {
          lat,
          lng,
        },
        destinationTitle:
          currentForm.destinationTitle ||
          `مقصد (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      };
    });
  };

  /* ============================================================
     Submit
  ============================================================ */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!form.vehicleId) {
      setForm((current) => ({
        ...current,
        formError: 'لطفاً خودرو را انتخاب کنید.',
      }));

      return;
    }

    if (!form.driverId) {
      setForm((current) => ({
        ...current,
        formError: 'لطفاً راننده مجاز برای این خودرو را انتخاب کنید.',
      }));

      return;
    }

    const vehicle = vehicles.find((item) => item.id === Number(form.vehicleId));

    if (!vehicle) {
      setForm((current) => ({
        ...current,
        formError: 'خودروی انتخاب‌شده معتبر نیست.',
      }));

      return;
    }

    const driver = drivers.find((item) => item.id === Number(form.driverId));

    if (!driver) {
      setForm((current) => ({
        ...current,
        formError: 'راننده انتخاب‌شده معتبر نیست.',
      }));

      return;
    }

    /*
     * مهم:
     * فقط به فیلتر UI اعتماد نمی‌کنیم.
     * هنگام Submit نیز دوباره مجوز را بررسی می‌کنیم.
     */
    if (
      !canDriverDriveVehicle(
        Number(driver.licenseType),
        Number(vehicle.vehicleType),
      )
    ) {
      setForm((current) => ({
        ...current,
        driverId: '',
        formError:
          `${driver.firstName} ${driver.lastName} با گواهینامه ` +
          `${getLicenseTypeLabel(Number(driver.licenseType))} ` +
          `مجاز به رانندگی با ${getVehicleTypeLabel(
            Number(vehicle.vehicleType),
          )} نیست.`,
      }));

      return;
    }

    if (driver.isActive === false) {
      setForm((current) => ({
        ...current,
        driverId: '',
        formError:
          'راننده انتخاب‌شده غیرفعال است و امکان تخصیص مأموریت به او وجود ندارد.',
      }));

      return;
    }

    if (!form.title.trim()) {
      setForm((current) => ({
        ...current,
        formError: 'عنوان مأموریت الزامی است.',
      }));

      return;
    }

    if (!form.originTitle.trim()) {
      setForm((current) => ({
        ...current,
        formError: 'نام یا آدرس مبدأ را وارد کنید.',
      }));

      return;
    }

    if (!form.destinationTitle.trim()) {
      setForm((current) => ({
        ...current,
        formError: 'نام یا آدرس مقصد را وارد کنید.',
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      formError: null,
    }));

    try {
      await onSubmit({
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),

        title: form.title.trim(),

        description: form.description.trim() || null,

        originTitle: form.originTitle.trim(),

        originLatitude: form.originCoords?.lat ?? null,

        originLongitude: form.originCoords?.lng ?? null,

        destinationTitle: form.destinationTitle.trim(),

        destinationLatitude: form.destinationCoords?.lat ?? null,

        destinationLongitude: form.destinationCoords?.lng ?? null,
      });

      onClose();
    } catch (error: unknown) {
      setForm((current) => ({
        ...current,
        formError:
          error instanceof Error ? error.message : 'خطا در ثبت مأموریت',
      }));
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.96,
        y: 16,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.96,
        y: 16,
      }}
      className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Navigation size={22} />
          </div>

          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              {isEditMode
                ? 'ویرایش مأموریت دیسپچ'
                : 'تخصیص خودرو و تعریف مأموریت'}
            </h2>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              انتخاب هوشمند راننده بر اساس نوع خودرو و گواهینامه
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="بستن"
          className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
        >
          <X size={20} />
        </button>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        {form.formError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />

            <span>{form.formError}</span>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* =================================================
              Vehicle + Driver
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Vehicle */}

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Car size={15} className="text-orange-500" />
                  خودرو هدف
                  <span className="text-red-500">*</span>
                </span>

                {selectedVehicleObj && (
                  <span className="text-[11px] font-normal text-neutral-400">
                    {selectedVehicleObj.plateNumber}
                  </span>
                )}
              </label>

              <select
                value={form.vehicleId}
                onChange={(event) => handleVehicleSelect(event.target.value)}
                required
                disabled={isSubmitting}
                className={`${selectBase} ${inputLight} ${inputDark}`}
              >
                <option value="" className={selectOptionBase}>
                  انتخاب خودرو...
                </option>

                {vehicles.map((vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                    className={selectOptionBase}
                  >
                    {vehicle.plateNumber} - {vehicle.model || 'نامشخص'} -{' '}
                    {getVehicleTypeLabel(Number(vehicle.vehicleType))}
                  </option>
                ))}
              </select>

              {selectedVehicleObj && (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2 text-[11px] leading-5 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />

                  <div>
                    <span className="font-bold">
                      {getVehicleTypeLabel(
                        Number(selectedVehicleObj.vehicleType),
                      )}
                      :
                    </span>{' '}
                    {getRequiredLicenseDescription(
                      Number(selectedVehicleObj.vehicleType),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Driver */}

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <User size={15} className="text-orange-500" />
                  راننده مجری
                  <span className="text-red-500">*</span>
                </span>

                {selectedDriverObj && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                    <Activity size={12} className="animate-pulse" />

                    {getLicenseTypeLabel(Number(selectedDriverObj.licenseType))}
                  </span>
                )}
              </label>

              <select
                value={form.driverId}
                onChange={(event) => handleDriverSelect(event.target.value)}
                required
                disabled={
                  isSubmitting ||
                  !selectedVehicleObj ||
                  compatibleDrivers.length === 0
                }
                className={`${selectBase} ${inputLight} ${inputDark} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="" className={selectOptionBase}>
                  {!selectedVehicleObj
                    ? 'ابتدا خودرو را انتخاب کنید...'
                    : compatibleDrivers.length === 0
                      ? 'راننده مجاز پیدا نشد'
                      : 'انتخاب راننده مجاز...'}
                </option>

                {compatibleDrivers.map((driver) => (
                  <option
                    key={driver.id}
                    value={driver.id}
                    className={selectOptionBase}
                  >
                    {driver.firstName} {driver.lastName} -{' '}
                    {getLicenseTypeLabel(Number(driver.licenseType))}
                    {driver.phone ? ` (${driver.phone})` : ''}
                  </option>
                ))}
              </select>

              {selectedVehicleObj && compatibleDrivers.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} />

                  <span>
                    {compatibleDrivers.length} راننده مجاز برای این خودرو
                  </span>
                </div>
              )}

              {selectedVehicleObj && compatibleDrivers.length === 0 && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] leading-5 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />

                  <span>
                    هیچ راننده فعال و دارای گواهینامه مناسب برای این خودرو وجود
                    ندارد.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              Smart info
          ================================================= */}

          {!selectedVehicleObj && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-[11px] leading-5 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
              <Info size={15} className="mt-0.5 shrink-0" />

              <span>
                ابتدا خودرو را انتخاب کنید. سیستم براساس نوع خودرو فقط رانندگانی
                را نمایش می‌دهد که گواهینامه مناسب آن خودرو را دارند.
              </span>
            </div>
          )}

          {/* =================================================
              Title + Description
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                عنوان مأموریت <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                    formError: null,
                  }))
                }
                placeholder="مثال: تحویل محموله شعبه مرکزی"
                required
                disabled={isSubmitting}
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                دستورالعمل و نکات تکمیلی
              </label>

              <input
                type="text"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="مثال: بار حساس است، تردد از بزرگراه همت..."
                disabled={isSubmitting}
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>
          </div>

          {/* =================================================
              Origin + Destination
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <MapPin size={14} className="text-emerald-600" />
                عنوان یا آدرس مبدأ
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.originTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    originTitle: event.target.value,
                    formError: null,
                  }))
                }
                placeholder="نام انبار، شرکت یا آدرس مبدأ"
                required
                disabled={isSubmitting}
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <Flag size={14} className="text-rose-600" />
                عنوان یا آدرس مقصد
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.destinationTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    destinationTitle: event.target.value,
                    formError: null,
                  }))
                }
                placeholder="نام تحویل‌گیرنده یا آدرس مقصد"
                required
                disabled={isSubmitting}
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>
          </div>

          {/* =================================================
              Map controls
          ================================================= */}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              تعیین مستقیم نقاط روی نقشه:
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    pickMode: 'origin',
                  }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                  form.pickMode === 'origin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300'
                }`}
              >
                <MapPin size={13} />
                انتخاب مبدأ {form.originCoords ? '✓' : ''}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    pickMode: 'destination',
                  }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                  form.pickMode === 'destination'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300'
                }`}
              >
                <Flag size={13} />
                انتخاب مقصد {form.destinationCoords ? '✓' : ''}
              </button>
            </div>
          </div>

          {/* =================================================
              Map
          ================================================= */}

          <LocationPickerMap
            origin={form.originCoords}
            destination={form.destinationCoords}
            activeMode={form.pickMode}
            onLocationSelect={handleMapSelect}
          />

          {/* =================================================
              Route Estimate
          ================================================= */}

          {routeEstimate && (
            <motion.div
              initial={{
                opacity: 0,
                y: -6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-950/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
                  {routeEstimate.loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Clock size={18} />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    {routeEstimate.loading
                      ? 'در حال محاسبه مسیر...'
                      : `زمان تخمینی رسیدن: ${routeEstimate.durationFormatted}`}
                  </div>

                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    زمان مسیر به‌صورت تخمینی محاسبه شده است
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Milestone size={16} />

                <span>{routeEstimate.distanceKm} کیلومتر</span>
              </div>
            </motion.div>
          )}

          {/* =================================================
              Coordinates
          ================================================= */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              <span className="mb-1 block font-bold text-emerald-600 dark:text-emerald-400">
                مختصات ثبت‌شده مبدأ
              </span>

              <span dir="ltr" className="font-mono text-[11px]">
                {form.originCoords
                  ? `${form.originCoords.lat.toFixed(
                      6,
                    )}, ${form.originCoords.lng.toFixed(6)}`
                  : 'روی نقشه کلیک کنید'}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              <span className="mb-1 block font-bold text-rose-600 dark:text-rose-400">
                مختصات ثبت‌شده مقصد
              </span>

              <span dir="ltr" className="font-mono text-[11px]">
                {form.destinationCoords
                  ? `${form.destinationCoords.lat.toFixed(
                      6,
                    )}, ${form.destinationCoords.lng.toFixed(6)}`
                  : 'روی نقشه کلیک کنید'}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            Footer
        =================================================== */}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            انصراف
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !form.vehicleId || !form.driverId}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isEditMode ? (
              <CheckCircle2 size={16} />
            ) : (
              <Send size={16} />
            )}

            {isSubmitting
              ? isEditMode
                ? 'در حال به‌روزرسانی...'
                : 'در حال ارسال سیگنال دیسپچ...'
              : isEditMode
                ? 'ذخیره تغییرات'
                : 'ثبت و ارسال مأموریت'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ============================================================
   Modal
============================================================ */

export function DispatchFormModal({
  isOpen,
  mode,
  initialData,
  vehicles,
  drivers,
  isSubmitting,
  onClose,
  onSubmit,
}: DispatchFormModalProps) {
  const formKey = `${mode}-${initialData?.id ?? 'create'}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-vazir"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() => {
              if (!isSubmitting) {
                onClose();
              }
            }}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
          />

          <DispatchFormContent
            key={formKey}
            mode={mode}
            initialData={initialData}
            vehicles={vehicles}
            drivers={drivers}
            isSubmitting={isSubmitting}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
