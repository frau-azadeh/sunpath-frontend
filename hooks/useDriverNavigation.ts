'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { dispatchService } from '@/services/dispatchService';

import type { Dispatch } from '@/types/dispatch';

export interface RouteCoord {
  lat: number;
  lng: number;
}

export interface ActiveMission {
  id: number;

  originName: string;
  originLat: number;
  originLng: number;

  destinationName: string;
  destinationLat: number;
  destinationLng: number;

  status:
    | 'assigned'
    | 'in_progress'
    | 'completed';

  vehicleId: number;

  driverId: number | null;
}

export interface LiveTripStats {
  currentSpeed: number;

  heading: number;

  totalDistanceKm: number;

  durationSeconds: number;

  stopDurationSeconds: number;

  fuelConsumedLiters: number;

  efficiencyScore: number;
}

const MIN_MOVEMENT_KM = 0.005;
const MAX_MOVEMENT_KM = 2;

const DEFAULT_FUEL_PER_100KM = 8.5;
const IDLE_FUEL_PER_HOUR = 1.1;

const isValidCoordinate = (
  lat: number,
  lng: number,
): boolean => {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const distanceKm = (
  a: RouteCoord,
  b: RouteCoord,
): number => {
  const radius = 6371;

  const dLat =
    ((b.lat - a.lat) * Math.PI) /
    180;

  const dLon =
    ((b.lng - a.lng) * Math.PI) /
    180;

  const lat1 =
    (a.lat * Math.PI) / 180;

  const lat2 =
    (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return (
    radius *
    2 *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x),
    )
  );
};

export const toMission = (
  dispatch: Dispatch | null,
): ActiveMission | null => {
  if (!dispatch) {
    return null;
  }

  if (
    dispatch.id == null ||
    dispatch.vehicleId == null ||
    dispatch.originLatitude == null ||
    dispatch.originLongitude == null ||
    dispatch.destinationLatitude == null ||
    dispatch.destinationLongitude == null
  ) {
    return null;
  }

  const originLat = Number(
    dispatch.originLatitude,
  );

  const originLng = Number(
    dispatch.originLongitude,
  );

  const destinationLat = Number(
    dispatch.destinationLatitude,
  );

  const destinationLng = Number(
    dispatch.destinationLongitude,
  );

  if (
    !isValidCoordinate(
      originLat,
      originLng,
    ) ||
    !isValidCoordinate(
      destinationLat,
      destinationLng,
    )
  ) {
    return null;
  }

  const rawStatus = String(
    dispatch.status ?? '',
  ).toLowerCase();

  let status: ActiveMission['status'] =
    'assigned';

  if (
    rawStatus === '2' ||
    rawStatus === 'started' ||
    rawStatus === 'in_progress' ||
    rawStatus === 'inprogress'
  ) {
    status = 'in_progress';
  } else if (
    rawStatus === '3' ||
    rawStatus === 'completed' ||
    rawStatus === 'done'
  ) {
    status = 'completed';
  }

  return {
    id: Number(dispatch.id),

    vehicleId: Number(
      dispatch.vehicleId,
    ),

    driverId:
      dispatch.driverId != null
        ? Number(dispatch.driverId)
        : null,

    originName:
      dispatch.originTitle ||
      'مبدأ مأموریت',

    originLat,
    originLng,

    destinationName:
      dispatch.destinationTitle ||
      'مقصد مأموریت',

    destinationLat,
    destinationLng,

    status,
  };
};

