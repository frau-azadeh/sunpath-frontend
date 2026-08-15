'use client';

import { motion } from 'framer-motion';
import { CreditCard, Pencil, Phone, Trash2 } from 'lucide-react';

import { faNumber } from '@/lib/format';
import type { Driver } from '@/types/driver';

interface DriverTableRowProps {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

export function DriverTableRow({
  driver,
  onEdit,
  onDelete,
}: DriverTableRowProps) {
  const fullName = `${driver.firstName} ${driver.lastName}`.trim();
  const initial = driver.firstName.trim().charAt(0) || '?';

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
    >
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            {initial}
          </div>

          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {fullName}
          </span>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <CreditCard size={15} />

          <span dir="ltr">{faNumber(driver.nationalId)}</span>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Phone size={15} />

          <span dir="ltr">{faNumber(driver.phone)}</span>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          پایه {faNumber(driver.licenseType)}
        </span>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(driver)}
            aria-label={`ویرایش ${fullName}`}
            title="ویرایش"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
          >
            <Pencil size={18} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(driver)}
            aria-label={`حذف ${fullName}`}
            title="حذف"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
