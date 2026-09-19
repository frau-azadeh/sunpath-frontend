'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { toast } from 'sonner';

import { dispatchService } from '@/services/dispatchService';
import { vehicleService } from '@/services/vehicleService';
import type { Dispatch } from '@/types/dispatch';
import type { Vehicle } from '@/types/vehicle';

import { DriverBottomNavigation } from './DriverBottomNavigation';
import { DriverDispatchView } from './DriverDispatchView';
import { DriverProfileView } from './DriverProfileView';
import { DriverRouteView } from './DriverRouteView';
import { DriverSidebar } from './DriverSidebar';
import { DriverTopbar } from './DriverTopbar';

import type {
  DriverActiveDispatch,
  DriverDispatchStatus,
  DriverPageTab,
  DriverProfile,
  DriverRouteHistory,
} from './driver-types';

type StoredDriverSession = {
  driverId: number;
  fullName: string;
  phone: string;
};

const readDriverSession =
  (): StoredDriverSession | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    /*
     * اگر Login تو session کامل راننده را ذخیره
     * کرده باشد، ابتدا آن را بررسی می‌کنیم.
     */
    const possibleSessionKeys = [
      'driver',
      'driverSession',
      'driverAuth',
      'sunpathDriver',
    ];

    for (const key of possibleSessionKeys) {
      const raw =
        localStorage.getItem(key) ??
        sessionStorage.getItem(key);

      if (!raw) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw);

        const driverId = Number(
          parsed?.driverId ??
            parsed?.DriverId ??
            parsed?.id ??
            parsed?.Id,
        );

        if (
          Number.isFinite(driverId) &&
          driverId > 0
        ) {
          return {
            driverId,

            fullName:
              parsed?.fullName ??
              parsed?.FullName ??
              '',

            phone:
              parsed?.phone ??
              parsed?.Phone ??
              parsed?.phoneNumber ??
              '',
          };
        }
      } catch {
        // ممکن است مقدار ذخیره‌شده JSON نباشد.
      }
    }

    /*
     * حالت دوم: Login فقط driverId را
     * جداگانه ذخیره کرده است.
     */
    const rawDriverId =
      localStorage.getItem('driverId') ??
      sessionStorage.getItem('driverId');

    const driverId = Number(rawDriverId);

    if (
      Number.isFinite(driverId) &&
      driverId > 0
    ) {
      return {
        driverId,
        fullName:
          localStorage.getItem(
            'driverFullName',
          ) ??
          sessionStorage.getItem(
            'driverFullName',
          ) ??
          '',

        phone:
          localStorage.getItem(
            'driverPhone',
          ) ??
          sessionStorage.getItem(
            'driverPhone',
          ) ??
          '',
      };
    }

    return null;
  };

const normalizeDispatchStatus = (
  status: unknown,
): DriverDispatchStatus => {
  if (
    status === 1 ||
    status === '1' ||
    status === 'Assigned'
  ) {
    return 'Assigned';
  }

  if (
    status === 2 ||
    status === '2' ||
    status === 'Started' ||
    status === 'InProgress'
  ) {
    return 'Started';
  }

  if (
    status === 3 ||
    status === '3' ||
    status === 'Completed'
  ) {
    return 'Completed';
  }

  if (
    status === 4 ||
    status === '4' ||
    status === 'Cancelled'
  ) {
    return 'Cancelled';
  }

  return 'Assigned';
};

const getVehiclePlate = (
  vehicle: Vehicle | null,
): string => {
  if (!vehicle) {
    return '';
  }

  const source =
    vehicle as Vehicle & {
      plateNumber?: string | null;
    };

  return source.plateNumber ?? '';
};

const getVehicleName = (
  vehicle: Vehicle | null,
): string => {
  if (!vehicle) {
    return 'خودرو';
  }

  const source =
    vehicle as Vehicle & {
      name?: string | null;
      title?: string | null;
      model?: string | null;
      brand?: string | null;
    };

  if (source.name) {
    return source.name;
  }

  if (source.title) {
    return source.title;
  }

  if (source.brand && source.model) {
    return `${source.brand} ${source.model}`;
  }

  if (source.model) {
    return source.model;
  }

  return `خودرو ${vehicle.id.toLocaleString(
    'fa-IR',
  )}`;
};

const getVehicleType = (
  vehicle: Vehicle | null,
): number | null => {
  if (!vehicle) {
    return null;
  }

  const source =
    vehicle as Vehicle & {
      vehicleType?: number | null;
    };

  return source.vehicleType ?? null;
};

