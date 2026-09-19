'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bike,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
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

/* =========================================================
   Types
========================================================= */

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
  disabled?: boolean;
}

interface PlateParts {
  left: string;
  letter: string;
  middle: string;
  iran: string;
}

interface IranianPlateInputProps {
  value: string;
  disabled?: boolean;
  hasError?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/* =========================================================
   Constants
========================================================= */

const PLATE_LETTERS = [
  'ب',
  'ج',
  'د',
  'س',
  'ص',
  'ط',
  'ق',
  'ل',
  'م',
  'ن',
  'و',
  'هـ',
  'ی',
] as const;

const EMPTY_PLATE: PlateParts = {
  left: '',
  letter: 'ب',
  middle: '',
  iran: '',
};

const vehicleTypes: Array<{
  value: VehicleType;
  label: string;
  icon: typeof Car;
}> = [
  {
    value: 0,
    label: 'سواری',
    icon: Car,
  },
  {
    value: 1,
    label: 'وانت / نیسان',
    icon: Truck,
  },
  {
    value: 2,
    label: 'کامیون / تریلی',
    icon: Truck,
  },
  {
    value: 3,
    label: 'موتورسیکلت',
    icon: Bike,
  },
];

const inputBaseClassName =
  'w-full rounded-xl border bg-orange-50/30 px-4 py-3 text-sm font-medium text-neutral-800 outline-none transition-all placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-950 dark:text-white';

const normalInputClassName =
  'border-orange-100 hover:border-orange-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-neutral-700 dark:hover:border-orange-900 dark:focus:border-orange-500 dark:focus:bg-neutral-950';

const errorInputClassName =
  'border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-500 dark:bg-red-950/10';

/* =========================================================
   Digit Helpers
========================================================= */

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)),
    );
}

function toPersianDigits(value: string): string {
  return value.replace(
    /\d/g,
    (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)],
  );
}

function onlyDigits(value: string, maxLength: number): string {
  return toEnglishDigits(value)
    .replace(/\D/g, '')
    .slice(0, maxLength);
}

/* =========================================================
   Plate Helpers
========================================================= */

/**
 * فرمت ذخیره:
 * 12ب345-11
 */
function buildPlateNumber(parts: PlateParts): string {
  const left = onlyDigits(parts.left, 2);
  const middle = onlyDigits(parts.middle, 3);
  const iran = onlyDigits(parts.iran, 2);
  const letter = parts.letter.trim();

  if (
    left.length !== 2 ||
    middle.length !== 3 ||
    iran.length !== 2 ||
    !letter
  ) {
    return '';
  }

  return `${left}${letter}${middle}-${iran}`;
}

/**
 * مقداری که در حین تایپ داخل react-hook-form قرار می‌گیرد.
 *
 * مثال:
 * 1ب-
 * 12ب34-
 * 12ب345-1
 */
function buildDraftPlateNumber(parts: PlateParts): string {
  const left = onlyDigits(parts.left, 2);
  const middle = onlyDigits(parts.middle, 3);
  const iran = onlyDigits(parts.iran, 2);
  const letter = parts.letter.trim() || 'ب';

  return `${left}${letter}${middle}-${iran}`;
}

function parsePlateNumber(value: unknown): PlateParts {
  if (value === null || value === undefined) {
    return { ...EMPTY_PLATE };
  }

  const original = String(value).trim();

  if (!original) {
    return { ...EMPTY_PLATE };
  }

  const normalized = toEnglishDigits(original)
    .replace(/ایران/gi, '')
    .replace(/\s+/g, '')
    .replace(/[_/\\]/g, '-');

  /*
   * استاندارد:
   * 12ب345-11
   */
  const standardMatch = normalized.match(
    /^(\d{2})([^\d-])(\d{3})-(\d{2})$/,
  );

  if (standardMatch) {
    return {
      left: standardMatch[1],
      letter: standardMatch[2],
      middle: standardMatch[3],
      iran: standardMatch[4],
    };
  }

  /*
   * بدون خط تیره:
   * 12ب34511
   */
  const noDashMatch = normalized.match(
    /^(\d{2})([^\d])(\d{3})(\d{2})$/,
  );

  if (noDashMatch) {
    return {
      left: noDashMatch[1],
      letter: noDashMatch[2],
      middle: noDashMatch[3],
      iran: noDashMatch[4],
    };
  }

  /*
   * حالت ناقص حین تایپ
   */
  const draftMatch = normalized.match(
    /^(\d{0,2})([^\d-]?)(\d{0,3})(?:-(\d{0,2}))?$/,
  );

  if (draftMatch) {
    return {
      left: draftMatch[1] ?? '',
      letter: draftMatch[2] || 'ب',
      middle: draftMatch[3] ?? '',
      iran: draftMatch[4] ?? '',
    };
  }

  /*
   * فرمت‌های قدیمی
   */
  const flexibleMatch = normalized.match(
    /(\d{2})([^\d-])(\d{3}).*?(\d{2})$/,
  );

  if (flexibleMatch) {
    return {
      left: flexibleMatch[1],
      letter: flexibleMatch[2],
      middle: flexibleMatch[3],
      iran: flexibleMatch[4],
    };
  }

  return { ...EMPTY_PLATE };
}

