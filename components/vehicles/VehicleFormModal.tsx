'use client';

import { type ReactNode, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bike,
  CalendarDays,
  Car,
  CheckCircle2,
  Loader2,
  Save,
  Truck,
  X,
} from 'lucide-react';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import gregorianEn from 'react-date-object/locales/gregorian_en';
import persianFa from 'react-date-object/locales/persian_fa';
import { Controller, useForm } from 'react-hook-form';
import DatePicker, { DateObject } from 'react-multi-date-picker';

import {
  type VehicleFormInput,
  type VehicleFormValues,
  vehicleFormSchema,
} from '@/app/schemas/vehicle.schema';
import type {
  CreateVehicleRequest,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from '@/types/vehicle';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVehicleRequest) => Promise<void>;
  initialData: Vehicle | null;
  isSubmitting: boolean;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

interface StatusButtonProps {
  label: string;
  icon: ReactNode;
  isSelected: boolean;
  onClick: () => void;
  activeClassName: string;
}

const getDefaultValues = (vehicle: Vehicle | null): VehicleFormInput => ({
  plateNumber: vehicle?.plateNumber ?? '',
  model: vehicle?.model ?? '',
  status: vehicle?.status ?? 0,
  vehicleType: vehicle?.vehicleType ?? 0,
  insuranceNumber: vehicle?.insuranceNumber ?? '',
  insuranceExpiryDate: vehicle?.insuranceExpiryDate
    ? vehicle.insuranceExpiryDate.slice(0, 10)
    : '',
  currentDriverId: vehicle?.currentDriverId ?? null,
});

const getPersianDateValue = (date: string | null | undefined) => {
  if (!date) return undefined;

  return new DateObject({
    date,
    format: 'YYYY-MM-DD',
    calendar: gregorian,
    locale: gregorianEn,
  }).convert(persian, persianFa);
};

const inputBaseClassName =
  'w-full rounded-xl border bg-orange-50/30 px-4 py-3 text-sm font-medium text-neutral-800 outline-none transition-all placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-950 dark:text-white';

const normalInputClassName =
  'border-orange-100 hover:border-orange-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-neutral-700 dark:hover:border-orange-900 dark:focus:border-orange-500 dark:focus:bg-neutral-950';

const errorInputClassName =
  'border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-500 dark:bg-red-950/10';

const vehicleTypes: Array<{
  value: VehicleType;
  label: string;
  icon: typeof Car;
}> = [
  { value: 0, label: 'سواری', icon: Car },
  { value: 1, label: 'وانت / نیسان', icon: Truck },
  { value: 2, label: 'کامیون / تریلی', icon: Truck },
  { value: 3, label: 'موتورسیکلت', icon: Bike },
];

