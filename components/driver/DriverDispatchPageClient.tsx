'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import {
  Award,
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDotDashed,
  Clock,
  Clock3,
  Flag,
  Fuel,
  Gauge,
  History,
  Loader2,
  LogOut,
  Map,
  MapPin,
  Navigation,
  PauseCircle,
  Play,
  Route,
  Square,
  UserRound,
  X,
} from 'lucide-react';

import { toast } from 'sonner';

import {
  type ActiveMission,
  useDriverNavigation,
} from '@/hooks/useDriverNavigation';

import { dispatchService } from '@/services/dispatchService';
import { vehicleService } from '@/services/vehicleService';
import { useDriverAuthStore } from '@/store/useDriverAuthStore';

import type {
  DriverRouteHistory,
} from '@/components/driver/driver-types';

import type { Dispatch } from '@/types/dispatch';
import type { Vehicle } from '@/types/vehicle';
const DriverNavigationMap = dynamic(
  () =>
    import(
      '@/components/driver/DriverNavigationMap'
    ).then(
      (module) =>
        module.DriverNavigationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full animate-pulse items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        در حال بارگذاری نقشه ناوبری...
      </div>
    ),
  },
);

type DriverPageTab =
  | 'dispatch'
  | 'route'
  | 'history'
  | 'profile';

type IranianPlateParts = {
  firstTwo: string;
  letter: string;
  middleThree: string;
  cityTwo: string;
};

/* -------------------------------------------------------------------------- */
/*                               Mission Mapper                               */
/* -------------------------------------------------------------------------- */

const toMission = (
  dispatch: Dispatch | null,
): ActiveMission | null => {
  if (
    !dispatch ||
    dispatch.id == null ||
    dispatch.vehicleId == null ||
    dispatch.originLatitude == null ||
    dispatch.originLongitude == null ||
    dispatch.destinationLatitude == null ||
    dispatch.destinationLongitude == null
  ) {
    return null;
  }

  const status = String(
    dispatch.status,
  ).toLowerCase();

  return {
    id: dispatch.id,

    driverId: dispatch.driverId,

    vehicleId: dispatch.vehicleId,

    originName:
      dispatch.originTitle ||
      'مبدأ مأموریت',

    originLat: Number(
      dispatch.originLatitude,
    ),

    originLng: Number(
      dispatch.originLongitude,
    ),

    destinationName:
      dispatch.destinationTitle ||
      'مقصد مأموریت',

    destinationLat: Number(
      dispatch.destinationLatitude,
    ),

    destinationLng: Number(
      dispatch.destinationLongitude,
    ),

    status:
      status === '2' ||
      status === 'started' ||
      status === 'inprogress' ||
      status === 'in_progress'
        ? 'in_progress'
        : status === '3' ||
            status === 'completed'
          ? 'completed'
          : 'assigned',
  };
};

/* -------------------------------------------------------------------------- */
/*                               Number Helpers                               */
/* -------------------------------------------------------------------------- */

function toEnglishDigits(
  value: string,
): string {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(
        '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit),
      ),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(
        '٠١٢٣٤٥٦٧٨٩'.indexOf(digit),
      ),
    );
}

function toPersianDigits(
  value: string | number,
): string {
  return String(value).replace(
    /\d/g,
    (digit) =>
      '۰۱۲۳۴۵۶۷۸۹'[Number(digit)],
  );
}

/* -------------------------------------------------------------------------- */
/*                                Plate Helpers                               */
/* -------------------------------------------------------------------------- */

function normalizePlate(
  value?: string | null,
): string {
  if (!value) {
    return '';
  }

  return toEnglishDigits(value)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .trim();
}

function parseIranianPlate(
  value?: string | null,
): IranianPlateParts | null {
  const normalized =
    normalizePlate(value);

  if (!normalized) {
    return null;
  }

  const cleaned = normalized
    .replace(/ایران/g, '')
    .replace(/-/g, '');

  const match = cleaned.match(
    /^(\d{2})([آ-ی])(\d{3})(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  return {
    firstTwo: match[1],
    letter: match[2],
    middleThree: match[3],
    cityTwo: match[4],
  };
}

/* -------------------------------------------------------------------------- */
/*                              Duration Helper                               */
/* -------------------------------------------------------------------------- */

function formatDuration(
  seconds: number,
): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(
      Number.isFinite(seconds)
        ? seconds
        : 0,
    ),
  );

  const hours = Math.floor(
    safeSeconds / 3600,
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );

  const remainingSeconds =
    safeSeconds % 60;

  if (hours > 0) {
    return `${hours.toLocaleString(
      'fa-IR',
    )} ساعت و ${minutes.toLocaleString(
      'fa-IR',
    )} دقیقه`;
  }

  return `${minutes.toLocaleString(
    'fa-IR',
  )} دقیقه و ${remainingSeconds.toLocaleString(
    'fa-IR',
  )} ثانیه`;
}

