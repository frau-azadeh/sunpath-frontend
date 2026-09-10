'use client';

declare global { interface Window { CONFIG?: { NEXT_PUBLIC_API_BASE?: string } } }

import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import type { Dispatch } from '@/types/dispatch';
import { dispatchService } from '@/services/dispatchService';

export interface RouteCoord { lat: number; lng: number; }

export interface ActiveMission {
  id: number;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  status: 'assigned' | 'in_progress' | 'completed';
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

const distanceKm = (a: RouteCoord, b: RouteCoord) => {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const toMission = (d: Dispatch | null): ActiveMission | null => {
  if (!d || d.id == null || d.vehicleId == null ||
      d.originLatitude == null || d.originLongitude == null ||
      d.destinationLatitude == null || d.destinationLongitude == null) return null;
  return {
    id: d.id,
    driverId: d.driverId,
    vehicleId: d.vehicleId,
    originName: d.originTitle || 'مبدأ مأموریت',
    originLat: Number(d.originLatitude),
    originLng: Number(d.originLongitude),
    destinationName: d.destinationTitle || 'مقصد مأموریت',
    destinationLat: Number(d.destinationLatitude),
    destinationLng: Number(d.destinationLongitude),
    status: String(d.status).toLowerCase() === '2' || String(d.status).toLowerCase() === 'started' ? 'in_progress'
      : String(d.status).toLowerCase() === '3' || String(d.status).toLowerCase() === 'completed' ? 'completed' : 'assigned',
  };
};

export function useDriverNavigation(mission: ActiveMission | null, driverId: number) {
  const [currentLocation, setCurrentLocation] = useState<RouteCoord | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoord[]>([]);
  const [isDriving, setIsDriving] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [stats, setStats] = useState<LiveTripStats>({
    currentSpeed: 0, heading: 0, totalDistanceKm: 0, durationSeconds: 0,
    stopDurationSeconds: 0, fuelConsumedLiters: 0, efficiencyScore: 100,
  });

  const watchId = useRef<number | null>(null);
  const lastPoint = useRef<RouteCoord | null>(null);
  const startedAt = useRef<number | null>(null);
  const lastTelemetryAt = useRef<number | null>(null);
  const stopSeconds = useRef(0);
  const connection = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!mission) {
      setCurrentLocation(null);
      return;
    }
    setCurrentLocation({ lat: mission.originLat, lng: mission.originLng });
    lastPoint.current = { lat: mission.originLat, lng: mission.originLng };
    setIsDriving(mission.status === 'in_progress');
  }, [mission?.id, mission?.status]);

  useEffect(() => {
    if (!mission) return;
    let cancelled = false;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${mission.originLng},${mission.originLat};${mission.destinationLng},${mission.destinationLat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('route');
        const data = await response.json();
        if (!cancelled && data.routes?.[0]?.geometry?.coordinates) {
          setRouteCoordinates(data.routes[0].geometry.coordinates.map((c: [number, number]) => ({ lat: c[1], lng: c[0] })));
        }
      } catch {
        if (!cancelled) setRouteCoordinates([
          { lat: mission.originLat, lng: mission.originLng },
          { lat: mission.destinationLat, lng: mission.destinationLng },
        ]);
      }
    };
    void fetchRoute();
    return () => { cancelled = true; };
  }, [mission?.id, mission?.originLat, mission?.originLng, mission?.destinationLat, mission?.destinationLng]);

  useEffect(() => {
    const base = typeof window !== 'undefined' ? window.CONFIG?.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') : '';
    if (!base) return;
    const hub = new signalR.HubConnectionBuilder().withUrl(`${base}/vehicleHub`).withAutomaticReconnect().build();
    connection.current = hub;
    void hub.start().catch(() => undefined);
    return () => { void hub.stop(); connection.current = null; };
  }, []);

  const sendLocation = useCallback(async (lat: number, lng: number, speed: number, heading: number, accuracy: number | null) => {
    if (!mission) return;
    const now = Date.now();
    const previous = lastPoint.current;
    let addedDistance = 0;
    if (previous) addedDistance = distanceKm(previous, { lat, lng });
    if (addedDistance > 0.005 && addedDistance < 2) {
      lastPoint.current = { lat, lng };
    }
    setCurrentLocation({ lat, lng });

    const previousTime = lastTelemetryAt.current;
    const elapsed = previousTime ? Math.max(0, (now - previousTime) / 1000) : 0;
    lastTelemetryAt.current = now;
    const effectiveSpeed = speed > 0
      ? speed
      : elapsed > 0 && addedDistance > 0.005
        ? (addedDistance / (elapsed / 3600))
        : 0;

    setStats(prev => {
      const totalDistance = prev.totalDistanceKm + (addedDistance > 0.005 && addedDistance < 2 ? addedDistance : 0);
      const stopped = effectiveSpeed < 3;
      const newStop = stopSeconds.current + (stopped ? elapsed : 0);
      stopSeconds.current = newStop;
      const duration = startedAt.current ? Math.max(0, Math.round((now - startedAt.current) / 1000)) : prev.durationSeconds;
      const fuel = (totalDistance / 100) * 8.5 + (newStop / 3600) * 1.1;
      const stopRatio = duration ? newStop / duration : 0;
      return {
        currentSpeed: Math.round(effectiveSpeed),
        heading: Math.round(heading),
        totalDistanceKm: Number(totalDistance.toFixed(2)),
        durationSeconds: duration,
        stopDurationSeconds: Math.round(newStop),
        fuelConsumedLiters: Number(fuel.toFixed(2)),
        efficiencyScore: Math.max(20, Math.min(100, Math.round(100 - stopRatio * 40))),
      };
    });

    try {
      await dispatchService.updateVehicleLocation({
        vehicleId: mission.vehicleId,
        driverId: driverId,
        missionId: mission.id,
        latitude: lat,
        longitude: lng,
        accuracy,
        speed: effectiveSpeed,
        heading,
        recordedAtUtc: new Date(now).toISOString(),
      });
    } catch (error) {
      console.warn('GPS telemetry API error', error);
    }
  }, [driverId, mission]);

  useEffect(() => {
    if (!isDriving || !mission) return;
    if (!navigator.geolocation) {
      setGpsError('مرورگر شما GPS را پشتیبانی نمی‌کند.');
      setIsDriving(false);
      return;
    }

    setGpsError(null);
    startedAt.current = Date.now();
    lastTelemetryAt.current = Date.now();

    const success = (position: GeolocationPosition) => {
      const speed = position.coords.speed != null && position.coords.speed >= 0
        ? position.coords.speed * 3.6 : 0;
      const heading = position.coords.heading != null && position.coords.heading >= 0
        ? position.coords.heading : stats.heading;
      void sendLocation(position.coords.latitude, position.coords.longitude, speed, heading, position.coords.accuracy ?? null);
    };

    const error = (e: GeolocationPositionError) => {
      setGpsError(e.code === 1 ? 'دسترسی به موقعیت مکانی رد شده است.' : 'دریافت موقعیت GPS ناموفق بود.');
    };

    watchId.current = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000,
    });

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [isDriving, mission?.id, sendLocation]);

  const startTracking = useCallback(() => {
    stopSeconds.current = 0;
    startedAt.current = Date.now();
    lastTelemetryAt.current = Date.now();
    setIsDriving(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsDriving(false);
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setStats(prev => ({ ...prev, currentSpeed: 0 }));
  }, []);

  return { currentLocation, routeCoordinates, stats, isDriving, setIsDriving, startTracking, stopTracking, gpsError };
}