'use client';

import { useState } from 'react';

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
import DatePicker, { DateObject } from 'react-multi-date-picker';

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

const createInitialFormData = (
  vehicle: Vehicle | null,
): CreateVehicleRequest => ({
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
  if (!date) {
    return undefined;
  }

  return new DateObject({
    date: date.slice(0, 10),
    format: 'YYYY-MM-DD',
    calendar: gregorian,
    locale: gregorianEn,
  }).convert(persian, persianFa);
};

export function VehicleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: VehicleFormModalProps) {
  // ۱. کنترل محلی state با مقایسه تغییر پروپ (پروسه همگام‌سازی مستقیم در رندر)
  const [prevInitialData, setPrevInitialData] = useState<Vehicle | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateVehicleRequest>(() =>
    createInitialFormData(initialData),
  );

  // اگر مودال باز شده یا دیتای اولیه تغییر کرده باشد، استیت فرم بدون نیاز به useEffect همگام می‌شود
  if (initialData !== prevInitialData || isOpen !== prevIsOpen) {
    setPrevInitialData(initialData);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData(createInitialFormData(initialData));
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      ...formData,
      plateNumber: formData.plateNumber.trim(),
      model: formData.model?.trim() || null,
      insuranceNumber: formData.insuranceNumber?.trim() || null,
      insuranceExpiryDate: formData.insuranceExpiryDate || null,
    });
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-vazir">
          <motion.button
            type="button"
            aria-label="بستن مودال"
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-form-title"
            className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Car size={22} />
                </div>

                <div>
                  <h2
                    id="vehicle-form-title"
                    className="text-lg font-black text-slate-900 dark:text-white"
                  >
                    {initialData ? 'ویرایش خودرو' : 'ثبت خودرو جدید'}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    اطلاعات وسیله نقلیه را وارد کنید.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="بستن"
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="plateNumber"
                    className="text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    شماره پلاک
                  </label>

                  <input
                    id="plateNumber"
                    required
                    value={formData.plateNumber}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        plateNumber: event.target.value,
                      }))
                    }
                    placeholder="مثال: ۱۲ ب ۳۴۵ ایران ۱۱"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="model"
                    className="text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    مدل خودرو
                  </label>

                  <input
                    id="model"
                    value={formData.model ?? ''}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        model: event.target.value,
                      }))
                    }
                    placeholder="مثال: پژو پارس، ولوو FH"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  نوع وسیله نقلیه
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {vehicleTypes.map((vehicleType) => {
                    const Icon = vehicleType.icon;
                    const isSelected =
                      formData.vehicleType === vehicleType.value;

                    return (
                      <button
                        key={vehicleType.value}
                        type="button"
                        onClick={() =>
                          setFormData((previous) => ({
                            ...previous,
                            vehicleType: vehicleType.value,
                          }))
                        }
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-blue-800'
                        }`}
                      >
                        <Icon size={21} />
                        <span>{vehicleType.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="insuranceNumber"
                    className="text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    شماره بیمه‌نامه
                  </label>

                  <input
                    id="insuranceNumber"
                    value={formData.insuranceNumber ?? ''}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        insuranceNumber: event.target.value,
                      }))
                    }
                    placeholder="شماره بیمه‌نامه"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="insuranceExpiryDate"
                    className="text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    تاریخ انقضای بیمه
                  </label>

                  <DatePicker
                    value={getPersianDateValue(formData.insuranceExpiryDate)}
                    onChange={(date) => {
                      const selectedDate = Array.isArray(date) ? date[0] : date;

                      setFormData((previous) => ({
                        ...previous,
                        insuranceExpiryDate: selectedDate
                          ? selectedDate
                              .convert(gregorian, gregorianEn)
                              .format('YYYY-MM-DD')
                          : '',
                      }));
                    }}
                    calendar={persian}
                    locale={persianFa}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    editable={false}
                    render={(value, openCalendar) => (
                      <button
                        id="insuranceExpiryDate"
                        type="button"
                        onClick={openCalendar}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm font-medium text-slate-800 outline-none transition-colors hover:border-blue-300 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-blue-800"
                      >
                        <span
                          className={
                            value
                              ? 'text-slate-800 dark:text-white'
                              : 'text-slate-400'
                          }
                        >
                          {value || 'انتخاب تاریخ شمسی'}
                        </span>

                        <CalendarDays
                          size={18}
                          className="shrink-0 text-slate-400"
                        />
                      </button>
                    )}
                    containerClassName="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  وضعیت خودرو
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((previous) => ({
                        ...previous,
                        status: 1 as VehicleStatus,
                      }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                      formData.status === 1
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    فعال
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((previous) => ({
                        ...previous,
                        status: 0 as VehicleStatus,
                      }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                      formData.status === 0
                        ? 'border-slate-500 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <X size={18} />
                    غیرفعال
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Save size={19} />
                  )}

                  {initialData ? 'ذخیره تغییرات' : 'ثبت خودرو'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