const getDispatchNumber = (
  dispatch: Dispatch,
  key: string,
): number | null => {
  const source = dispatch as unknown as Record<
    string,
    unknown
  >;

  const value = source[key];

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const getDispatchString = (
  dispatch: Dispatch,
  key: string,
): string => {
  const source = dispatch as unknown as Record<
    string,
    unknown
  >;

  const value = source[key];

  return typeof value === 'string'
    ? value
    : '';
};

const mapActiveDispatch = (
  source: Dispatch,
  vehicle: Vehicle | null,
): DriverActiveDispatch => {
  const vehicleId =
    getDispatchNumber(
      source,
      'vehicleId',
    ) ?? 0;

  const createdAt =
    getDispatchString(
      source,
      'createdAtUtc',
    );

  return {
    id: source.id,

    status: normalizeDispatchStatus(
      (
        source as unknown as {
          status?: unknown;
        }
      ).status,
    ),

    title:
      getDispatchString(source, 'title') ||
      `مأموریت ${source.id.toLocaleString(
        'fa-IR',
      )}`,

    description:
      getDispatchString(
        source,
        'description',
      ) || null,

    vehicleId,

    vehiclePlate:
      getVehiclePlate(vehicle),

    vehicleName:
      getVehicleName(vehicle),

    originTitle:
      getDispatchString(
        source,
        'originTitle',
      ) || 'مبدأ',

    originLatitude:
      getDispatchNumber(
        source,
        'originLatitude',
      ),

    originLongitude:
      getDispatchNumber(
        source,
        'originLongitude',
      ),

    destinationTitle:
      getDispatchString(
        source,
        'destinationTitle',
      ) || 'مقصد',

    destinationLatitude:
      getDispatchNumber(
        source,
        'destinationLatitude',
      ),

    destinationLongitude:
      getDispatchNumber(
        source,
        'destinationLongitude',
      ),

    /*
     * فعلاً Backend مأموریت، distance برنامه‌ریزی
     * شده را ذخیره نمی‌کند.
     */
    distanceKm: 0,

    estimatedDurationMinutes: 0,

    scheduledAt: createdAt
      ? new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(createdAt))
      : '—',
  };
};

const getInitials = (
  fullName: string,
): string => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'ر';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1);
  }

  return `${parts[0].slice(
    0,
    1,
  )} ${parts[parts.length - 1].slice(0, 1)}`;
};

