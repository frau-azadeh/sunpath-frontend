import type {
  DispatchStatusConfig,
  DriverActiveDispatch,
  DriverDispatchStatus,
  DriverProfile,
} from './driver-types';

export const mockDriverProfile: DriverProfile = {
  fullName: 'حسین مرادی',
  phoneNumber: '۰۹۱۲ ۱۲۳ ۴۵۶۷',
  driverCode: 'DRV-1042',
  avatarInitials: 'ح م',
  vehicleCount: 1,
  completedDispatches: 24,
  rating: 4.8,
};

export const mockDispatch: DriverActiveDispatch = {
  id: 12,
  status: 'Assigned',
  title: 'ارسال بار به شعبه یزد',
  vehicleName: 'کامیونت ایسوزو',
  vehiclePlate: 'ل ۳۵۵ - ۱۲ ۱۲',
  originTitle: 'انبار مرکزی تهران',
  destinationTitle: 'شعبه یزد',
  distanceKm: 620,
  estimatedDurationMinutes: 480,
  scheduledAt: '۱۴۰۵/۰۵/۳۰ - ۰۸:۳۰',
};

export const dispatchStatusConfig: Record<
  DriverDispatchStatus,
  DispatchStatusConfig
> = {
  Assigned: {
    label: 'آماده‌ی شروع',
    className:
      'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  },

  InProgress: {
    label: 'در حال انجام',
    className:
      'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  },

  Completed: {
    label: 'تکمیل‌شده',
    className:
      'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
};
