'use client';

declare global {
  interface Window {
    CONFIG?: {
      NEXT_PUBLIC_API_BASE?: string;
    };
  }
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { Dispatch } from '@/types/dispatch';
import { dispatchService } from '@/services/dispatchService';

/* =========================================================
   Types
========================================================= */

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

/* =========================================================
   Constants
========================================================= */

const MIN_MOVEMENT_KM = 0.005; // حدود 5 متر
const MAX_MOVEMENT_KM = 2;

const DEFAULT_FUEL_PER_100KM = 8.5;
const IDLE_FUEL_PER_HOUR = 1.1;

/* =========================================================
   Helpers
========================================================= */

const isValidCoordinate = (
  lat: number,
  lng: number
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

/**
 * فاصله دو نقطه GPS با فرمول Haversine
 */
const distanceKm = (
  a: RouteCoord,
  b: RouteCoord
): number => {
  const R = 6371;

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
    R *
    2 *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x)
    )
  );
};

/**
 * Dispatch -> ActiveMission
 */
export const toMission = (
  d: Dispatch | null
): ActiveMission | null => {
  if (!d) {
    return null;
  }

  if (
    d.id == null ||
    d.vehicleId == null ||
    d.originLatitude == null ||
    d.originLongitude == null ||
    d.destinationLatitude == null ||
    d.destinationLongitude == null
  ) {
    return null;
  }

  const originLat = Number(
    d.originLatitude
  );

  const originLng = Number(
    d.originLongitude
  );

  const destinationLat = Number(
    d.destinationLatitude
  );

  const destinationLng = Number(
    d.destinationLongitude
  );

  if (
    !isValidCoordinate(
      originLat,
      originLng
    ) ||
    !isValidCoordinate(
      destinationLat,
      destinationLng
    )
  ) {
    return null;
  }

  const rawStatus = String(
    d.status ?? ''
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
    id: Number(d.id),

    vehicleId: Number(
      d.vehicleId
    ),

    driverId:
      d.driverId != null
        ? Number(d.driverId)
        : null,

    originName:
      d.originTitle ||
      'مبدأ مأموریت',

    originLat,
    originLng,

    destinationName:
      d.destinationTitle ||
      'مقصد مأموریت',

    destinationLat,
    destinationLng,

    status,
  };
};

/* =========================================================
   Hook
========================================================= */

