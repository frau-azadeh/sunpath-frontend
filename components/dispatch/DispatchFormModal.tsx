'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Flag,
  Loader2,
  MapPin,
  Navigation,
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

function createInitialFormValues(
  initialData?: Dispatch | null,
): DispatchFormValues {
  return {
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
  };
}

function DispatchFormContent({
  mode,
  initialData,
  vehicles,
  drivers,
  isSubmitting,
  onClose,
  onSubmit,
}: Omit<DispatchFormModalProps, 'isOpen'>) {
  const [form, setForm] = useState<DispatchFormValues>(() =>
    createInitialFormValues(initialData),
  );

  const isEditMode = mode === 'edit';

  const resetForm = () => {
    setForm(createInitialFormValues());
  };

  const handleClose = () => {
    if (isSubmitting) return;

    resetForm();
    onClose();
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setForm((currentForm) => {
      if (currentForm.pickMode === 'origin') {
        return {
          ...currentForm,
          originCoords: { lat, lng },
          originTitle:
            currentForm.originTitle ||
            `مبدأ (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          pickMode: 'destination',
        };
      }

      return {
        ...currentForm,
        destinationCoords: { lat, lng },
        destinationTitle:
          currentForm.destinationTitle ||
          `مقصد (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.vehicleId) {
      setForm((currentForm) => ({
        ...currentForm,
        formError: 'لطفاً خودرو را انتخاب کنید.',
      }));
      return;
    }

    if (!form.driverId) {
      setForm((currentForm) => ({
        ...currentForm,
        formError: 'لطفاً راننده را انتخاب کنید.',
      }));
      return;
    }

    if (!form.title.trim()) {
      setForm((currentForm) => ({
        ...currentForm,
        formError: 'عنوان مأموریت الزامی است.',
      }));
      return;
    }

    if (!form.originTitle.trim()) {
      setForm((currentForm) => ({
        ...currentForm,
        formError: 'نام یا آدرس مبدأ را وارد کنید.',
      }));
      return;
    }

    if (!form.destinationTitle.trim()) {
      setForm((currentForm) => ({
        ...currentForm,
        formError: 'نام یا آدرس مقصد را وارد کنید.',
      }));
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
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

      resetForm();
    } catch (error: unknown) {
      setForm((currentForm) => ({
        ...currentForm,
        formError:
          error instanceof Error ? error.message : 'خطا در ثبت مأموریت',
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 16 }}
      className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Navigation size={22} />
          </div>

          <div>
            <h2 className="text-base font-black text-neutral-900 dark:text-white">
              {isEditMode ? 'ویرایش مأموریت' : 'تخصیص خودرو و تعریف مأموریت'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              تعیین راننده، خودرو و مسیریابی مبدأ تا مقصد
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="بستن فرم مأموریت"
          className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        {form.formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{form.formError}</span>
          </div>
        )}

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <Car size={15} className="text-orange-500" />
                خودرو هدف <span className="text-red-500">*</span>
              </label>

              <select
                value={form.vehicleId}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    vehicleId: event.target.value
                      ? Number(event.target.value)
                      : '',
                    formError: null,
                  }))
                }
                required
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
                    {vehicle.plateNumber} - {vehicle.model || 'نامشخص'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <User size={15} className="text-orange-500" />
                راننده مجری <span className="text-red-500">*</span>
              </label>

              <select
                value={form.driverId}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    driverId: event.target.value
                      ? Number(event.target.value)
                      : '',
                    formError: null,
                  }))
                }
                required
                className={`${selectBase} ${inputLight} ${inputDark}`}
              >
                <option value="" className={selectOptionBase}>
                  انتخاب راننده...
                </option>

                {drivers.map((driver) => (
                  <option
                    key={driver.id}
                    value={driver.id}
                    className={selectOptionBase}
                  >
                    {driver.firstName} {driver.lastName} - {driver.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                عنوان مأموریت <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                    formError: null,
                  }))
                }
                placeholder="مثال: تحویل محموله شعبه مرکزی"
                required
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                توضیحات و نکات تکمیلی
              </label>

              <input
                type="text"
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                placeholder="یادداشت برای راننده یا دیسپچر..."
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <MapPin size={14} className="text-emerald-600" />
                عنوان مبدأ <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.originTitle}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    originTitle: event.target.value,
                    formError: null,
                  }))
                }
                placeholder="نام انبار یا آدرس مبدأ"
                required
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <Flag size={14} className="text-rose-600" />
                عنوان مقصد <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.destinationTitle}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    destinationTitle: event.target.value,
                    formError: null,
                  }))
                }
                placeholder="نام مقصد یا تحویل‌گیرنده"
                required
                className={`${selectBase} ${inputLight} ${inputDark}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              تعیین دقیق مختصات روی نقشه:
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    pickMode: 'origin',
                  }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
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
                onClick={() =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    pickMode: 'destination',
                  }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
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

          <LocationPickerMap
            origin={form.originCoords}
            destination={form.destinationCoords}
            activeMode={form.pickMode}
            onLocationSelect={handleMapSelect}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              <span className="mb-1 block font-bold">مختصات مبدأ</span>
              <span dir="ltr">
                {form.originCoords
                  ? `${form.originCoords.lat.toFixed(6)}, ${form.originCoords.lng.toFixed(6)}`
                  : 'انتخاب نشده'}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              <span className="mb-1 block font-bold">مختصات مقصد</span>
              <span dir="ltr">
                {form.destinationCoords
                  ? `${form.destinationCoords.lat.toFixed(6)}, ${form.destinationCoords.lng.toFixed(6)}`
                  : 'انتخاب نشده'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            انصراف
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}

            {isSubmitting
              ? isEditMode
                ? 'در حال ذخیره...'
                : 'در حال ثبت...'
              : isEditMode
                ? 'ذخیره تغییرات'
                : 'ثبت و تخصیص مأموریت'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

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
          aria-label={mode === 'edit' ? 'ویرایش مأموریت' : 'ایجاد مأموریت'}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