function isPlateComplete(parts: PlateParts): boolean {
  return Boolean(buildPlateNumber(parts));
}

/* =========================================================
   Form Helpers
========================================================= */

function getDefaultValues(vehicle: Vehicle | null): VehicleFormInput {
  return {
    plateNumber: vehicle?.plateNumber ?? '',
    model: vehicle?.model ?? '',
    status: vehicle?.status ?? 1,
    vehicleType: vehicle?.vehicleType ?? 0,
    insuranceNumber: vehicle?.insuranceNumber ?? '',
    insuranceExpiryDate: vehicle?.insuranceExpiryDate
      ? vehicle.insuranceExpiryDate.slice(0, 10)
      : '',
    currentDriverId: vehicle?.currentDriverId ?? null,
  };
}

function getPersianDateValue(
  date: string | null | undefined,
): DateObject | undefined {
  if (!date) {
    return undefined;
  }

  return new DateObject({
    date,
    format: 'YYYY-MM-DD',
    calendar: gregorian,
    locale: gregorianEn,
  }).convert(persian, persianFa);
}

/* =========================================================
   Iranian Plate Input
========================================================= */

function IranianPlateInput({
  value,
  disabled = false,
  hasError = false,
  onChange,
  onBlur,
}: IranianPlateInputProps) {
  const [parts, setParts] = useState<PlateParts>(() =>
    parsePlateNumber(value),
  );

  /*
   * فقط وقتی مقدار بیرونی واقعاً تغییر کرده
   * مثل reset فرم یا ورود به حالت Edit
   * state داخلی را sync می‌کنیم.
   *
   * این effect هیچ parent updateای انجام نمی‌دهد.
   */
  useEffect(() => {
    const parsed = parsePlateNumber(value);

    setParts((current) => {
      const currentDraft = buildDraftPlateNumber(current);
      const parsedDraft = buildDraftPlateNumber(parsed);

      if (currentDraft === parsedDraft) {
        return current;
      }

      return parsed;
    });
  }, [value]);

  const emitChange = (nextParts: PlateParts) => {
    /*
     * نکته اصلی:
     * onChange خارج از callback مربوط به setState اجرا می‌شود.
     */
    setParts(nextParts);

    const completedPlate = buildPlateNumber(nextParts);

    if (completedPlate) {
      onChange(completedPlate);
      return;
    }

    onChange(buildDraftPlateNumber(nextParts));
  };

  const changeLeft = (rawValue: string) => {
    const nextParts: PlateParts = {
      ...parts,
      left: onlyDigits(rawValue, 2),
    };

    emitChange(nextParts);
  };

  const changeLetter = (letter: string) => {
    const nextParts: PlateParts = {
      ...parts,
      letter,
    };

    emitChange(nextParts);
  };

  const changeMiddle = (rawValue: string) => {
    const nextParts: PlateParts = {
      ...parts,
      middle: onlyDigits(rawValue, 3),
    };

    emitChange(nextParts);
  };

  const changeIran = (rawValue: string) => {
    const nextParts: PlateParts = {
      ...parts,
      iran: onlyDigits(rawValue, 2),
    };

    emitChange(nextParts);
  };

  const complete = isPlateComplete(parts);

  return (
    <div className="space-y-3">
      <div
        dir="ltr"
        className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-neutral-950 ${
          hasError
            ? 'border-red-500 ring-4 ring-red-500/10'
            : complete
              ? 'border-emerald-300 ring-4 ring-emerald-500/5 dark:border-emerald-800'
              : 'border-orange-200 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 dark:border-neutral-700'
        }`}
      >
        <div className="flex min-h-[78px] items-stretch">
          {/* Iran blue section */}

          <div className="flex w-[48px] shrink-0 flex-col items-center justify-between bg-blue-700 px-1.5 py-2 text-white">
            <div className="text-center">
              <div className="text-sm leading-none">🇮🇷</div>

              <div className="mt-1 text-[7px] font-bold tracking-wide">
                I.R.
              </div>
            </div>

            <div className="text-[7px] font-bold">
              IRAN
            </div>
          </div>

          {/* Left 2 digits */}

          <div className="flex min-w-0 flex-1 items-center justify-center border-r border-neutral-200 px-2 dark:border-neutral-700">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              disabled={disabled}
              value={toPersianDigits(parts.left)}
              onChange={(event) => changeLeft(event.target.value)}
              onBlur={onBlur}
              placeholder="۱۲"
              aria-label="دو رقم اول پلاک"
              className="w-full bg-transparent text-center text-xl font-black text-neutral-900 outline-none placeholder:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-neutral-700"
            />
          </div>

          {/* Letter */}

          <div className="relative flex w-[70px] shrink-0 items-center justify-center border-r border-neutral-200 dark:border-neutral-700">
            <select
              disabled={disabled}
              value={parts.letter}
              onChange={(event) => changeLetter(event.target.value)}
              onBlur={onBlur}
              aria-label="حرف پلاک"
              className="h-full w-full cursor-pointer appearance-none bg-transparent px-2 text-center text-xl font-black text-neutral-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
            >
              {PLATE_LETTERS.map((letter) => (
                <option
                  key={letter}
                  value={letter}
                >
                  {letter}
                </option>
              ))}
            </select>

            <ChevronDown
              size={12}
              className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 text-neutral-400"
            />
          </div>

          {/* Middle 3 digits */}

          <div className="flex min-w-0 flex-[1.35] items-center justify-center border-r border-neutral-200 px-2 dark:border-neutral-700">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              disabled={disabled}
              value={toPersianDigits(parts.middle)}
              onChange={(event) => changeMiddle(event.target.value)}
              onBlur={onBlur}
              placeholder="۳۴۵"
              aria-label="سه رقم میانی پلاک"
              className="w-full bg-transparent text-center text-xl font-black tracking-wider text-neutral-900 outline-none placeholder:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-neutral-700"
            />
          </div>

          {/* Iran code */}

          <div className="flex w-[78px] shrink-0 flex-col items-center justify-center border-r border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-900">
            <span className="mb-1 text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
              ایران
            </span>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              disabled={disabled}
              value={toPersianDigits(parts.iran)}
              onChange={(event) => changeIran(event.target.value)}
              onBlur={onBlur}
              placeholder="۱۱"
              aria-label="کد ایران پلاک"
              className="w-full bg-transparent text-center text-lg font-black text-neutral-900 outline-none placeholder:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-neutral-700"
            />
          </div>
        </div>
      </div>

      <div
        dir="rtl"
        className="flex items-center justify-between gap-3 px-1"
      >
        <span className="text-[10px] text-neutral-400">
          مثال: ۱۲ ب ۳۴۵ ایران ۱۱
        </span>

        {complete ? (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            پلاک کامل است
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-medium text-orange-500">
            پلاک را کامل کنید
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Main Component
========================================================= */

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
    watch,
    formState: {
      errors,
      isValid,
    },
  } = useForm<
    VehicleFormInput,
    unknown,
    VehicleFormValues
  >({
    resolver: zodResolver(vehicleFormSchema),

    defaultValues: getDefaultValues(initialData),

    mode: 'onChange',

    reValidateMode: 'onChange',
  });

  const plateNumber = watch('plateNumber') ?? '';

  const plateComplete = useMemo(() => {
    return isPlateComplete(
      parsePlateNumber(plateNumber),
    );
  }, [plateNumber]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(getDefaultValues(initialData));
  }, [initialData, isOpen, reset]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    reset(getDefaultValues(initialData));

    onClose();
  };

  const handleFormSubmit = async (
    data: VehicleFormValues,
  ) => {
    const plateParts = parsePlateNumber(
      data.plateNumber,
    );

    const normalizedPlate = buildPlateNumber(
      plateParts,
    );

    /*
     * این حالت اصولاً به خاطر disabled بودن دکمه نباید رخ دهد.
     */
    if (!normalizedPlate) {
      return;
    }

    const request: CreateVehicleRequest = {
      plateNumber: normalizedPlate,

      model: data.model.trim(),

      vehicleType: data.vehicleType,

      status: data.status,

      insuranceNumber:
        data.insuranceNumber?.trim?.() ??
        data.insuranceNumber,

      insuranceExpiryDate:
        data.insuranceExpiryDate,

      currentDriverId:
        data.currentDriverId,
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
          {/* Backdrop */}

          <motion.button
            type="button"
            aria-label="بستن مودال"
            className="absolute inset-0 cursor-default bg-neutral-950/50 backdrop-blur-sm"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={handleClose}
          />

          {/* Modal */}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-form-title"
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
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-orange-100 bg-white shadow-2xl shadow-orange-950/10 dark:border-orange-950/60 dark:bg-neutral-900"
          >
            <div className="h-1.5 bg-orange-500" />

            {/* Header */}

            <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/40 p-5 dark:border-neutral-800 dark:bg-orange-950/10 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                  <Car size={22} />
                </div>

                <div>
                  <h2
                    id="vehicle-form-title"
                    className="text-lg font-bold text-neutral-900 dark:text-white"
                  >
                    {initialData
                      ? 'ویرایش خودرو'
                      : 'ثبت خودرو جدید'}
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

            {/* Form */}

            <form
              noValidate
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-6 p-5 sm:p-6"
            >
              {/* Plate */}

              <FormField
                id="plateNumber"
                label="شماره پلاک خودرو"
                error={errors.plateNumber?.message}
              >
                <Controller
                  control={control}
                  name="plateNumber"
                  render={({ field }) => (
                    <IranianPlateInput
                      value={
                        typeof field.value === 'string'
                          ? field.value
                          : ''
                      }
                      disabled={isSubmitting}
                      hasError={Boolean(errors.plateNumber)}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>

              {/* Model */}

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
                    errors.model
                      ? errorInputClassName
                      : normalInputClassName
                  }`}
                  {...register('model')}
                />
              </FormField>

              {/* Vehicle Type */}

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

                        const isSelected =
                          field.value === vehicleType.value;

                        return (
                          <button
                            key={vehicleType.value}
                            type="button"
                            role="radio"
                            disabled={isSubmitting}
                            aria-checked={isSelected}
                            onClick={() =>
                              field.onChange(vehicleType.value)
                            }
                            className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400'
                                : 'border-neutral-200 bg-white text-neutral-500 hover:border-orange-300 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-orange-900'
                            }`}
                          >
                            <Icon size={21} />

                            <span>
                              {vehicleType.label}
                            </span>
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

              {/* Insurance */}

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
                    aria-invalid={Boolean(
                      errors.insuranceNumber,
                    )}
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
                        typeof field.value === 'string'
                          ? field.value
                          : '';

                      return (
                        <DatePicker
                          value={getPersianDateValue(
                            insuranceExpiryDate,
                          )}
                          calendar={persian}
                          locale={persianFa}
                          format="YYYY/MM/DD"
                          calendarPosition="bottom-right"
                          editable={false}
                          onChange={(date) => {
                            const selectedDate =
                              Array.isArray(date)
                                ? date[0]
                                : date;

                            const gregorianDate =
                              selectedDate
                                ? selectedDate
                                    .convert(
                                      gregorian,
                                      gregorianEn,
                                    )
                                    .format('YYYY-MM-DD')
                                : '';

                            field.onChange(gregorianDate);
                          }}
                          render={(
                            value,
                            openCalendar,
                          ) => (
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

              {/* Status */}

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
                        icon={
                          <CheckCircle2 size={18} />
                        }
                        isSelected={field.value === 1}
                        onClick={() =>
                          field.onChange(
                            1 as VehicleStatus,
                          )
                        }
                        disabled={isSubmitting}
                        activeClassName="border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400"
                      />

                      <StatusButton
                        label="غیرفعال"
                        icon={<X size={18} />}
                        isSelected={field.value === 0}
                        onClick={() =>
                          field.onChange(
                            0 as VehicleStatus,
                          )
                        }
                        disabled={isSubmitting}
                        activeClassName="border-neutral-500 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>
                )}
              />

              {/* Actions */}

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
                  disabled={
                    isSubmitting ||
                    !isValid ||
                    !plateComplete
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-orange-300 disabled:opacity-60 dark:disabled:bg-orange-950"
                >
                  {isSubmitting ? (
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
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

/* =========================================================
   Form Field
========================================================= */

function FormField({
  id,
  label,
  error,
  children,
}: FormFieldProps) {
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

/* =========================================================
   Status Button
========================================================= */

function StatusButton({
  label,
  icon,
  isSelected,
  onClick,
  activeClassName,
  disabled = false,
}: StatusButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      disabled={disabled}
      aria-checked={isSelected}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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