export function useDriverNavigation(
  mission: ActiveMission | null,
  driverId: number
) {
  /* ---------------------------------------------------------
     State
  --------------------------------------------------------- */

  const [
    currentLocation,
    setCurrentLocation,
  ] =
    useState<RouteCoord | null>(
      null
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
  ] =
    useState<string | null>(
      null
    );

  const [
    stats,
    setStats,
  ] =
    useState<LiveTripStats>({
      currentSpeed: 0,
      heading: 0,

      totalDistanceKm: 0,

      durationSeconds: 0,
      stopDurationSeconds: 0,

      fuelConsumedLiters: 0,

      efficiencyScore: 100,
    });

  /* ---------------------------------------------------------
     Refs
  --------------------------------------------------------- */

  const watchId =
    useRef<number | null>(
      null
    );

  const lastPoint =
    useRef<RouteCoord | null>(
      null
    );

  const startedAt =
    useRef<number | null>(
      null
    );

  const lastTelemetryAt =
    useRef<number | null>(
      null
    );

  const stopSeconds =
    useRef(0);

  const lastHeading =
    useRef(0);

  /*
   * برای جلوگیری از ارسال همزمان چند درخواست GPS
   */
  const sendingRef =
    useRef(false);

  /*
   * آخرین GPS دریافت‌شده.
   * اگر هنگام ارسال قبلی GPS جدید برسد،
   * بعد از پایان درخواست ارسال خواهد شد.
   */
  const pendingLocationRef =
    useRef<{
      lat: number;
      lng: number;
      speed: number;
      heading: number;
      accuracy: number | null;
    } | null>(null);

  /* =========================================================
     Reset when mission changes
  ========================================================= */

  useEffect(() => {
    if (!mission) {
      setCurrentLocation(
        null
      );

      setRouteCoordinates(
        []
      );

      setIsDriving(false);

      lastPoint.current =
        null;

      return;
    }

    const origin = {
      lat: mission.originLat,
      lng: mission.originLng,
    };

    setCurrentLocation(
      origin
    );

    lastPoint.current =
      origin;

    lastHeading.current =
      0;

    stopSeconds.current =
      0;

    startedAt.current =
      null;

    lastTelemetryAt.current =
      null;

    setStats({
      currentSpeed: 0,
      heading: 0,

      totalDistanceKm: 0,

      durationSeconds: 0,
      stopDurationSeconds: 0,

      fuelConsumedLiters: 0,

      efficiencyScore: 100,
    });

    /*
     * اگر مأموریت قبلاً Started شده باشد،
     * GPS Tracking را فعال کن.
     */
    setIsDriving(
      mission.status ===
        'in_progress'
    );
  }, [mission?.id]);

  /*
   * اگر status همان مأموریت تغییر کرد
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

  /* =========================================================
     Get road route from OSRM

     این مسیر فقط برای نمایش مسیر برنامه‌ریزی‌شده است.
     GPS واقعی خودرو جداگانه به Backend ارسال می‌شود.
  ========================================================= */

  useEffect(() => {
    if (!mission) {
      setRouteCoordinates(
        []
      );

      return;
    }

    let cancelled = false;

    const fetchRoute =
      async () => {
        try {
          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${mission.originLng},${mission.originLat};` +
            `${mission.destinationLng},${mission.destinationLat}` +
            `?overview=full&geometries=geojson`;

          const response =
            await fetch(url);

          if (
            !response.ok
          ) {
            throw new Error(
              `OSRM ${response.status}`
            );
          }

          const data =
            await response.json();

          const coordinates =
            data?.routes?.[0]
              ?.geometry
              ?.coordinates;

          if (
            cancelled
          ) {
            return;
          }

          if (
            Array.isArray(
              coordinates
            ) &&
            coordinates.length >
              0
          ) {
            const route: RouteCoord[] =
              coordinates
                .map(
                  (
                    c: [
                      number,
                      number
                    ]
                  ) => ({
                    lat: Number(
                      c[1]
                    ),

                    lng: Number(
                      c[0]
                    ),
                  })
                )
                .filter(
                  (
                    p: RouteCoord
                  ) =>
                    isValidCoordinate(
                      p.lat,
                      p.lng
                    )
                );

            setRouteCoordinates(
              route
            );

            return;
          }

          throw new Error(
            'No route returned'
          );
        } catch (
          error
        ) {
          console.warn(
            'Route service error:',
            error
          );

          if (
            cancelled
          ) {
            return;
          }

          /*
           * fallback:
           * خط مستقیم مبدأ -> مقصد
           */
          setRouteCoordinates(
            [
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
            ]
          );
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

  /* =========================================================
     Send GPS to Backend
  ========================================================= */

  const sendLocation =
    useCallback(
      async (
        lat: number,
        lng: number,
        speed: number,
        heading: number,
        accuracy: number | null
      ) => {
        if (!mission) {
          return;
        }

        if (
          !isValidCoordinate(
            lat,
            lng
          )
        ) {
          console.warn(
            'Invalid GPS coordinate:',
            {
              lat,
              lng,
            }
          );

          return;
        }

        /*
         * UI خودرو راننده فوراً
         * آپدیت شود.
         */
        setCurrentLocation({
          lat,
          lng,
        });

        /*
         * اگر درخواست قبلی هنوز
         * در حال ارسال است،
         * جدیدترین GPS را نگه می‌داریم.
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

        sendingRef.current =
          true;

        try {
          const now =
            Date.now();

          const currentPoint: RouteCoord =
            {
              lat,
              lng,
            };

          const previous =
            lastPoint.current;

          let addedDistance =
            0;

          if (
            previous
          ) {
            addedDistance =
              distanceKm(
                previous,
                currentPoint
              );
          }

          /*
           * نویز GPS را وارد مسافت نکن.
           */
          const validMovement =
            addedDistance >=
              MIN_MOVEMENT_KM &&
            addedDistance <
              MAX_MOVEMENT_KM;

          if (
            validMovement
          ) {
            lastPoint.current =
              currentPoint;
          } else if (
            !previous
          ) {
            lastPoint.current =
              currentPoint;
          }

          const previousTime =
            lastTelemetryAt.current;

          const elapsed =
            previousTime
              ? Math.max(
                  0,
                  (now -
                    previousTime) /
                    1000
                )
              : 0;

          lastTelemetryAt.current =
            now;

          /*
           * اگر browser سرعت GPS داد
           * از همان استفاده می‌کنیم.
           *
           * در غیر این صورت از فاصله /
           * زمان محاسبه می‌شود.
           */
          let effectiveSpeed =
            Number.isFinite(
              speed
            ) &&
            speed >= 0
              ? speed
              : 0;

          if (
            effectiveSpeed <=
              0 &&
            elapsed > 0 &&
            validMovement
          ) {
            effectiveSpeed =
              addedDistance /
              (elapsed /
                3600);
          }

          /*
           * heading
           */
          let effectiveHeading =
            Number.isFinite(
              heading
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

          /* -----------------------------------------
             Statistics
          ----------------------------------------- */

          setStats(
            (prev) => {
              const totalDistance =
                prev.totalDistanceKm +
                (validMovement
                  ? addedDistance
                  : 0);

              const stopped =
                effectiveSpeed <
                3;

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
                          1000
                      )
                    )
                  : prev.durationSeconds;

              const fuel =
                (totalDistance /
                  100) *
                  DEFAULT_FUEL_PER_100KM +
                (newStop /
                  3600) *
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
                          40
                    )
                  )
                );

              return {
                currentSpeed:
                  Math.round(
                    effectiveSpeed
                  ),

                heading:
                  Math.round(
                    effectiveHeading
                  ),

                totalDistanceKm:
                  Number(
                    totalDistance.toFixed(
                      2
                    )
                  ),

                durationSeconds:
                  duration,

                stopDurationSeconds:
                  Math.round(
                    newStop
                  ),

                fuelConsumedLiters:
                  Number(
                    fuel.toFixed(
                      2
                    )
                  ),

                efficiencyScore:
                  efficiency,
              };
            }
          );

          /* -----------------------------------------
             Send GPS to backend

             Backend باید بعد از دریافت این درخواست
             VehicleLocationUpdated را از SignalR
             broadcast کند.
          ----------------------------------------- */

          await dispatchService.updateVehicleLocation(
            {
              vehicleId:
                mission.vehicleId,

              driverId,

              missionId:
                mission.id,

              latitude:
                lat,

              longitude:
                lng,

              accuracy,

              speed:
                effectiveSpeed,

              heading:
                effectiveHeading,

              recordedAtUtc:
                new Date(
                  now
                ).toISOString(),
            }
          );

          setGpsError(
            null
          );
        } catch (
          error
        ) {
          console.warn(
            'GPS telemetry API error:',
            error
          );

          /*
           * GPS خود مرورگر ممکن است سالم باشد،
           * ولی API ارسال telemetry خطا داده باشد.
           */
          setGpsError(
            'موقعیت دریافت شد اما ارسال آن به سرور ناموفق بود.'
          );
        } finally {
          sendingRef.current =
            false;

          /*
           * اگر هنگام ارسال،
           * GPS جدید رسیده بود،
           * جدیدترین نقطه را ارسال کن.
           */
          const pending =
            pendingLocationRef.current;

          pendingLocationRef.current =
            null;

          if (
            pending
          ) {
            void sendLocation(
              pending.lat,
              pending.lng,
              pending.speed,
              pending.heading,
              pending.accuracy
            );
          }
        }
      },
      [
        driverId,
        mission,
      ]
    );

  /* =========================================================
     Browser GPS Watch
  ========================================================= */

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
        'مرورگر شما GPS را پشتیبانی نمی‌کند.'
      );

      setIsDriving(
        false
      );

      return;
    }

    setGpsError(
      null
    );

    if (
      !startedAt.current
    ) {
      startedAt.current =
        Date.now();
    }

    lastTelemetryAt.current =
      Date.now();

    /* -----------------------------------------
       GPS Success
    ----------------------------------------- */

    const success = (
      position: GeolocationPosition
    ) => {
      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      if (
        !isValidCoordinate(
          lat,
          lng
        )
      ) {
        return;
      }

      /*
       * coords.speed = meter / second
       * تبدیل به km/h
       */
      const speed =
        position.coords
          .speed != null &&
        position.coords
          .speed >= 0
          ? position.coords
              .speed * 3.6
          : 0;

      const heading =
        position.coords
          .heading != null &&
        position.coords
          .heading >= 0
          ? position.coords
              .heading
          : lastHeading.current;

      const accuracy =
        position.coords
          .accuracy != null
          ? position.coords
              .accuracy
          : null;

      void sendLocation(
        lat,
        lng,
        speed,
        heading,
        accuracy
      );
    };

    /* -----------------------------------------
       GPS Error
    ----------------------------------------- */

    const error = (
      e: GeolocationPositionError
    ) => {
      switch (
        e.code
      ) {
        case 1:
          setGpsError(
            'دسترسی به موقعیت مکانی رد شده است.'
          );
          break;

        case 2:
          setGpsError(
            'موقعیت GPS در دسترس نیست.'
          );
          break;

        case 3:
          setGpsError(
            'دریافت موقعیت GPS بیش از حد طول کشید.'
          );
          break;

        default:
          setGpsError(
            'دریافت موقعیت GPS ناموفق بود.'
          );
      }
    };

    /* -----------------------------------------
       Start GPS
    ----------------------------------------- */

    watchId.current =
      navigator.geolocation.watchPosition(
        success,
        error,
        {
          enableHighAccuracy:
            true,

          maximumAge: 2000,

          timeout: 15000,
        }
      );

    /* -----------------------------------------
       Cleanup
    ----------------------------------------- */

    return () => {
      if (
        watchId.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current
        );
      }

      watchId.current =
        null;
    };
  }, [
    isDriving,
    mission?.id,
    sendLocation,
  ]);

  /* =========================================================
     Start tracking
  ========================================================= */

  const startTracking =
    useCallback(() => {
      if (!mission) {
        setGpsError(
          'مأموریتی برای شروع وجود ندارد.'
        );

        return;
      }

      stopSeconds.current =
        0;

      startedAt.current =
        Date.now();

      lastTelemetryAt.current =
        Date.now();

      /*
       * مبدأ نقطه اولیه مسیر است.
       */
      lastPoint.current =
        {
          lat:
            mission.originLat,

          lng:
            mission.originLng,
        };

      setGpsError(
        null
      );

      setIsDriving(
        true
      );
    }, [mission]);

  /* =========================================================
     Stop tracking
  ========================================================= */

  const stopTracking =
    useCallback(() => {
      setIsDriving(
        false
      );

      if (
        watchId.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current
        );
      }

      watchId.current =
        null;

      lastTelemetryAt.current =
        null;

      setStats(
        (prev) => ({
          ...prev,
          currentSpeed: 0,
        })
      );
    }, []);

  /* =========================================================
     Return
  ========================================================= */

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