'use client';

import { type ReactNode, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  IdCard,
  Loader2,
  Phone,
  Save,
  User,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  type DriverFormInput,
  type DriverFormValues,
  driverFormSchema,
} from '@/app/schemas/driver.schema';
import type { CreateDriverRequest, Driver } from '@/types/driver';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDriverRequest) => Promise<void>;
  initialData?: Driver | null;
  isSubmitting: boolean;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  icon?: ReactNode;
  children: ReactNode;
}

const getDefaultValues = (initialData?: Driver | null): DriverFormInput => ({
  firstName: initialData?.firstName ?? '',
  lastName: initialData?.lastName ?? '',
  nationalId: initialData?.nationalId ?? '',
  phone: initialData?.phone ?? '',
  licenseType: initialData?.licenseType ?? 1,
});

const inputClassName = `
  w-full rounded-2xl border bg-orange-50/30 px-4 py-3
  text-sm text-neutral-900 outline-none transition-all
  placeholder:text-neutral-400
  disabled:cursor-not-allowed disabled:opacity-60
  dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-600
`;

const normalInputClassName = `
  border-orange-100
  hover:border-orange-300
  focus:border-orange-500
  focus:bg-white
  focus:ring-4
  focus:ring-orange-500/10
  dark:border-neutral-800
  dark:hover:border-orange-800
  dark:focus:border-orange-500
  dark:focus:bg-neutral-950
`;

const errorInputClassName = `
  border-red-500
  bg-red-50/40
  focus:border-red-500
  focus:ring-4
  focus:ring-red-500/10
  dark:border-red-500
  dark:bg-red-950/10
`;

