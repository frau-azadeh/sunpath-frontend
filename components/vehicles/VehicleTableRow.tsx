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

type LooseVehicle = Vehicle & Record<string, unknown>;

const vehicleTypeMap: Record<number, VehicleTypeMeta> = {
  0: {
    label: 'سواری',
    icon: Car,
    iconClassName: 'text-violet-600 dark:text-violet-400',
    wrapperClassName: 'bg-violet-50 dark:bg-violet-500/10',
  },
  1: {
    label: 'وانت / نیسان',
    icon: Truck,
    iconClassName: 'text-orange-600 dark:text-orange-400',
    wrapperClassName: 'bg-orange-50 dark:bg-orange-500/10',
  },
  2: {
    label: 'کامیون / تریلی',
    icon: Truck,
    iconClassName: 'text-blue-600 dark:text-blue-400',
    wrapperClassName: 'bg-blue-50 dark:bg-blue-500/10',
  },
  3: {
    label: 'موتورسیکلت',
    icon: Bike,
    iconClassName: 'text-rose-600 dark:text-rose-400',
    wrapperClassName: 'bg-rose-50 dark:bg-rose-500/10',
  },
};

const formatDateTime = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'ثبت نشده';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'ثبت نشده';

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const formatPlateNumber = (value: unknown): string => {
  if (value === null || value === undefined) return 'پلاک ثبت نشده';

  const plateNumber = String(value).trim();
  if (!plateNumber) return 'پلاک ثبت نشده';

  return plateNumber.replace(/\d/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) + 1728),
  );
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
  const lat = v.latitude ?? v.lat ?? v.y ?? null;
  const lng = v.longitude ?? v.lng ?? v.lon ?? v.x ?? null;

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  return (
    lat !== null &&
    lng !== null &&
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng)
  );
};

const isActiveVehicle = (vehicle: Vehicle): boolean => {
  const v = vehicle as LooseVehicle;
  const raw = v.status ?? v.isActive ?? v.active ?? 0;

  if (typeof raw === 'boolean') return raw;
  return Number(raw) === 1;
};

export function VehicleTableRow({
  vehicle,
  onEdit,
  onDelete,
}: VehicleTableRowProps) {
  const vehicleType = getVehicleTypeMeta(vehicle);
  const Icon = vehicleType.icon;

  const plateNumber = formatPlateNumber(getPlateValue(vehicle));
  const model = getModelValue(vehicle);
  const speed = getSpeedValue(vehicle);
  const isActive = isActiveVehicle(vehicle);
  const hasLocation = hasValidLocation(vehicle);
  const loose = vehicle as LooseVehicle;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${vehicleType.wrapperClassName}`}
          >
            <Icon size={21} className={vehicleType.iconClassName} />
          </div>

          <div className="min-w-0">
            <p
              dir="ltr"
              className="truncate text-sm font-black text-neutral-900 dark:text-white"
            >
              {plateNumber}
            </p>

            <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {model || 'مدل ثبت نشده'}
            </p>
          </div>
        </div>
      </td>

      <td className="hidden px-5 py-4 lg:table-cell">
        <span className="inline-flex rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {vehicleType.label}
        </span>
      </td>

      <td className="hidden px-5 py-4 xl:table-cell">
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <Activity size={16} className="text-blue-500" />
          <span>{faNumber(Math.round(speed))} کیلومتر</span>
        </div>
      </td>

      <td className="hidden px-5 py-4 2xl:table-cell">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <MapPin
            size={16}
            className={hasLocation ? 'text-emerald-500' : 'text-neutral-400'}
          />
          <span>
            {hasLocation ? formatDateTime(loose.lastUpdateAt) : 'بدون موقعیت'}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? 'bg-emerald-500' : 'bg-neutral-400'
            }`}
          />
          {isActive ? 'فعال' : 'غیرفعال'}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(vehicle)}
            aria-label={`ویرایش ${plateNumber}`}
            title="ویرایش خودرو"
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
          >
            <Edit3 size={18} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(vehicle)}
            aria-label={`حذف ${plateNumber}`}
            title="حذف خودرو"
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
