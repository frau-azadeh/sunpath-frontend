'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Bike,
  Car,
  Edit3,
  type LucideIcon,
  MapPin,
  Trash2,
  Truck,
} from 'lucide-react';

import { faNumber } from '@/lib/format';
import type { Vehicle } from '@/types/vehicle';

/* =========================================================
   Types
========================================================= */

interface VehicleTableRowProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

interface VehicleTypeMeta {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  wrapperClassName: string;
}

interface PlateParts {
  left: string;
  letter: string;
  middle: string;
  iran: string;
}

type LooseVehicle = Vehicle & Record<string, unknown>;

/* =========================================================
   Vehicle Types
========================================================= */

const vehicleTypeMap: Record<number, VehicleTypeMeta> = {
  0: {
    label: 'سواری',
    icon: Car,

    iconClassName: 'text-violet-600 dark:text-violet-400',

    wrapperClassName:
      'bg-violet-50 ring-violet-100 dark:bg-violet-500/10 dark:ring-violet-500/20',
  },

  1: {
    label: 'وانت / نیسان',

    icon: Truck,

    iconClassName: 'text-orange-600 dark:text-orange-400',

    wrapperClassName:
      'bg-orange-50 ring-orange-100 dark:bg-orange-500/10 dark:ring-orange-500/20',
  },

  2: {
    label: 'کامیون / تریلی',

    icon: Truck,

    iconClassName: 'text-blue-600 dark:text-blue-400',

    wrapperClassName:
      'bg-blue-50 ring-blue-100 dark:bg-blue-500/10 dark:ring-blue-500/20',
  },

  3: {
    label: 'موتورسیکلت',

    icon: Bike,

    iconClassName: 'text-rose-600 dark:text-rose-400',

    wrapperClassName:
      'bg-rose-50 ring-rose-100 dark:bg-rose-500/10 dark:ring-rose-500/20',
  },
};

/* =========================================================
   Number Helpers
========================================================= */

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

/* =========================================================
   Plate
========================================================= */

function parsePlateNumber(value: unknown): PlateParts | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = toEnglishDigits(String(value))
    .trim()
    .replace(/ایران/gi, '')
    .replace(/\s+/g, '')
    .replace(/[_/\\]/g, '-');

  if (!normalized) {
    return null;
  }

  let match = normalized.match(/^(\d{2})([^\d-])(\d{3})-(\d{2})$/);

  if (match) {
    return {
      left: match[1],
      letter: match[2],
      middle: match[3],
      iran: match[4],
    };
  }

  match = normalized.match(/^(\d{2})([^\d])(\d{3})(\d{2})$/);

  if (match) {
    return {
      left: match[1],
      letter: match[2],
      middle: match[3],
      iran: match[4],
    };
  }

  const flexible = normalized.match(/(\d{2})([^\d-])(\d{3}).*?(\d{2})$/);

  if (flexible) {
    return {
      left: flexible[1],

      letter: flexible[2],

      middle: flexible[3],

      iran: flexible[4],
    };
  }

  return null;
}

/* =========================================================
   Vehicle Helpers
========================================================= */

const formatDateTime = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'ثبت نشده';
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return 'ثبت نشده';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const getVehicleTypeValue = (vehicle: Vehicle): number => {
  const v = vehicle as LooseVehicle;

  const raw =
    v.vehicleType ?? v.vehicle_type ?? v.type ?? v.carType ?? v.car_type;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : 0;
};

const getVehicleTypeMeta = (vehicle: Vehicle): VehicleTypeMeta => {
  const typeValue = getVehicleTypeValue(vehicle);

  return vehicleTypeMap[typeValue] ?? vehicleTypeMap[0];
};

const getPlateValue = (vehicle: Vehicle): unknown => {
  const v = vehicle as LooseVehicle;

  return (
    v.plateNumber ??
    v.plate_number ??
    v.plate ??
    v.licensePlate ??
    v.license_plate ??
    ''
  );
};

const getModelValue = (vehicle: Vehicle): string => {
  const v = vehicle as LooseVehicle;

  const value =
    v.model ?? v.name ?? v.title ?? v.vehicleName ?? v.vehicle_name ?? '';

  return String(value).trim();
};

const getSpeedValue = (vehicle: Vehicle): number => {
  const v = vehicle as LooseVehicle;

  const raw = v.speed ?? v.currentSpeed ?? v.current_speed ?? 0;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : 0;
};

const hasValidLocation = (vehicle: Vehicle): boolean => {
  const v = vehicle as LooseVehicle;

  const lat = v.latitude ?? v.lastLatitude ?? v.lat ?? v.y ?? null;

  const lng = v.longitude ?? v.lastLongitude ?? v.lng ?? v.lon ?? v.x ?? null;

  const parsedLat = Number(lat);

  const parsedLng = Number(lng);

  return (
    lat !== null &&
    lng !== null &&
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng) &&
    parsedLat !== 0 &&
    parsedLng !== 0
  );
};

const isActiveVehicle = (vehicle: Vehicle): boolean => {
  const v = vehicle as LooseVehicle;

  const raw = v.status ?? v.isActive ?? v.active ?? 0;

  if (typeof raw === 'boolean') {
    return raw;
  }

  return Number(raw) === 1;
};

/* =========================================================
   Iranian Plate UI
========================================================= */

