'use client';

import { motion } from 'framer-motion';
import {
  CreditCard,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from 'lucide-react';

import type { Driver } from '@/types/driver';

interface DriverTableRowProps {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

/* =========================================================
   Helpers
========================================================= */

function toEnglishDigits(value: unknown): string {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)),
    );
}

function toPersianDigits(value: unknown): string {
  return toEnglishDigits(value).replace(
    /\d/g,
    (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)],
  );
}

function normalizeDigits(value: unknown): string {
  return toEnglishDigits(value).replace(/\D/g, '');
}

/**
 * نمایش کد ملی:
 *
 * 0012345678
 * ->
 * ۰۰۱ ۲۳۴ ۵۶۷۸
 *
 * صفرهای ابتدای کد ملی نیز حفظ می‌شوند،
 * به شرطی که Driver.nationalId از API به صورت string آمده باشد.
 */
function formatNationalId(value: unknown): string {
  const digits = normalizeDigits(value);

  if (!digits) {
    return 'ثبت نشده';
  }

  if (digits.length === 10) {
    return toPersianDigits(
      `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`,
    );
  }

  return toPersianDigits(digits);
}

/**
 * نمایش موبایل:
 *
 * 09121234567
 * ->
 * ۰۹۱۲ ۱۲۳ ۴۵۶۷
 *
 * +989121234567
 * ->
 * ۰۹۱۲ ۱۲۳ ۴۵۶۷
 *
 * 989121234567
 * ->
 * ۰۹۱۲ ۱۲۳ ۴۵۶۷
 */
function formatMobile(value: unknown): string {
  let digits = normalizeDigits(value);

  if (!digits) {
    return 'ثبت نشده';
  }

  if (digits.startsWith('0098')) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('98') && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    digits = `0${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('09')) {
    return toPersianDigits(
      `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`,
    );
  }

  return toPersianDigits(digits);
}

function getDriverInitial(driver: Driver): string {
  const firstName = String(driver.firstName ?? '').trim();
  const lastName = String(driver.lastName ?? '').trim();

  return firstName.charAt(0) || lastName.charAt(0) || '؟';
}

/* =========================================================
   Component
========================================================= */

export function DriverTableRow({
  driver,
  onEdit,
  onDelete,
}: DriverTableRowProps) {
  const firstName = String(driver.firstName ?? '').trim();
  const lastName = String(driver.lastName ?? '').trim();

  const fullName =
    `${firstName} ${lastName}`.trim() || 'راننده بدون نام';

  const initial = getDriverInitial(driver);

  const nationalId = formatNationalId(driver.nationalId);
  const phone = formatMobile(driver.phone);

  const hasNationalId = nationalId !== 'ثبت نشده';
  const hasPhone = phone !== 'ثبت نشده';

  return (
    <motion.tr
      layout
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -6,
      }}
      transition={{
        duration: 0.18,
      }}
      className="group border-b border-neutral-100 transition-colors last:border-b-0 hover:bg-orange-50/30 dark:border-neutral-800/80 dark:hover:bg-orange-950/10"
    >
      {/* ===================================================
          Driver
      =================================================== */}

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-sm font-black text-orange-700 shadow-sm ring-1 ring-orange-200/70 dark:from-orange-950/50 dark:to-orange-950/20 dark:text-orange-300 dark:ring-orange-900/60">
            {initial}

            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {fullName}
            </p>

            <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
              <UserRound size={12} />

              <span>
                راننده
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* ===================================================
          National ID
      =================================================== */}

      <td className="whitespace-nowrap px-6 py-4">
        <div className="inline-flex min-w-[150px] items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <CreditCard size={16} />
          </div>

          <div className="min-w-0">
            <div className="mb-0.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              کد ملی
            </div>

            <div
              dir="ltr"
              className={`text-right text-[13px] font-bold tabular-nums tracking-[0.08em] ${
                hasNationalId
                  ? 'text-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {nationalId}
            </div>
          </div>
        </div>
      </td>

      {/* ===================================================
          Mobile
      =================================================== */}

      <td className="whitespace-nowrap px-6 py-4">
        <div className="inline-flex min-w-[165px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Phone size={16} />
          </div>

          <div className="min-w-0">
            <div className="mb-0.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              شماره موبایل
            </div>

            <div
              dir="ltr"
              className={`text-right text-[13px] font-bold tabular-nums tracking-[0.05em] ${
                hasPhone
                  ? 'text-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {phone}
            </div>
          </div>
        </div>
      </td>

      {/* ===================================================
          License
      =================================================== */}

      <td className="whitespace-nowrap px-6 py-4">
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span>
            پایه {toPersianDigits(driver.licenseType)}
          </span>
        </div>
      </td>

      {/* ===================================================
          Actions
      =================================================== */}

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(driver)}
            aria-label={`ویرایش ${fullName}`}
            title="ویرایش راننده"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-all hover:bg-orange-100 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:hover:bg-orange-950/40 dark:hover:text-orange-400"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(driver)}
            aria-label={`حذف ${fullName}`}
            title="حذف راننده"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-all hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}