export function DriverPortalClient() {
  const [activeTab, setActiveTab] =
    useState<DriverPageTab>('dispatch');

  const [session, setSession] =
    useState<StoredDriverSession | null>(null);

  const [dispatch, setDispatch] =
    useState<DriverActiveDispatch | null>(
      null,
    );

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);

  const [history, setHistory] = useState<
    DriverRouteHistory[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isHistoryLoading,
    setIsHistoryLoading,
  ] = useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    const driverSession =
      readDriverSession();

    setSession(driverSession);

    if (!driverSession) {
      setIsLoading(false);
      setIsHistoryLoading(false);

      toast.error(
        'اطلاعات راننده واردشده پیدا نشد. لطفاً دوباره وارد حساب شوید.',
      );

      return;
    }

    const controller =
      new AbortController();

    const loadPortal = async () => {
      try {
        setIsLoading(true);

        const activeDispatch =
          await dispatchService.getActiveForDriver(
            driverSession.driverId,
            controller.signal,
          );

        if (!activeDispatch) {
          setDispatch(null);
          setVehicle(null);
          return;
        }

        const vehicleId =
          getDispatchNumber(
            activeDispatch,
            'vehicleId',
          );

        let currentVehicle: Vehicle | null =
          null;

        if (
          vehicleId &&
          vehicleId > 0
        ) {
          currentVehicle =
            await vehicleService.getById(
              vehicleId,
              controller.signal,
            );
        }

        if (controller.signal.aborted) {
          return;
        }

        setVehicle(currentVehicle);

        setDispatch(
          mapActiveDispatch(
            activeDispatch,
            currentVehicle,
          ),
        );
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : 'دریافت اطلاعات مأموریت ناموفق بود.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const loadHistory = async () => {
      try {
        setIsHistoryLoading(true);

        const items =
          await dispatchService.getDriverHistory(
            driverSession.driverId,
            controller.signal,
          );

        if (!controller.signal.aborted) {
          setHistory(items);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : 'دریافت تاریخچه مسیر ناموفق بود.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadPortal();
    void loadHistory();

    return () => {
      controller.abort();
    };
  }, []);

  const profile =
    useMemo<DriverProfile>(() => {
      const fullName =
        session?.fullName ||
        'راننده SunPath';

      return {
        id: session?.driverId ?? 0,

        fullName,

        phoneNumber:
          session?.phone || '—',

        driverCode: session?.driverId
          ? `DRV-${String(
              session.driverId,
            ).padStart(4, '0')}`
          : '—',

        avatarInitials:
          getInitials(fullName),

        currentVehicle: vehicle
          ? {
              id: vehicle.id,

              plateNumber:
                getVehiclePlate(vehicle),

              name:
                getVehicleName(vehicle),

              vehicleType:
                getVehicleType(vehicle),
            }
          : null,

        /*
         * تعداد خودروهای تاریخی از Backend فعلی
         * مستقیم در دسترس نیست.
         * تعداد VehicleId یکتا در History +
         * خودروی فعلی را محاسبه می‌کنیم.
         */
        vehicleCount: new Set(
          [
            ...history.map(
              (item) => item.vehicleId,
            ),

            ...(vehicle
              ? [vehicle.id]
              : []),
          ].filter(
            (id) => id > 0,
          ),
        ).size,

        completedDispatches:
          history.length,

        /*
         * Backend فعلی Rating ندارد.
         * عدد جعلی نمایش نمی‌دهیم.
         */
        rating: 0,
      };
    }, [history, session, vehicle]);

  const reloadHistory =
    async (): Promise<void> => {
      if (!session) {
        return;
      }

      try {
        setIsHistoryLoading(true);

        const items =
          await dispatchService.getDriverHistory(
            session.driverId,
          );

        setHistory(items);
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'دریافت تاریخچه مسیر ناموفق بود.',
        );
      } finally {
        setIsHistoryLoading(false);
      }
    };

  const handleStartDispatch =
    async (): Promise<void> => {
      if (!dispatch) {
        return;
      }

      try {
        setIsSubmitting(true);

        await dispatchService.updateStatus(
          dispatch.id,
          {
            status: 'Started',
          },
        );

        setDispatch((current) =>
          current
            ? {
                ...current,
                status: 'Started',
              }
            : null,
        );

        toast.success(
          'مأموریت شروع شد.',
        );
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'شروع مأموریت ناموفق بود.',
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const handleCompleteDispatch =
    async (): Promise<void> => {
      if (!dispatch) {
        return;
      }

      try {
        setIsSubmitting(true);

        await dispatchService.updateStatus(
          dispatch.id,
          {
            status: 'Completed',
          },
        );

        toast.success(
          'مأموریت با موفقیت پایان یافت.',
        );

        setDispatch(null);
        setVehicle(null);

        await reloadHistory();

        setActiveTab('profile');
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'پایان مأموریت ناموفق بود.',
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <div className="rounded-3xl border border-neutral-200 bg-white px-8 py-7 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-orange-600 dark:border-neutral-700 dark:border-t-orange-500" />

          <p className="mt-4 text-sm font-bold">
            در حال دریافت اطلاعات راننده...
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <section className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-lg font-black">
            اطلاعات ورود پیدا نشد
          </h1>

          <p className="mt-3 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            شناسه راننده در مرورگر ذخیره نشده
            است. لطفاً از صفحه ورود راننده
            دوباره وارد سامانه شوید.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px]">
        <DriverSidebar
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <DriverTopbar
            profile={profile}
            activeTab={activeTab}
            onProfileClick={() =>
              setActiveTab('profile')
            }
          />

          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {activeTab === 'dispatch' &&
              (dispatch ? (
                <DriverDispatchView
                  dispatch={dispatch}
                  isSubmitting={
                    isSubmitting
                  }
                  onStartDispatch={
                    handleStartDispatch
                  }
                  onCompleteDispatch={
                    handleCompleteDispatch
                  }
                />
              ) : (
                <section className="rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="font-black">
                    مأموریت فعالی ندارید
                  </p>

                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    پس از تخصیص مأموریت توسط
                    مدیر ناوگان، اطلاعات آن در
                    این بخش نمایش داده می‌شود.
                  </p>
                </section>
              ))}

            {activeTab === 'route' &&
              (dispatch ? (
                <DriverRouteView
                  dispatch={dispatch}
                />
              ) : (
                <section className="rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="font-black">
                    مسیر فعالی وجود ندارد
                  </p>

                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    برای نمایش مسیر، ابتدا باید
                    مأموریتی به شما تخصیص داده
                    شود.
                  </p>
                </section>
              ))}

            {activeTab === 'profile' && (
              <DriverProfileView
                profile={profile}
                history={history}
                historyLoading={
                  isHistoryLoading
                }
              />
            )}
          </div>
        </div>
      </div>

      <DriverBottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </main>
  );
}