export function VehicleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: VehicleFormModalProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<VehicleFormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: getDefaultValues(initialData),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(initialData));
    }
  }, [initialData, isOpen, reset]);

  const handleClose = () => {
    if (isSubmitting) return;

    reset(getDefaultValues(initialData));
    onClose();
  };

  const handleFormSubmit = async (data: VehicleFormValues) => {
    const request: CreateVehicleRequest = {
      plateNumber: data.plateNumber,
      model: data.model,
      vehicleType: data.vehicleType,
      status: data.status,
      insuranceNumber: data.insuranceNumber,
      insuranceExpiryDate: data.insuranceExpiryDate,
      currentDriverId: data.currentDriverId,
    };

    await onSubmit(request);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-vazir"
        >
          <motion.button
            type="button"
            aria-label="بستن مودال"
            className="absolute inset-0 cursor-default bg-neutral-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-form-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-orange-100 bg-white shadow-2xl shadow-orange-950/10 dark:border-orange-950/60 dark:bg-neutral-900"
          >
            <div className="h-1.5 bg-orange-500" />

            <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/40 p-5 dark:border-neutral-800 dark:bg-orange-950/10 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                  <Car size={22} />
                </div>

                <div>
                  <h2
                    id="vehicle-form-title"
                    className="text-lg font-black text-neutral-900 dark:text-white"
                  >
                    {initialData ? 'ویرایش خودرو' : 'ثبت خودرو جدید'}
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    اطلاعات وسیله نقلیه را وارد کنید.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="بستن"
                className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-orange-100 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
              >
                <X size={21} />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-5 p-5 sm:p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="plateNumber"
                  label="شماره پلاک"
                  error={errors.plateNumber?.message}
                >
                  <input
                    id="plateNumber"
                    type="text"
                    dir="rtl"
                    disabled={isSubmitting}
                    placeholder="مثال: ۱۲ ب ۳۴۵ ایران ۱۱"
                    aria-invalid={Boolean(errors.plateNumber)}
                    className={`${inputBaseClassName} ${
                      errors.plateNumber
                        ? errorInputClassName
                        : normalInputClassName
                    }`}
                    {...register('plateNumber')}
                  />
                </FormField>

                <FormField
                  id="model"
                  label="مدل خودرو"
                  error={errors.model?.message}
                >
                  <input
                    id="model"
                    type="text"
                    disabled={isSubmitting}
                    placeholder="مثال: پژو پارس، ولوو FH"
                    aria-invalid={Boolean(errors.model)}
                    className={`${inputBaseClassName} ${
                      errors.model ? errorInputClassName : normalInputClassName
                    }`}
                    {...register('model')}
                  />
                </FormField>
              </div>

              <Controller
                control={control}
                name="vehicleType"
                render={({ field }) => (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                      نوع وسیله نقلیه
                    </p>

                    <div
                      role="radiogroup"
                      aria-label="نوع وسیله نقلیه"
                      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                    >
                      {vehicleTypes.map((vehicleType) => {
                        const Icon = vehicleType.icon;
                        const isSelected = field.value === vehicleType.value;

                        return (
                          <button
                            key={vehicleType.value}
                            type="button"
                            role="radio"
                            disabled={isSubmitting}
                            aria-checked={isSelected}
                            onClick={() => field.onChange(vehicleType.value)}
                            className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400'
                                : 'border-neutral-200 bg-white text-neutral-500 hover:border-orange-300 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-orange-900'
                            }`}
                          >
                            <Icon size={21} />
                            <span>{vehicleType.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {errors.vehicleType?.message && (
                      <p
                        role="alert"
                        className="text-xs font-medium text-red-600 dark:text-red-400"
                      >
                        {errors.vehicleType.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="insuranceNumber"
                  label="شماره بیمه‌نامه"
                  error={errors.insuranceNumber?.message}
                >
                  <input
                    id="insuranceNumber"
                    type="text"
                    disabled={isSubmitting}
                    placeholder="شماره بیمه‌نامه"
                    aria-invalid={Boolean(errors.insuranceNumber)}
                    className={`${inputBaseClassName} ${
                      errors.insuranceNumber
                        ? errorInputClassName
                        : normalInputClassName
                    }`}
                    {...register('insuranceNumber')}
                  />
                </FormField>

                <FormField
                  id="insuranceExpiryDate"
                  label="تاریخ انقضای بیمه"
                  error={errors.insuranceExpiryDate?.message}
                >
                  <Controller
                    control={control}
                    name="insuranceExpiryDate"
                    render={({ field }) => {
                      const insuranceExpiryDate =
                        typeof field.value === 'string' ? field.value : '';

                      return (
                        <DatePicker
                          value={getPersianDateValue(insuranceExpiryDate)}
                          calendar={persian}
                          locale={persianFa}
                          format="YYYY/MM/DD"
                          calendarPosition="bottom-right"
                          editable={false}
                          onChange={(date) => {
                            const selectedDate = Array.isArray(date)
                              ? date[0]
                              : date;

                            const gregorianDate = selectedDate
                              ? selectedDate
                                  .convert(gregorian, gregorianEn)
                                  .format('YYYY-MM-DD')
                              : '';

                            field.onChange(gregorianDate);
                          }}
                          render={(value, openCalendar) => (
                            <button
                              id="insuranceExpiryDate"
                              type="button"
                              disabled={isSubmitting}
                              onClick={openCalendar}
                              aria-describedby={
                                errors.insuranceExpiryDate
                                  ? 'insuranceExpiryDate-error'
                                  : undefined
                              }
                              className={`${inputBaseClassName} flex items-center justify-between text-right ${
                                errors.insuranceExpiryDate
                                  ? errorInputClassName
                                  : normalInputClassName
                              }`}
                            >
                              <span
                                className={
                                  value
                                    ? 'text-neutral-800 dark:text-white'
                                    : 'text-neutral-400'
                                }
                              >
                                {value || 'انتخاب تاریخ شمسی'}
                              </span>

                              <CalendarDays
                                size={18}
                                className="shrink-0 text-orange-500"
                              />
                            </button>
                          )}
                          containerClassName="w-full"
                        />
                      );
                    }}
                  />
                </FormField>
              </div>

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                      وضعیت خودرو
                    </p>

                    <div
                      role="radiogroup"
                      aria-label="وضعیت خودرو"
                      className="grid grid-cols-2 gap-3"
                    >
                      <StatusButton
                        label="فعال"
                        icon={<CheckCircle2 size={18} />}
                        isSelected={field.value === 1}
                        onClick={() => field.onChange(1 as VehicleStatus)}
                        activeClassName="border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400"
                      />

                      <StatusButton
                        label="غیرفعال"
                        icon={<X size={18} />}
                        isSelected={field.value === 0}
                        onClick={() => field.onChange(0 as VehicleStatus)}
                        activeClassName="border-neutral-500 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>
                )}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-orange-100 pt-5 dark:border-neutral-800 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-3.5 text-sm font-bold text-neutral-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-orange-900 dark:hover:bg-orange-950/20"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-orange-300 disabled:opacity-60 dark:disabled:bg-orange-950"
                >
                  {isSubmitting ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Save size={19} />
                  )}

                  {isSubmitting
                    ? 'در حال ذخیره...'
                    : initialData
                      ? 'ذخیره تغییرات'
                      : 'ثبت خودرو'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-bold text-neutral-700 dark:text-neutral-200"
      >
        {label}
      </label>

      {children}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function StatusButton({
  label,
  icon,
  isSelected,
  onClick,
  activeClassName,
}: StatusButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
        isSelected
          ? activeClassName
          : 'border-neutral-200 text-neutral-500 hover:border-orange-200 hover:bg-orange-50/50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-orange-900 dark:hover:bg-orange-950/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