export function useDriverNavigation(
  mission: ActiveMission | null,
  driverId: number,
) {
  const [
    currentLocation,
    setCurrentLocation,
  ] = useState<RouteCoord | null>(
    null,
  );

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState<RouteCoord[]>([]);

  const [
    isDriving,
    setIsDriving,
  ] = useState(false);

  const [
    gpsError,
    setGpsError,
  ] = useState<string | null>(
    null,
  );

  const [
    stats,
    setStats,
  ] = useState<LiveTripStats>({
    currentSpeed: 0,
    heading: 0,
    totalDistanceKm: 0,
    durationSeconds: 0,
    stopDurationSeconds: 0,
    fuelConsumedLiters: 0,
    efficiencyScore: 100,
  });

  const watchId =
    useRef<number | null>(null);

  /*
   * فقط آخرین نقطه واقعی GPS.
   *
   * مبدأ مأموریت نباید baseline محاسبه
   * مسافت واقعی باشد.
   */
  const lastPoint =
    useRef<RouteCoord | null>(
      null,
    );

  const startedAt =
    useRef<number | null>(null);

  const lastTelemetryAt =
    useRef<number | null>(null);

  const stopSeconds =
    useRef(0);

  const lastHeading =
    useRef(0);

  const sendingRef =
    useRef(false);

  const pendingLocationRef =
    useRef<{
      lat: number;
      lng: number;
      speed: number;
      heading: number;
      accuracy: number | null;
    } | null>(null);

  /*
   * Reset هنگام تغییر مأموریت.
   */
  useEffect(() => {
    if (!mission) {
      setCurrentLocation(null);
      setRouteCoordinates([]);
      setIsDriving(false);

      lastPoint.current = null;
      startedAt.current = null;
      lastTelemetryAt.current = null;
      stopSeconds.current = 0;
      lastHeading.current = 0;

      setStats({
        currentSpeed: 0,
        heading: 0,
        totalDistanceKm: 0,
        durationSeconds: 0,
        stopDurationSeconds: 0,
        fuelConsumedLiters: 0,
        efficiencyScore: 100,
      });

      return;
    }

    /*
     * برای نمایش اولیه، نقشه را روی مبدأ می‌بریم.
     * ولی lastPoint همچنان null می‌ماند.
     */
    setCurrentLocation({
      lat: mission.originLat,
      lng: mission.originLng,
    });

    lastPoint.current = null;
    lastHeading.current = 0;
    stopSeconds.current = 0;
    startedAt.current = null;
    lastTelemetryAt.current = null;

    setStats({
      currentSpeed: 0,
      heading: 0,
      totalDistanceKm: 0,
      durationSeconds: 0,
      stopDurationSeconds: 0,
      fuelConsumedLiters: 0,
      efficiencyScore: 100,
    });

    setIsDriving(
      mission.status ===
        'in_progress',
    );
  }, [
    mission?.id,
    mission?.originLat,
    mission?.originLng,
  ]);

  /*
   * هماهنگ‌سازی وضعیت مأموریت با tracking.
   */
  useEffect(() => {
    if (!mission) {
      return;
    }

    if (
      mission.status ===
      'in_progress'
    ) {
      setIsDriving(true);
    }

    if (
      mission.status ===
      'completed'
    ) {
      setIsDriving(false);
    }
  }, [
    mission?.id,
    mission?.status,
  ]);

  /*
   * دریافت مسیر برنامه‌ریزی‌شده از OSRM.
   */
  useEffect(() => {
    if (!mission) {
      setRouteCoordinates([]);
      return;
    }

    let cancelled = false;

    const fetchRoute =
      async (): Promise<void> => {
        try {
          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${mission.originLng},${mission.originLat};` +
            `${mission.destinationLng},${mission.destinationLat}` +
            `?overview=full&geometries=geojson`;

          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error(
              `OSRM ${response.status}`,
            );
          }

          const data =
            await response.json();

          const coordinates =
            data?.routes?.[0]
              ?.geometry
              ?.coordinates;

          if (cancelled) {
            return;
          }

          if (
            Array.isArray(
              coordinates,
            ) &&
            coordinates.length > 0
          ) {
            const route: RouteCoord[] =
              coordinates
                .map(
                  (
                    coordinate: [
                      number,
                      number,
                    ],
                  ) => ({
                    lat: Number(
                      coordinate[1],
                    ),

                    lng: Number(
                      coordinate[0],
                    ),
                  }),
                )
                .filter(
                  (
                    point: RouteCoord,
                  ) =>
                    isValidCoordinate(
                      point.lat,
                      point.lng,
                    ),
                );

            if (
              route.length > 0
            ) {
              setRouteCoordinates(
                route,
              );

              return;
            }
          }

          throw new Error(
            'No route returned',
          );
        } catch (error) {
          console.warn(
            'Route service error:',
            error,
          );

          if (cancelled) {
            return;
          }

          /*
           * اگر OSRM در دسترس نبود،
           * حداقل خط مستقیم مبدأ تا مقصد.
           */
          setRouteCoordinates([
            {
              lat:
                mission.originLat,

              lng:
                mission.originLng,
            },

            {
              lat:
                mission.destinationLat,

              lng:
                mission.destinationLng,
            },
          ]);
        }
      };

    void fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [
    mission?.id,
    mission?.originLat,
    mission?.originLng,
    mission?.destinationLat,
    mission?.destinationLng,
  ]);

  const sendLocation =
    useCallback(
      async (
        lat: number,
        lng: number,
        speed: number,
        heading: number,
        accuracy: number | null,
      ): Promise<void> => {
        if (!mission) {
          return;
        }

        if (
          !isValidCoordinate(
            lat,
            lng,
          )
        ) {
          console.warn(
            'Invalid GPS coordinate:',
            {
              lat,
              lng,
            },
          );

          return;
        }

        setCurrentLocation({
          lat,
          lng,
        });

        /*
         * اگر درخواست قبلی هنوز در حال ارسال است،
         * فقط جدیدترین نقطه را نگه می‌داریم.
         */
        if (
          sendingRef.current
        ) {
          pendingLocationRef.current =
            {
              lat,
              lng,
              speed,
              heading,
              accuracy,
            };

          return;
        }

        sendingRef.current = true;

        try {
          const now = Date.now();

          const currentPoint: RouteCoord =
            {
              lat,
              lng,
            };

          const previous =
            lastPoint.current;

          let addedDistance = 0;

          /*
           * GPS اول فقط baseline است.
           */
          if (previous) {
            addedDistance =
              distanceKm(
                previous,
                currentPoint,
              );
          }

          const validMovement =
            previous !== null &&
            addedDistance >=
              MIN_MOVEMENT_KM &&
            addedDistance <=
              MAX_MOVEMENT_KM;

          /*
           * حتی اگر نقطه نسبت به قبلی پرش بزرگی داشت،
           * آن را baseline بعدی می‌کنیم تا سیستم روی
           * نقطه قدیمی گیر نکند.
           */
          lastPoint.current =
            currentPoint;

          const previousTime =
            lastTelemetryAt.current;

          const elapsed =
            previousTime
              ? Math.max(
                  0,
                  Math.min(
                    120,
                    (now -
                      previousTime) /
                      1000,
                  ),
                )
              : 0;

          lastTelemetryAt.current =
            now;

          let effectiveSpeed =
            Number.isFinite(
              speed,
            ) &&
            speed >= 0
              ? speed
              : 0;

          /*
           * اگر مرورگر speed نداد ولی حرکت واقعی داشتیم،
           * سرعت را از فاصله و زمان تخمین می‌زنیم.
           */
          if (
            effectiveSpeed <= 0 &&
            elapsed > 0 &&
            validMovement
          ) {
            effectiveSpeed =
              addedDistance /
              (elapsed / 3600);
          }

          let effectiveHeading =
            Number.isFinite(
              heading,
            ) &&
            heading >= 0
              ? heading
              : lastHeading.current;

          effectiveHeading =
            ((effectiveHeading %
              360) +
              360) %
            360;

          lastHeading.current =
            effectiveHeading;

          setStats(
            (previousStats) => {
              const totalDistance =
                previousStats.totalDistanceKm +
                (validMovement
                  ? addedDistance
                  : 0);

              const stopped =
                effectiveSpeed < 3;

              const newStop =
                stopSeconds.current +
                (stopped
                  ? elapsed
                  : 0);

              stopSeconds.current =
                newStop;

              const duration =
                startedAt.current
                  ? Math.max(
                      0,
                      Math.round(
                        (now -
                          startedAt.current) /
                          1000,
                      ),
                    )
                  : previousStats.durationSeconds;

              const fuel =
                (totalDistance /
                  100) *
                  DEFAULT_FUEL_PER_100KM +
                (newStop / 3600) *
                  IDLE_FUEL_PER_HOUR;

              const stopRatio =
                duration > 0
                  ? newStop /
                    duration
                  : 0;

              const efficiency =
                Math.max(
                  20,
                  Math.min(
                    100,
                    Math.round(
                      100 -
                        stopRatio *
                          40,
                    ),
                  ),
                );

              return {
                currentSpeed:
                  Math.round(
                    effectiveSpeed,
                  ),

                heading:
                  Math.round(
                    effectiveHeading,
                  ),

                totalDistanceKm:
                  Number(
                    totalDistance.toFixed(
                      2,
                    ),
                  ),

                durationSeconds:
                  duration,

                stopDurationSeconds:
                  Math.round(
                    newStop,
                  ),

                fuelConsumedLiters:
                  Number(
                    fuel.toFixed(
                      2,
                    ),
                  ),

                efficiencyScore:
                  efficiency,
              };
            },
          );

          /*
           * این اطلاعات دقیقاً برای ذخیره History
           * راننده/مأموریت به Backend ارسال می‌شود.
           */
          await dispatchService.updateVehicleLocation(
            {
              vehicleId:
                mission.vehicleId,

              driverId,

              missionId:
                mission.id,

              latitude: lat,

              longitude: lng,

              accuracy,

              speed:
                effectiveSpeed,

              heading:
                effectiveHeading,

              recordedAtUtc:
                new Date(
                  now,
                ).toISOString(),
            },
          );

          setGpsError(null);
        } catch (error) {
          console.warn(
            'GPS telemetry API error:',
            error,
          );

          setGpsError(
            'موقعیت دریافت شد اما ارسال آن به سرور ناموفق بود.',
          );
        } finally {
          sendingRef.current =
            false;

          const pending =
            pendingLocationRef.current;

          pendingLocationRef.current =
            null;

          if (pending) {
            void sendLocation(
              pending.lat,
              pending.lng,
              pending.speed,
              pending.heading,
              pending.accuracy,
            );
          }
        }
      },
      [
        driverId,
        mission,
      ],
    );

  /*
   * GPS Watch.
   */
  useEffect(() => {
    if (
      !isDriving ||
      !mission
    ) {
      return;
    }

    if (
      typeof navigator ===
        'undefined' ||
      !navigator.geolocation
    ) {
      setGpsError(
        'مرورگر شما GPS را پشتیبانی نمی‌کند.',
      );

      setIsDriving(false);

      return;
    }

    setGpsError(null);

    if (!startedAt.current) {
      startedAt.current =
        Date.now();
    }

    lastTelemetryAt.current =
      null;

    const success = (
      position: GeolocationPosition,
    ) => {
      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      if (
        !isValidCoordinate(
          lat,
          lng,
        )
      ) {
        return;
      }

      /*
       * Geolocation API سرعت را m/s می‌دهد.
       * Backend ما km/h انتظار دارد.
       */
      const speed =
        position.coords.speed !=
          null &&
        position.coords.speed >= 0
          ? position.coords.speed *
            3.6
          : 0;

      const heading =
        position.coords.heading !=
          null &&
        position.coords.heading >=
          0
          ? position.coords.heading
          : lastHeading.current;

      const accuracy =
        position.coords.accuracy !=
        null
          ? position.coords.accuracy
          : null;

      void sendLocation(
        lat,
        lng,
        speed,
        heading,
        accuracy,
      );
    };

    const error = (
      gpsPositionError: GeolocationPositionError,
    ) => {
      switch (
        gpsPositionError.code
      ) {
        case 1:
          setGpsError(
            'دسترسی به موقعیت مکانی رد شده است.',
          );
          break;

        case 2:
          setGpsError(
            'موقعیت GPS در دسترس نیست.',
          );
          break;

        case 3:
          setGpsError(
            'دریافت موقعیت GPS بیش از حد طول کشید.',
          );
          break;

        default:
          setGpsError(
            'دریافت موقعیت GPS ناموفق بود.',
          );
      }
    };

    watchId.current =
      navigator.geolocation.watchPosition(
        success,
        error,
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 15000,
        },
      );

    return () => {
      if (
        watchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current,
        );
      }

      watchId.current = null;
    };
  }, [
    isDriving,
    mission?.id,
    sendLocation,
  ]);

  const startTracking =
    useCallback(() => {
      if (!mission) {
        setGpsError(
          'مأموریتی برای شروع وجود ندارد.',
        );

        return;
      }

      stopSeconds.current = 0;

      startedAt.current =
        Date.now();

      /*
       * اولین GPS baseline است.
       */
      lastPoint.current = null;

      lastTelemetryAt.current =
        null;

      pendingLocationRef.current =
        null;

      setGpsError(null);

      setStats({
        currentSpeed: 0,
        heading: 0,
        totalDistanceKm: 0,
        durationSeconds: 0,
        stopDurationSeconds: 0,
        fuelConsumedLiters: 0,
        efficiencyScore: 100,
      });

      setIsDriving(true);
    }, [mission]);

  const stopTracking =
    useCallback(() => {
      setIsDriving(false);

      if (
        typeof navigator !==
          'undefined' &&
        watchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current,
        );
      }

      watchId.current = null;

      lastTelemetryAt.current =
        null;

      pendingLocationRef.current =
        null;

      setStats(
        (previous) => ({
          ...previous,
          currentSpeed: 0,
        }),
      );
    }, []);

  return {
    currentLocation,
    routeCoordinates,
    stats,
    isDriving,
    setIsDriving,
    startTracking,
    stopTracking,
    gpsError,
  };
}