export const DriverFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<DriverFormInput, unknown, DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: getDefaultValues(initialData),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  /**
   * با بازشدن مودال یا تغییر راننده در حالت ویرایش،
   * اطلاعات فرم مجدداً مقداردهی می‌شوند.
   */
  useEffect(() => {
    if (!isOpen) return;

    reset(getDefaultValues(initialData));
  }, [initialData, isOpen, reset]);

  const handleFormSubmit = async (data: DriverFormValues) => {
    const request: CreateDriverRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      nationalId: data.nationalId,
      phone: data.phone,
      licenseType: data.licenseType,
    };

    await onSubmit(request);
  };

  const handleClose = () => {
    if (isSubmitting) return;

    reset(getDefaultValues(initialData));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="بستن پنجره ثبت راننده"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 cursor-default bg-neutral-950/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="driver-form-title"
            initial={{
              scale: 0.96,
              opacity: 0,
              y: 24,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.96,
              opacity: 0,
              y: 24,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            className="
              relative w-full max-w-lg overflow-hidden
              rounded-[32px] border border-orange-100
              bg-white shadow-2xl shadow-orange-950/10
              dark:border-orange-950/60 dark:bg-neutral-900
            "
          >
            {/* Orange accent */}
            <div className="h-1.5 w-full bg-orange-500" />

            {/* Header */}
            <div
              className="
                flex items-center justify-between
                border-b border-orange-100
                bg-orange-50/40 p-6
                dark:border-neutral-800 dark:bg-orange-950/10
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="
                    flex size-11 shrink-0 items-center justify-center
                    rounded-2xl bg-orange-100 text-orange-600
                    dark:bg-orange-950/50 dark:text-orange-400
                  "
                >
                  <User size={22} strokeWidth={2.2} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="driver-form-title"
                    className="truncate text-xl  text-neutral-900 dark:text-white"
                  >
                    {initialData ? 'ویرایش اطلاعات راننده' : 'ثبت راننده جدید'}
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    اطلاعات راننده را با دقت تکمیل کنید
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="بستن"
                className="
                  flex size-9 shrink-0 items-center justify-center
                  rounded-xl text-neutral-400 transition-colors
                  hover:bg-orange-100 hover:text-orange-600
                  disabled:cursor-not-allowed disabled:opacity-50
                  dark:hover:bg-orange-950/40 dark:hover:text-orange-400
                "
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              noValidate
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-5 p-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  id="firstName"
                  label="نام"
                  icon={<User size={15} />}
                  error={errors.firstName?.message}
                >
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    disabled={isSubmitting}
                    placeholder="مثلاً: علی"
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={
                      errors.firstName ? 'firstName-error' : undefined
                    }
                    className={`${inputClassName} ${
                      errors.firstName
                        ? errorInputClassName
                        : normalInputClassName
                    }`}
                    {...register('firstName')}
                  />
                </FormField>

                <FormField
                  id="lastName"
                  label="نام خانوادگی"
                  icon={<User size={15} />}
                  error={errors.lastName?.message}
                >
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    disabled={isSubmitting}
                    placeholder="مثلاً: محمدی"
                    aria-invalid={Boolean(errors.lastName)}
                    aria-describedby={
                      errors.lastName ? 'lastName-error' : undefined
                    }
                    className={`${inputClassName} ${
                      errors.lastName
                        ? errorInputClassName
                        : normalInputClassName
                    }`}
                    {...register('lastName')}
                  />
                </FormField>
              </div>

              <FormField
                id="nationalId"
                label="کد ملی"
                icon={<IdCard size={15} />}
                error={errors.nationalId?.message}
              >
                <input
                  id="nationalId"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  dir="ltr"
                  disabled={isSubmitting}
                  placeholder="0012345678"
                  aria-invalid={Boolean(errors.nationalId)}
                  aria-describedby={
                    errors.nationalId ? 'nationalId-error' : undefined
                  }
                  className={`${inputClassName} text-left ${
                    errors.nationalId
                      ? errorInputClassName
                      : normalInputClassName
                  }`}
                  {...register('nationalId')}
                />
              </FormField>

              <FormField
                id="phone"
                label="شماره تماس"
                icon={<Phone size={15} />}
                error={errors.phone?.message}
              >
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={11}
                  dir="ltr"
                  disabled={isSubmitting}
                  placeholder="09121234567"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className={`${inputClassName} text-left ${
                    errors.phone ? errorInputClassName : normalInputClassName
                  }`}
                  {...register('phone')}
                />
              </FormField>

              <FormField
                id="licenseType"
                label="نوع گواهینامه"
                icon={<BadgeCheck size={15} />}
                error={errors.licenseType?.message}
              >
                <select
                  id="licenseType"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.licenseType)}
                  aria-describedby={
                    errors.licenseType ? 'licenseType-error' : undefined
                  }
                  className={`${inputClassName} cursor-pointer ${
                    errors.licenseType
                      ? errorInputClassName
                      : normalInputClassName
                  }`}
                  {...register('licenseType', {
                    setValueAs: (value) => Number(value),
                  })}
                >
                  <option value={1}>پایه ۱</option>
                  <option value={2}>پایه ۲</option>
                  <option value={3}>پایه ۳</option>
                </select>
              </FormField>

              {/* Actions */}
              <div
                className="
                  flex flex-col-reverse gap-3
                  border-t border-orange-100 pt-5
                  sm:flex-row
                  dark:border-neutral-800
                "
              >
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleClose}
                  className="
                    flex-1 rounded-2xl border border-neutral-200
                    bg-white py-3.5 font-bold text-neutral-600
                    transition-colors
                    hover:border-orange-200 hover:bg-orange-50
                    hover:text-orange-700
                    disabled:cursor-not-allowed disabled:opacity-50
                    dark:border-neutral-700 dark:bg-neutral-900
                    dark:text-neutral-400 dark:hover:border-orange-900
                    dark:hover:bg-orange-950/20 dark:hover:text-orange-400
                  "
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="
                    flex flex-1 items-center justify-center gap-2
                    rounded-2xl bg-orange-600 py-3.5
                    font-bold text-white transition-colors
                    hover:bg-orange-700
                    focus:outline-none focus:ring-4
                    focus:ring-orange-500/20
                    disabled:cursor-not-allowed
                    disabled:bg-orange-300
                    disabled:opacity-70
                    dark:disabled:bg-orange-950
                    dark:disabled:text-orange-700
                  "
                >
                  {isSubmitting ? (
                    <Loader2
                      size={20}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save size={20} aria-hidden="true" />
                  )}

                  <span>
                    {isSubmitting
                      ? 'در حال ذخیره...'
                      : initialData
                        ? 'ذخیره تغییرات'
                        : 'ثبت اطلاعات'}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FormField = ({ id, label, error, icon, children }: FormFieldProps) => (
  <div className="space-y-1.5">
    <label
      htmlFor={id}
      className="
        flex items-center gap-1.5
        text-sm font-bold text-neutral-700
        dark:text-neutral-300
      "
    >
      {icon && (
        <span
          className="text-orange-500 dark:text-orange-400"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      <span>{label}</span>
    </label>

    {children}

    {error && (
      <motion.p
        id={`${id}-error`}
        role="alert"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-medium text-red-600 dark:text-red-400"
      >
        {error}
      </motion.p>
    )}
  </div>
);
