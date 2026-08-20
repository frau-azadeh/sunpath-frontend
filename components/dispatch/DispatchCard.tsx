'use client';

import {
  CheckCircle2,
  Clock,
  Edit3,
  Flag,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  User,
} from 'lucide-react';

import type { Dispatch } from '@/types/dispatch';
import type { Driver } from '@/types/driver';
import type { Vehicle } from '@/types/vehicle';

interface DispatchCardProps {
  dispatch: Dispatch;
  vehicle?: Vehicle;
  driver?: Driver;

  onAdd?: () => void;

  onStatusChange?: (
    id: number,
    status: 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled',
  ) => void;

  onEdit?: (dispatch: Dispatch) => void;
  onDelete?: (dispatch: Dispatch) => void;
}

export function DispatchCard({
  dispatch,
  vehicle,
  driver,
  onAdd,
  onStatusChange,
  onEdit,
  onDelete,
}: DispatchCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Assigned':
        return (
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            تخصیص‌داده‌شده
          </span>
        );

      case 'InProgress':
        return (
          <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
            در حال اجرا
          </span>
        );

      case 'Completed':
        return (
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            تکمیل شده
          </span>
        );

      case 'Cancelled':
        return (
          <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            لغو شده
          </span>
        );

      default:
        return (
          <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <Navigation size={18} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {dispatch.title || `مأموریت #${dispatch.id}`}
              </h3>

              <span className="text-[11px] text-neutral-400">
                شناسه: {dispatch.id}
              </span>
            </div>
          </div>

          {getStatusBadge(String(dispatch.status))}
        </div>

        {/* Vehicle + Driver */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <span className="font-semibold text-neutral-400">پلاک:</span>

            <span dir="ltr" className="font-bold">
              {vehicle?.plateNumber ?? `خودرو #${dispatch.vehicleId}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <User size={13} className="text-neutral-400" />

            <span>
              {driver
                ? `${driver.firstName} ${driver.lastName}`
                : `راننده #${dispatch.driverId}`}
            </span>
          </div>
        </div>

        {/* Route */}
        <div className="mt-4 flex flex-col gap-2 rounded-xl bg-neutral-50 p-3 text-xs dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <MapPin size={14} className="shrink-0" />

            <span className="truncate">
              {dispatch.originTitle || 'مبدأ نامشخص'}
            </span>
          </div>

          <div className="mr-1.5 h-3 border-r-2 border-dashed border-neutral-300 dark:border-neutral-700" />

          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <Flag size={14} className="shrink-0" />

            <span className="truncate">
              {dispatch.destinationTitle || 'مقصد نامشخص'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              title="افزودن مأموریت"
              aria-label="افزودن مأموریت"
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <Plus size={14} />
              افزودن
            </button>
          )}

          {dispatch.status === 'Assigned' && onStatusChange && (
            <button
              type="button"
              onClick={() => onStatusChange(dispatch.id, 'InProgress')}
              className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700"
            >
              <Clock size={13} />
              شروع
            </button>
          )}

          {dispatch.status === 'InProgress' && onStatusChange && (
            <button
              type="button"
              onClick={() => onStatusChange(dispatch.id, 'Completed')}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <CheckCircle2 size={13} />
              اتمام
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(dispatch)}
              title="ویرایش مأموریت"
              aria-label="ویرایش مأموریت"
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Edit3 size={13} />
              ویرایش
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(dispatch)}
              title="حذف مأموریت"
              aria-label="حذف مأموریت"
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              <Trash2 size={13} />
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