/* -------------------------------------------------------------------------- */
/*                                Date Helper                                 */
/* -------------------------------------------------------------------------- */

function formatDateTime(
  value?: string | null,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'fa-IR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */

export function DriverDispatchPageClient() {
  const router = useRouter();

  const {
    driver,
    hydrate,
    logout,
  } = useDriverAuthStore();

  const [
    activeTab,
    setActiveTab,
  ] = useState<DriverPageTab>(
    'dispatch',
  );

  const [
    isProfileOpen,
    setIsProfileOpen,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isHistoryLoading,
    setIsHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState<string | null>(
    null,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    dispatch,
    setDispatch,
  ] = useState<Dispatch | null>(
    null,
  );

  const [
    vehicle,
    setVehicle,
  ] = useState<Vehicle | null>(
    null,
  );

  const [
    history,
    setHistory,
  ] = useState<
    DriverRouteHistory[]
  >([]);

  const [
    expandedHistoryId,
    setExpandedHistoryId,
  ] = useState<number | null>(
    null,
  );

  /* ---------------------------------------------------------------------- */
  /*                              Hydrate Auth                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  /* ---------------------------------------------------------------------- */
  /*                              Auth Guard                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (
      !driver &&
      typeof window !==
        'undefined' &&
      !localStorage.getItem(
        'driver_session',
      )
    ) {
      router.replace(
        '/driver/login',
      );
    }
  }, [driver, router]);

  /* ---------------------------------------------------------------------- */
  /*                             Load History                               */
  /* ---------------------------------------------------------------------- */

  const loadHistory =
    useCallback(
      async (
        showLoading = true,
      ): Promise<void> => {
        if (!driver?.driverId) {
          setHistory([]);
          return;
        }

        if (showLoading) {
          setIsHistoryLoading(
            true,
          );
        }

        setHistoryError(null);

        try {
          const items =
            await dispatchService.getDriverHistory(
              driver.driverId,
            );

          setHistory(
            Array.isArray(items)
              ? items
              : [],
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'دریافت سوابق مأموریت‌ها ناموفق بود.';

          setHistoryError(
            message,
          );

          if (showLoading) {
            toast.error(
              message,
            );
          }
        } finally {
          if (showLoading) {
            setIsHistoryLoading(
              false,
            );
          }
        }
      },
      [driver?.driverId],
    );

  /* ---------------------------------------------------------------------- */
  /*                        Load Dispatch + Vehicle                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!driver?.driverId) {
      return;
    }

    let cancelled = false;

    const load =
      async (): Promise<void> => {
        setIsLoading(true);

        try {
          const [
            active,
            historyItems,
          ] =
            await Promise.all([
              dispatchService.getActiveForDriver(
                driver.driverId,
              ),

              dispatchService
                .getDriverHistory(
                  driver.driverId,
                )
                .catch(() => []),
            ]);

          if (cancelled) {
            return;
          }

          setDispatch(active);

          setHistory(
            Array.isArray(
              historyItems,
            )
              ? historyItems
              : [],
          );

          if (
            active?.vehicleId !=
              null &&
            Number(
              active.vehicleId,
            ) > 0
          ) {
            try {
              const currentVehicle =
                await vehicleService.getById(
                  Number(
                    active.vehicleId,
                  ),
                );

              if (!cancelled) {
                setVehicle(
                  currentVehicle,
                );
              }
            } catch (error) {
              if (!cancelled) {
                setVehicle(null);

                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'دریافت اطلاعات خودرو ناموفق بود.',
                );
              }
            }
          } else {
            setVehicle(null);
          }
        } catch (error) {
          if (!cancelled) {
            setDispatch(null);
            setVehicle(null);

            toast.error(
              error instanceof Error
                ? error.message
                : 'دریافت مأموریت ناموفق بود.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, [driver?.driverId]);

  /* ---------------------------------------------------------------------- */
  /*                       History Tab Refresh                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (
      activeTab !==
        'history' ||
      !driver?.driverId
    ) {
      return;
    }

    void loadHistory();
  }, [
    activeTab,
    driver?.driverId,
    loadHistory,
  ]);

  /* ---------------------------------------------------------------------- */
  /*                              Navigation                                */
  /* ---------------------------------------------------------------------- */

  const mission = useMemo(
    () => toMission(dispatch),
    [dispatch],
  );

  const navigation =
    useDriverNavigation(
      mission,
      driver?.driverId || 0,
    );

  /* ---------------------------------------------------------------------- */
  /*                           Start Dispatch                               */
  /* ---------------------------------------------------------------------- */

  const handleStart =
    async (): Promise<void> => {
      if (!dispatch) {
        return;
      }

      setIsSubmitting(true);

      try {
        await dispatchService.updateStatus(
          dispatch.id,
          {
            status: 'Started',
          },
        );

        setDispatch((previous) =>
          previous
            ? {
                ...previous,
                status: 'Started',
              }
            : previous,
        );

        navigation.startTracking();

        toast.success(
          'مأموریت شروع شد. GPS زنده فعال است.',
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'شروع مأموریت ناموفق بود.',
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /* ---------------------------------------------------------------------- */
  /*                          Complete Dispatch                             */
  /* ---------------------------------------------------------------------- */

  const handleComplete =
    async (): Promise<void> => {
      if (!dispatch) {
        return;
      }

      const completedId =
        dispatch.id;

      setIsSubmitting(true);

      try {
        /*
         * اول GPS را متوقف می‌کنیم تا بعد از
         * Completed نقطه جدیدی برای مأموریت ارسال نشود.
         */
        navigation.stopTracking();

        await dispatchService.updateStatus(
          completedId,
          {
            status: 'Completed',
          },
        );

        /*
         * Backend در همین لحظه:
         *
         * Status = 3
         * CompletedAtUtc = now
         *
         * را ثبت کرده است.
         *
         * بنابراین History را مستقیم از DB
         * دوباره می‌خوانیم.
         */
        if (driver?.driverId) {
          const historyItems =
            await dispatchService.getDriverHistory(
              driver.driverId,
            );

          setHistory(
            Array.isArray(
              historyItems,
            )
              ? historyItems
              : [],
          );
        }

        /*
         * مأموریت Completed دیگر Active نیست.
         */
        setDispatch(null);
        setVehicle(null);

        setExpandedHistoryId(
          completedId,
        );

        setActiveTab(
          'history',
        );

        toast.success(
          'مأموریت پایان یافت و در سوابق ثبت شد.',
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'پایان مأموریت ناموفق بود.',
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /* ---------------------------------------------------------------------- */
  /*                                Logout                                  */
  /* ---------------------------------------------------------------------- */

  const handleLogout = () => {
    navigation.stopTracking();

    logout();

    router.replace(
      '/driver/login',
    );
  };

  /* ---------------------------------------------------------------------- */
  /*                           Driver Information                           */
  /* ---------------------------------------------------------------------- */

  const fullName =
    driver?.fullName || 'راننده';

  const initials = useMemo(() => {
    const parts = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length > 1) {
      return `${parts[0][0]} ${
        parts[
          parts.length - 1
        ][0]
      }`;
    }

    return fullName.slice(
      0,
      2,
    );
  }, [fullName]);

  const status =
    mission?.status ||
    'assigned';

  const hasMission =
    Boolean(mission);

  /* ---------------------------------------------------------------------- */
  /*                                  UI                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <main
      className="min-h-dvh bg-neutral-50 pb-28 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}

        <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-neutral-50/90 px-4 py-3 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/90 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setIsProfileOpen(
                  true,
                )
              }
              className="flex min-w-0 items-center gap-2.5 rounded-2xl p-1 text-right transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-sm font-bold text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {fullName}
                </p>

                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {driver?.phone ||
                    '—'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    'اعلان جدیدی برای شما وجود ندارد.',
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <Bell
                  size={18}
                />

                <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
              </button>

              <button
                type="button"
                onClick={() =>
                  document.documentElement.classList.toggle(
                    'dark',
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <span className="text-xs">
                  ◐
                </span>
              </button>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
              >
                <LogOut
                  size={18}
                />
              </button>
            </div>
          </div>
        </header>

        {/* SunPath Header */}

        <section className="px-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between rounded-3xl border border-orange-100 bg-white p-4 dark:border-orange-950/60 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Navigation
                  size={24}
                />
              </div>

              <div>
                <p className="text-lg tracking-tight">
                  SunPath Driver
                </p>

                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  مدیریت مأموریت،
                  مسیر و سوابق راننده
                </p>
              </div>
            </div>

            <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-orange-50 px-2 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <TruckIcon />
            </div>
          </div>
        </section>

        {/* Content */}

        <div className="px-4 pb-6 pt-5 sm:px-6">
          {/*
           * History مستقل از Active Mission است.
           *
           * بنابراین حتی اگر مأموریت فعالی وجود نداشته باشد
           * کاربر همچنان می‌تواند سوابق را ببیند.
           */}

          {activeTab ===
          'history' ? (
            <HistoryView
              history={history}
              isLoading={
                isHistoryLoading
              }
              error={
                historyError
              }
              expandedHistoryId={
                expandedHistoryId
              }
              onToggleExpanded={(
                id,
              ) =>
                setExpandedHistoryId(
                  (
                    previous,
                  ) =>
                    previous ===
                    id
                      ? null
                      : id,
                )
              }
              onRefresh={() =>
                void loadHistory()
              }
            />
          ) : isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2
                size={38}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : activeTab ===
            'profile' ? (
            <div className="flex flex-col gap-5">
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-lg font-bold text-white">
                    {initials}
                  </div>

                  <div>
                    <h1 className="text-lg font-bold">
                      {fullName}
                    </h1>

                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      شماره تماس:{' '}
                      {driver?.phone ||
                        '—'}
                    </p>

                    <p className="text-xs text-neutral-400">
                      شناسه راننده:{' '}
                      {driver?.driverId?.toLocaleString(
                        'fa-IR',
                      ) || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-neutral-100 pt-5 sm:grid-cols-2 dark:border-neutral-800">
                  <SmallStat
                    icon={
                      <History
                        size={17}
                        className="text-blue-500"
                      />
                    }
                    label="مأموریت‌های تکمیل‌شده"
                    value={`${history.length.toLocaleString(
                      'fa-IR',
                    )} مأموریت`}
                  />

                  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950">
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <BadgeCheck
                        size={17}
                        className="text-emerald-500"
                      />

                      <span className="text-xs">
                        خودروی جاری
                      </span>
                    </div>

                    {vehicle ? (
                      <div className="mt-3">
                        <IranianVehiclePlate
                          plateNumber={
                            vehicle.plateNumber
                          }
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {vehicle.model && (
                            <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-neutral-700 shadow-sm dark:bg-neutral-900 dark:text-neutral-200">
                              {
                                vehicle.model
                              }
                            </span>
                          )}

                          <span className="rounded-lg bg-white px-2.5 py-1 text-xs text-neutral-500 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
                            شناسه خودرو:{' '}
                            {vehicle.id.toLocaleString(
                              'fa-IR',
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-neutral-300 px-3 py-3 text-center text-xs font-bold text-neutral-400 dark:border-neutral-700">
                        خودرویی برای
                        مأموریت فعال
                        تخصیص داده نشده
                        است
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                    <UserRound
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      وضعیت اتصال GPS
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {navigation.isDriving
                        ? 'ارسال لحظه‌ای موقعیت فعال است.'
                        : 'GPS زنده در حال حاضر فعال نیست.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : !hasMission ? (
            <NoActiveMission
              onOpenHistory={() =>
                setActiveTab(
                  'history',
                )
              }
              historyCount={
                history.length
              }
            />
          ) : activeTab ===
            'dispatch' ? (
            <div className="flex flex-col gap-5">
              {/* Mission */}

              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 p-5 dark:border-neutral-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          مأموریت #
                          {dispatch?.id.toLocaleString(
                            'fa-IR',
                          )}
                        </p>

                        <span className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
                          {status ===
                          'assigned'
                            ? 'آماده‌ی شروع'
                            : status ===
                                'in_progress'
                              ? 'در حال انجام (GPS زنده)'
                              : 'تکمیل‌شده'}
                        </span>
                      </div>

                      <h1 className="mt-2 text-xl font-bold">
                        {dispatch?.title ||
                          `حرکت به ${mission?.destinationName}`}
                      </h1>

                      <div className="mt-4 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
                        <p className="mb-2 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          خودروی مأموریت
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <IranianVehiclePlate
                            plateNumber={
                              vehicle?.plateNumber
                            }
                            compact
                          />

                          {vehicle?.model && (
                            <div>
                              <p className="text-[10px] text-neutral-400">
                                مدل خودرو
                              </p>

                              <p className="mt-0.5 text-xs font-bold text-neutral-800 dark:text-neutral-100">
                                {
                                  vehicle.model
                                }
                              </p>
                            </div>
                          )}

                          {!vehicle && (
                            <span className="text-xs text-neutral-500">
                              شناسه خودرو:{' '}
                              {mission?.vehicleId.toLocaleString(
                                'fa-IR',
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                      <Navigation
                        size={21}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <InfoRow
                    icon={
                      <MapPin
                        size={18}
                      />
                    }
                    iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    label="مبدأ مأموریت"
                    value={
                      mission!
                        .originName
                    }
                  />

                  <InfoRow
                    icon={
                      <Flag
                        size={18}
                      />
                    }
                    iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    label="مقصد مأموریت"
                    value={
                      mission!
                        .destinationName
                    }
                  />

                  <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <InfoRow
                      compact
                      icon={
                        <Route
                          size={17}
                        />
                      }
                      label="مسافت پیموده‌شده"
                      value={`${navigation.stats.totalDistanceKm.toLocaleString(
                        'fa-IR',
                      )} کیلومتر`}
                    />

                    <InfoRow
                      compact
                      icon={
                        <Clock3
                          size={17}
                        />
                      }
                      label="مدت زمان سفر"
                      value={formatDuration(
                        navigation
                          .stats
                          .durationSeconds,
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Stats */}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SmallStat
                  icon={
                    <Gauge
                      size={18}
                      className="text-amber-500"
                    />
                  }
                  label="سرعت لحظه‌ای"
                  value={`${navigation.stats.currentSpeed.toLocaleString(
                    'fa-IR',
                  )} km/h`}
                />

                <SmallStat
                  icon={
                    <Fuel
                      size={18}
                      className="text-emerald-500"
                    />
                  }
                  label="مصرف سوخت"
                  value={`${navigation.stats.fuelConsumedLiters.toLocaleString(
                    'fa-IR',
                  )} لیتر`}
                />

                <SmallStat
                  icon={
                    <PauseCircle
                      size={18}
                      className="text-rose-500"
                    />
                  }
                  label="مدت توقف درجا"
                  value={formatDuration(
                    navigation
                      .stats
                      .stopDurationSeconds,
                  )}
                />

                <SmallStat
                  icon={
                    <Award
                      size={18}
                      className="text-orange-500"
                    />
                  }
                  label="امتیاز رانندگی"
                  value={`${navigation.stats.efficiencyScore.toLocaleString(
                    'fa-IR',
                  )} از ۱۰۰`}
                />
              </div>

              <TrackingCard
                active={
                  navigation.isDriving
                }
                error={
                  navigation.gpsError
                }
              />

              {status ===
                'assigned' && (
                <button
                  type="button"
                  onClick={() =>
                    void handleStart()
                  }
                  disabled={
                    isSubmitting
                  }
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-base font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <>
                      <Play
                        size={19}
                        fill="currentColor"
                      />

                      شروع مأموریت و
                      ردیابی
                    </>
                  )}
                </button>
              )}

              {status ===
                'in_progress' && (
                <button
                  type="button"
                  onClick={() =>
                    void handleComplete()
                  }
                  disabled={
                    isSubmitting
                  }
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <>
                      <Square
                        size={19}
                        fill="currentColor"
                      />

                      پایان مأموریت و
                      ثبت عملکرد
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* Route */

            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
                  <div>
                    <p className="text-lg font-bold">
                      نقشه‌ی ناوبری و
                      ترافیک زنده
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      مسیر حرکت از{' '}
                      {
                        mission!
                          .originName
                      }{' '}
                      به مقصد{' '}
                      {
                        mission!
                          .destinationName
                      }
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                    <Map
                      size={21}
                    />
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <DriverNavigationMap
  currentLocation={navigation.currentLocation}
  destination={{
    lat: mission!.destinationLat,
    lng: mission!.destinationLng,
    name: mission!.destinationName,
  }}
  origin={{
    lat: mission!.originLat,
    lng: mission!.originLng,
    name: mission!.originName,
  }}
  routeCoordinates={navigation.routeCoordinates}
  heading={navigation.stats.heading}
  showTrafficLayer
/>
                  </div>

                  <div className="mt-4">
                    {navigation.isDriving ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleComplete()
                        }
                        disabled={
                          isSubmitting
                        }
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 font-bold text-white disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <>
                            <Square
                              size={18}
                              fill="currentColor"
                            />

                            توقف و ثبت
                            پایان مأموریت
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void handleStart()
                        }
                        disabled={
                          isSubmitting
                        }
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <>
                            <Play
                              size={18}
                              fill="currentColor"
                            />

                            شروع حرکت به
                            سمت مقصد
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-bold">
                  خلاصه تله‌متری و
                  مصرف سوخت
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <SmallStat
                    icon={
                      <Route
                        size={17}
                      />
                    }
                    label="مسافت پیموده"
                    value={`${navigation.stats.totalDistanceKm.toLocaleString(
                      'fa-IR',
                    )} کیلومتر`}
                  />

                  <SmallStat
                    icon={
                      <Clock
                        size={17}
                      />
                    }
                    label="زمان کل سفر"
                    value={formatDuration(
                      navigation
                        .stats
                        .durationSeconds,
                    )}
                  />

                  <SmallStat
                    icon={
                      <Fuel
                        size={17}
                      />
                    }
                    label="مصرف سوخت تخمینی"
                    value={`${navigation.stats.fuelConsumedLiters.toLocaleString(
                      'fa-IR',
                    )} لیتر`}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={
          setActiveTab
        }
      />

      <ProfileSheet
        isOpen={isProfileOpen}
        fullName={fullName}
        phone={
          driver?.phone || '—'
        }
        initials={initials}
        onClose={() =>
          setIsProfileOpen(
            false,
          )
        }
        onLogout={
          handleLogout
        }
      />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                              No Active Mission                             */
/* -------------------------------------------------------------------------- */

function NoActiveMission({
  onOpenHistory,
  historyCount,
}: {
  onOpenHistory: () => void;
  historyCount: number;
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <Navigation
        className="mx-auto text-neutral-400"
        size={42}
      />

      <p className="mt-4 text-base font-bold">
        در حال حاضر مأموریت فعالی
        ندارید.
      </p>

      <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
        پس از تخصیص مأموریت توسط
        مدیر، مسیر و مقصد در همین
        پنل نمایش داده می‌شود.
      </p>

      {historyCount > 0 && (
        <button
          type="button"
          onClick={
            onOpenHistory
          }
          className="mx-auto mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-50 px-5 text-sm font-bold text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
        >
          <History
            size={18}
          />

          مشاهده{' '}
          {historyCount.toLocaleString(
            'fa-IR',
          )}{' '}
          مأموریت قبلی
        </button>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               History View                                 */
/* -------------------------------------------------------------------------- */

function HistoryView({
  history,
  isLoading,
  error,
  expandedHistoryId,
  onToggleExpanded,
  onRefresh,
}: {
  history: DriverRouteHistory[];
  isLoading: boolean;
  error: string | null;
  expandedHistoryId:
    | number
    | null;
  onToggleExpanded: (
    id: number,
  ) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
              <History
                size={21}
              />
            </div>

            <div>
              <h1 className="text-lg font-bold">
                سوابق مأموریت‌ها
              </h1>

              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                مأموریت‌های تکمیل‌شده
                و مسیرهای ثبت‌شده GPS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onRefresh
            }
            disabled={
              isLoading
            }
            className="flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {isLoading ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              'بروزرسانی'
            )}
          </button>
        </div>

        {!isLoading &&
          !error && (
            <div className="mt-4 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
              تعداد مأموریت‌های
              تکمیل‌شده:{' '}
              <strong className="text-neutral-800 dark:text-neutral-100">
                {history.length.toLocaleString(
                  'fa-IR',
                )}
              </strong>
            </div>
          )}
      </section>

      {isLoading &&
      history.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-center">
            <Loader2
              size={32}
              className="mx-auto animate-spin text-orange-500"
            />

            <p className="mt-3 text-xs text-neutral-500">
              در حال دریافت سوابق...
            </p>
          </div>
        </div>
      ) : error &&
        history.length === 0 ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            دریافت سوابق ناموفق بود.
          </p>

          <p className="mt-2 text-xs leading-6 text-rose-600 dark:text-rose-400">
            {error}
          </p>

          <button
            type="button"
            onClick={
              onRefresh
            }
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
          >
            تلاش مجدد
          </button>
        </section>
      ) : history.length ===
        0 ? (
        <section className="rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <History
            size={42}
            className="mx-auto text-neutral-300 dark:text-neutral-700"
          />

          <p className="mt-4 text-base font-bold">
            هنوز سابقه‌ای ثبت نشده
            است.
          </p>

          <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
            پس از پایان اولین مأموریت،
            اطلاعات آن به‌صورت خودکار
            در این قسمت نمایش داده
            می‌شود.
          </p>
        </section>
      ) : (
        history.map(
          (item) => (
            <HistoryCard
              key={
                item.dispatchId
              }
              item={item}
              expanded={
                expandedHistoryId ===
                item.dispatchId
              }
              onToggle={() =>
                onToggleExpanded(
                  item.dispatchId,
                )
              }
            />
          ),
        )
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               History Card                                 */
/* -------------------------------------------------------------------------- */

function HistoryCard({
  item,
  expanded,
  onToggle,
}: {
  item: DriverRouteHistory;
  expanded: boolean;
  onToggle: () => void;
}) {
  const gpsCount =
    Array.isArray(item.points)
      ? item.points.length
      : 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-right"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                تکمیل‌شده
              </span>

              <span className="text-xs text-neutral-400">
                مأموریت #
                {item.dispatchId.toLocaleString(
                  'fa-IR',
                )}
              </span>
            </div>

            <h2 className="mt-3 truncate text-base font-bold">
              {item.title ||
                'مأموریت بدون عنوان'}
            </h2>

            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <MapPin
                size={15}
                className="shrink-0 text-emerald-500"
              />

              <span className="truncate">
                {item.originTitle ||
                  'مبدأ نامشخص'}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Flag
                size={15}
                className="shrink-0 text-rose-500"
              />

              <span className="truncate">
                {item.destinationTitle ||
                  'مقصد نامشخص'}
              </span>
            </div>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
            {expanded ? (
              <ChevronUp
                size={19}
              />
            ) : (
              <ChevronDown
                size={19}
              />
            )}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 px-5 py-4 sm:grid-cols-3 dark:border-neutral-800">
        <HistoryMiniStat
          icon={
            <Route
              size={16}
            />
          }
          label="مسافت"
          value={`${Number(
            item.distanceKm || 0,
          ).toLocaleString(
            'fa-IR',
            {
              maximumFractionDigits: 2,
            },
          )} کیلومتر`}
        />

        <HistoryMiniStat
          icon={
            <Clock
              size={16}
            />
          }
          label="مدت سفر"
          value={formatDuration(
            Number(
              item.durationSeconds ||
                0,
            ),
          )}
        />

        <HistoryMiniStat
          icon={
            <CircleDotDashed
              size={16}
            />
          }
          label="نقاط GPS"
          value={`${gpsCount.toLocaleString(
            'fa-IR',
          )} نقطه`}
        />
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 p-5 dark:border-neutral-800">
          {/* Vehicle */}

          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950">
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              خودروی این مأموریت
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <IranianVehiclePlate
                plateNumber={
                  item.vehiclePlate
                }
              />

              <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-neutral-500 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
                شناسه خودرو:{' '}
                {item.vehicleId.toLocaleString(
                  'fa-IR',
                )}
              </span>
            </div>
          </div>

          {/* Dates */}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoRow
              icon={
                <Play
                  size={17}
                />
              }
              iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
              label="زمان شروع مأموریت"
              value={formatDateTime(
                item.startedAtUtc,
              )}
            />

            <InfoRow
              icon={
                <BadgeCheck
                  size={17}
                />
              }
              iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              label="زمان پایان مأموریت"
              value={formatDateTime(
                item.completedAtUtc,
              )}
            />
          </div>

          {/* Route */}

          <div className="mt-4 rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
            <p className="mb-4 text-sm font-bold">
              مسیر مأموریت
            </p>

            <div className="space-y-4">
              <InfoRow
                icon={
                  <MapPin
                    size={17}
                  />
                }
                iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                label="مبدأ"
                value={
                  item.originTitle ||
                  'ثبت نشده'
                }
              />

              <InfoRow
                icon={
                  <Flag
                    size={17}
                  />
                }
                iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                label="مقصد"
                value={
                  item.destinationTitle ||
                  'ثبت نشده'
                }
              />
            </div>
          </div>

          {/* GPS summary */}

          <div className="mt-4 rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">
                  داده‌های GPS ثبت‌شده
                </p>

                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  نقاط واقعی ثبت‌شده
                  در طول این مأموریت
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                {gpsCount.toLocaleString(
                  'fa-IR',
                )}{' '}
                نقطه
              </div>
            </div>

            {gpsCount === 0 ? (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                برای این مأموریت نقطه
                GPS ثبت نشده است. اگر
                مأموریت بدون فعال بودن
                GPS پایان یافته باشد،
                مسیر واقعی قابل نمایش
                نخواهد بود.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <GpsPointCard
                  title="اولین موقعیت"
                  point={
                    item.points[0]
                  }
                />

                <GpsPointCard
                  title="آخرین موقعیت"
                  point={
                    item.points[
                      item.points
                        .length - 1
                    ]
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <BadgeCheck
              size={17}
            />

            این مأموریت در سوابق راننده
            ثبت شده است.
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              GPS Point Card                                */
/* -------------------------------------------------------------------------- */

function GpsPointCard({
  title,
  point,
}: {
  title: string;
  point:
    DriverRouteHistory['points'][number];
}) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
      <p className="text-xs font-bold">
        {title}
      </p>

      <p
        dir="ltr"
        className="mt-2 text-left text-[11px] text-neutral-500 dark:text-neutral-400"
      >
        {Number(
          point.latitude,
        ).toFixed(6)}
        ,{' '}
        {Number(
          point.longitude,
        ).toFixed(6)}
      </p>

      <p className="mt-2 text-[11px] text-neutral-400">
        {formatDateTime(
          point.recordedAtUtc,
        )}
      </p>

      {point.speed != null && (
        <p className="mt-1 text-[11px] text-neutral-400">
          سرعت:{' '}
          {Number(
            point.speed,
          ).toLocaleString(
            'fa-IR',
            {
              maximumFractionDigits: 1,
            },
          )}{' '}
          km/h
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            History Mini Stat                               */
/* -------------------------------------------------------------------------- */

function HistoryMiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
      <div className="flex items-center gap-2 text-neutral-400">
        {icon}

        <span className="text-[11px]">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xs font-bold text-neutral-800 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Iranian Plate UI                                */
/* -------------------------------------------------------------------------- */

function IranianVehiclePlate({
  plateNumber,
  compact = false,
}: {
  plateNumber?: string | null;
  compact?: boolean;
}) {
  const plate =
    parseIranianPlate(
      plateNumber,
    );

  if (!plateNumber) {
    return (
      <span className="text-sm font-bold text-neutral-400">
        پلاک ثبت نشده
      </span>
    );
  }

  if (!plate) {
    return (
      <span
        dir="ltr"
        className="inline-flex rounded-lg border border-neutral-200 bg-white px-3 py-2 font-mono text-sm font-black tracking-wider text-neutral-800 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        {toPersianDigits(
          plateNumber,
        )}
      </span>
    );
  }

  return (
    <div
      dir="ltr"
      className={`inline-flex max-w-full overflow-hidden rounded-lg border-2 border-neutral-900 bg-white shadow-sm dark:border-neutral-300 ${
        compact
          ? 'h-9'
          : 'h-11'
      }`}
    >
      <div
        className={`flex shrink-0 flex-col items-center justify-center bg-blue-700 text-white ${
          compact
            ? 'w-8'
            : 'w-10'
        }`}
      >
        <span
          className={
            compact
              ? 'text-[5px] font-bold'
              : 'text-[6px] font-bold'
          }
        >
          I.R.
        </span>

        <span
          className={
            compact
              ? 'text-[5px] font-bold'
              : 'text-[6px] font-bold'
          }
        >
          IRAN
        </span>
      </div>

      <div
        className={`flex items-center whitespace-nowrap font-black text-neutral-950 ${
          compact
            ? 'gap-1.5 px-2 text-sm'
            : 'gap-2 px-3 text-base'
        }`}
      >
        <span>
          {toPersianDigits(
            plate.firstTwo,
          )}
        </span>

        <span>
          {plate.letter}
        </span>

        <span>
          {toPersianDigits(
            plate.middleThree,
          )}
        </span>
      </div>

      <div
        className={`flex shrink-0 flex-col items-center justify-center border-l border-neutral-400 text-neutral-950 ${
          compact
            ? 'min-w-10 px-1'
            : 'min-w-12 px-2'
        }`}
      >
        <span
          className={
            compact
              ? 'text-[6px]'
              : 'text-[7px]'
          }
        >
          ایران
        </span>

        <span
          className={
            compact
              ? 'text-xs font-black'
              : 'text-sm font-black'
          }
        >
          {toPersianDigits(
            plate.cityTwo,
          )}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Truck Icon                                    */
/* -------------------------------------------------------------------------- */

function TruckIcon() {
  return (
    <Navigation size={18} />
  );
}

/* -------------------------------------------------------------------------- */
/*                              Tracking Card                                 */
/* -------------------------------------------------------------------------- */

function TrackingCard({
  active,
  error,
}: {
  active: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <CircleDotDashed
            size={19}
          />
        </div>

        <div>
          <p className="text-sm font-bold">
            ردیابی و ارتباط زنده
          </p>

          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            موقعیت دقیق خودرو به
            سرور مرکزی ارسال می‌شود.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl p-3 text-xs font-semibold ${
          error
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
            : active
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400'
        }`}
      >
        <span
          className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
            error
              ? 'bg-rose-500'
              : active
                ? 'animate-pulse bg-emerald-500'
                : 'bg-neutral-400'
          }`}
        />

        {error ||
          (active
            ? 'ارسال لحظه‌ای GPS فعال است؛ حرکت در مسیر پایش می‌شود.'
            : 'GPS هنوز فعال نشده است.')}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Bottom Navigation                               */
/* -------------------------------------------------------------------------- */

function BottomNavigation({
  activeTab,
  onChangeTab,
}: {
  activeTab: DriverPageTab;
  onChangeTab: (
    tab: DriverPageTab,
  ) => void;
}) {
  const items = [
    {
      id: 'dispatch' as const,
      label: 'مأموریت',
      icon: (
        <Navigation
          size={20}
        />
      ),
    },

    {
      id: 'route' as const,
      label: 'نقشه',
      icon: (
        <Map size={20} />
      ),
    },

    {
      id: 'history' as const,
      label: 'سوابق',
      icon: (
        <History
          size={20}
        />
      ),
    },

    {
      id: 'profile' as const,
      label: 'پروفایل',
      icon: (
        <UserRound
          size={20}
        />
      ),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/95">
      <div className="mx-auto grid w-full max-w-md grid-cols-4 gap-1.5">
        {items.map(
          (item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onChangeTab(
                  item.id,
                )
              }
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition ${
                activeTab ===
                item.id
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {item.icon}

              {item.label}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Profile Sheet                                */
/* -------------------------------------------------------------------------- */

function ProfileSheet({
  isOpen,
  fullName,
  phone,
  initials,
  onClose,
  onLogout,
}: {
  isOpen: boolean;
  fullName: string;
  phone: string;
  initials: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="بستن پروفایل"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      <aside className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-[32px] border border-neutral-200 bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-base font-bold text-white">
              {initials}
            </div>

            <div>
              <p className="text-base font-bold">
                {fullName}
              </p>

              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() =>
              toast.info(
                'اطلاعات راننده از سرور دریافت شده است.',
              )
            }
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-sm font-bold text-neutral-700 dark:text-neutral-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <UserRound
                size={19}
              />
            </span>

            اطلاعات پرونده راننده
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30">
              <LogOut
                size={19}
              />
            </span>

            خروج از حساب کاربری
          </button>
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Small Stat                                  */
/* -------------------------------------------------------------------------- */

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {icon}

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-neutral-800 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Info Row                                  */
/* -------------------------------------------------------------------------- */

function InfoRow({
  icon,
  label,
  value,
  compact = false,
  iconClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
  iconClassName?: string;
}) {
  return (
    <div
      className={`flex gap-3 ${
        compact
          ? 'items-start'
          : 'items-center'
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact
            ? 'h-9 w-9'
            : 'h-10 w-10'
        } ${
          iconClassName ||
          'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {label}
        </p>

        <p
          className={`mt-0.5 break-words font-bold text-neutral-800 dark:text-neutral-100 ${
            compact
              ? 'text-xs'
              : 'text-sm'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}