function VehiclePlate({ value }: { value: unknown }) {
  const parts = parsePlateNumber(value);

  if (!parts) {
    const fallback = String(value ?? '').trim();

    return (
      <div className="space-y-1">
        <div className="inline-flex min-h-10 min-w-[170px] items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-800/60">
          <span
            dir="ltr"
            className="text-xs font-bold text-neutral-500 dark:text-neutral-400"
          >
            {fallback || 'پلاک ثبت نشده'}
          </span>
        </div>

        {fallback && (
          <p className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
            فرمت پلاک قدیمی است
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className="inline-flex h-[46px] min-w-[190px] overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md dark:border-neutral-500"
    >
      {/* Blue */}

      <div className="flex w-[31px] shrink-0 flex-col items-center justify-between bg-blue-700 px-1 py-1.5 text-white">
        <span className="text-[8px] leading-none">🇮🇷</span>

        <span className="text-[5px] font-bold leading-none">I.R.</span>

        <span className="text-[5px] font-bold leading-none">IRAN</span>
      </div>

      {/* First */}

      <div className="flex min-w-[42px] items-center justify-center border-r border-neutral-200 px-1">
        <span className="text-[16px] font-black text-neutral-900">
          {toPersianDigits(parts.left)}
        </span>
      </div>

      {/* Letter */}

      <div className="flex min-w-[34px] items-center justify-center border-r border-neutral-200 px-1">
        <span className="text-[17px] font-black text-neutral-900">
          {parts.letter}
        </span>
      </div>

      {/* Middle */}

      <div className="flex min-w-[54px] items-center justify-center border-r border-neutral-200 px-1">
        <span className="text-[16px] font-black tracking-wide text-neutral-900">
          {toPersianDigits(parts.middle)}
        </span>
      </div>

      {/* Iran */}

      <div className="flex min-w-[43px] flex-col items-center justify-center bg-neutral-50 px-1">
        <span className="text-[7px] font-bold leading-none text-neutral-600">
          ایران
        </span>

        <span className="mt-1 text-[14px] font-black leading-none text-neutral-900">
          {toPersianDigits(parts.iran)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   Main
========================================================= */

export function VehicleTableRow({
  vehicle,
  onEdit,
  onDelete,
}: VehicleTableRowProps) {
  const vehicleType = getVehicleTypeMeta(vehicle);

  const Icon = vehicleType.icon;

  const rawPlate = getPlateValue(vehicle);

  const model = getModelValue(vehicle);

  const speed = getSpeedValue(vehicle);

  const isActive = isActiveVehicle(vehicle);

  const hasLocation = hasValidLocation(vehicle);

  const loose = vehicle as LooseVehicle;

  const plateLabel = String(rawPlate || vehicle.id);

  return (
    <motion.tr
      layout
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      className="group border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/80 dark:border-neutral-800/80 dark:hover:bg-neutral-800/40"
    >
      {/* Vehicle */}

      <td className="px-5 py-4">
        <div className="flex min-w-[290px] items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-200 group-hover:scale-105 ${vehicleType.wrapperClassName}`}
          >
            <Icon
              size={23}
              strokeWidth={1.8}
              className={vehicleType.iconClassName}
            />
          </div>

          <div className="min-w-0">
            <VehiclePlate value={rawPlate} />

            <div className="mt-2 flex items-center gap-2">
              <span className="max-w-[130px] truncate text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {model || 'مدل ثبت نشده'}
              </span>

              <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />

              <span className="text-[10px] text-neutral-400">
                {vehicleType.label}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Type */}

      <td className="hidden px-5 py-4 lg:table-cell">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${vehicleType.wrapperClassName}`}
          >
            <Icon size={15} className={vehicleType.iconClassName} />
          </div>

          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {vehicleType.label}
          </span>
        </div>
      </td>

      {/* Speed */}

      <td className="hidden px-5 py-4 xl:table-cell">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              speed > 0
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
            }`}
          >
            <Activity size={16} />
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                {faNumber(Math.round(speed))}
              </span>

              <span className="text-[10px] text-neutral-400">km/h</span>
            </div>

            <span className="text-[10px] text-neutral-400">
              {speed > 0 ? 'در حال حرکت' : 'متوقف'}
            </span>
          </div>
        </div>
      </td>

      {/* Location */}

      <td className="hidden px-5 py-4 2xl:table-cell">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              hasLocation
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
            }`}
          >
            <MapPin size={16} />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
              {hasLocation ? 'موقعیت ثبت شده' : 'بدون موقعیت'}
            </span>

            {hasLocation && (
              <span className="mt-0.5 text-[10px] text-neutral-400">
                {formatDateTime(
                  loose.lastUpdateAt ?? loose.updatedAt ?? loose.lastLocationAt,
                )}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Status */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
            isActive
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            )}

            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isActive ? 'bg-emerald-500' : 'bg-neutral-400'
              }`}
            />
          </span>

          {isActive ? 'فعال' : 'غیرفعال'}
        </span>
      </td>

      {/* Actions */}

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(vehicle)}
            aria-label={`ویرایش ${plateLabel}`}
            title="ویرایش خودرو"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-neutral-400 transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
          >
            <Edit3 size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(vehicle)}
            aria-label={`حذف ${plateLabel}`}
            title="حذف خودرو"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-neutral-400 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
