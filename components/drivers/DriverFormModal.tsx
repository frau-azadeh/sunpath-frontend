'use client';

import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Save, User, X } from 'lucide-react';

import type { CreateDriverRequest, Driver } from '@/types/driver';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDriverRequest) => Promise<void>;
  initialData?: Driver | null;
  isSubmitting: boolean;
}

function getInitialFormData(initialData?: Driver | null): CreateDriverRequest {
  return {
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    nationalId: initialData?.nationalId ?? '',
    phone: initialData?.phone ?? '',
    licenseType: initialData?.licenseType ?? 1,
  };
}

export const DriverFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: Props) => {
  const [formData, setFormData] = useState<CreateDriverRequest>(() =>
    getInitialFormData(initialData),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/30">
                <User size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {initialData ? 'ویرایش اطلاعات راننده' : 'ثبت راننده جدید'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onSubmit(formData);
            }}
            className="space-y-4 p-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  نام
                </label>
                <input
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="مثلاً: علی"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  نام خانوادگی
                </label>
                <input
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="مثلاً: محمدی"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                کد ملی
              </label>
              <input
                required
                maxLength={10}
                value={formData.nationalId}
                onChange={(e) =>
                  setFormData({ ...formData, nationalId: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950"
                placeholder="مثلاً: 0012345678"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                شماره تماس
              </label>
              <input
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-950"
                placeholder="مثلاً: 09121234567"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                نوع گواهینامه
              </label>
              <select
                value={formData.licenseType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    licenseType: Number(e.target.value),
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value={1}>پایه ۱</option>
                <option value={2}>پایه ۲</option>
                <option value={3}>پایه ۳</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {initialData ? 'ذخیره تغییرات' : 'ثبت اطلاعات'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                انصراف
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
