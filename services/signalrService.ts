// src/services/signalrService.ts
import * as signalR from '@microsoft/signalr';

import { useVehicleStore } from '@/store/useVehicleStore';
import type { Vehicle } from '@/types/fleet';

export type VehiclePayload = {
  id?: number | string;
  vehicleId?: number | string;
  plateNumber?: string | null;
  status?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  lon?: number | string | null;
  lastLatitude?: number | string | null;
  lastLongitude?: number | string | null;
  speed?: number | string | null;
  heading?: number | string | null;
  lastUpdate?: string | null;
  originLat?: number | string | null;
  originLng?: number | string | null;
  destinationLat?: number | string | null;
  destinationLng?: number | string | null;
  originAddress?: string | null;
  destinationAddress?: string | null;
  activeDispatchId?: number | null;
  activeDispatchDriverId?: number | null;
  dispatchStatus?: string | null;
  fuelConsumedLiters?: number | null;
  tripDistanceKm?: number | null;
  tripDurationSeconds?: number | null;
  stopDurationSeconds?: number | null;
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private configRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly eventPositionChanged = 'VehiclePositionChanged';
  private readonly eventCreated = 'VehicleCreated';
  private readonly eventUpdated = 'VehicleUpdated';
  private readonly eventDeleted = 'VehicleDeleted';

  private getHubUrl(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const apiBaseUrl = (window as any).CONFIG?.NEXT_PUBLIC_API_BASE?.trim();

    if (!apiBaseUrl) {
      return null;
    }

    return `${apiBaseUrl.replace(/\/+$/, '')}/vehicleHub`;
  }

  public startConnection(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    if (this.startPromise) {
      return;
    }

    if (this.connection) {
      const state = this.connection.state;

      if (
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        return;
      }

      this.connection = null;
    }

    const hubUrl = this.getHubUrl();

    if (!hubUrl) {
      if (!this.configRetryTimer) {
        console.log(
          '[SignalR] Waiting for window.CONFIG.NEXT_PUBLIC_API_BASE...',
        );
        this.configRetryTimer = setTimeout(() => {
          this.configRetryTimer = null;
          this.startConnection();
        }, 300);
      }
      return;
    }

    console.log('[SignalR] Starting connection:', hubUrl);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents |
          signalR.HttpTransportType.LongPolling,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection = connection;
    this.registerHandlers(connection);

    this.startPromise = connection
      .start()
      .then(async () => {
        console.log('[SignalR] Connected successfully:', hubUrl);
        try {
          await connection.invoke('SubscribeLiveMap');
        } catch (error) {
          console.warn('[SignalR] Could not subscribe live-map group:', error);
        }
      })
      .catch((error: unknown) => {
        console.error('[SignalR] Connection start failed:', error);

        if (this.connection === connection) {
          this.connection = null;
        }
      })
      .finally(() => {
        this.startPromise = null;
      });
  }

  private registerHandlers(connection: signalR.HubConnection): void {
    const handleVehicleUpsert = (eventName: string, data: VehiclePayload) => {
      console.log(`[SignalR] ${eventName} received:`, data);

      const resolvedId = data.id ?? data.vehicleId;
      if (resolvedId === undefined || resolvedId === null || resolvedId === '') {
        console.warn(`[SignalR] Ignored ${eventName} due to missing id:`, data);
        return;
      }

      const resolvedLat = Number(data.latitude ?? data.lat ?? data.lastLatitude ?? 0);
      const resolvedLng = Number(data.longitude ?? data.lng ?? data.lon ?? data.lastLongitude ?? 0);

      // ارسال مطمئن با تایپ تضمین‌شده id (حل خطای ts 2345)
      useVehicleStore.getState().upsertVehicleRealtime({
        ...data,
        id: resolvedId,
        latitude: resolvedLat,
        longitude: resolvedLng,
        lastLatitude: resolvedLat,
        lastLongitude: resolvedLng,
        speed: Number(data.speed ?? 0),
        heading: Number(data.heading ?? 0),
      } as Partial<Vehicle> & { id: number | string });
    };

    // ۱. ایونت تغییر موقعیت لحظه‌ای
    connection.on(this.eventPositionChanged, (data: VehiclePayload) => {
      handleVehicleUpsert(this.eventPositionChanged, data);
    });

    connection.on('vehicleLocationUpdated', (data: VehiclePayload) => {
      handleVehicleUpsert('vehicleLocationUpdated', data);
    });

    // ۲. ایونت ایجاد خودرو جدید
    connection.on(this.eventCreated, (data: VehiclePayload) => {
      handleVehicleUpsert(this.eventCreated, data);
    });

    // ۳. ایونت ویرایش اطلاعات خودرو
    connection.on(this.eventUpdated, (data: VehiclePayload) => {
      handleVehicleUpsert(this.eventUpdated, data);
    });

    // ۴. ایونت حذف خودرو
    connection.on(
      this.eventDeleted,
      (deletedIdPayload: number | string | { id?: number | string; vehicleId?: number | string }) => {
        console.log(`[SignalR] ${this.eventDeleted} received:`, deletedIdPayload);

        let vehicleId: number | string | undefined;

        if (typeof deletedIdPayload === 'number' || typeof deletedIdPayload === 'string') {
          vehicleId = deletedIdPayload;
        } else if (deletedIdPayload && typeof deletedIdPayload === 'object') {
          vehicleId = deletedIdPayload.id ?? deletedIdPayload.vehicleId;
        }

        if (vehicleId !== undefined && vehicleId !== null && vehicleId !== '') {
          useVehicleStore.getState().removeVehicle(vehicleId);
        } else {
          console.warn('[SignalR] Invalid vehicle ID in VehicleDeleted:', deletedIdPayload);
        }
      },
    );

    connection.onreconnecting((error) => {
      console.warn('[SignalR] Reconnecting...', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('[SignalR] Reconnected successfully:', connectionId);
    });

    connection.onclose((error) => {
      if (error) {
        console.error('[SignalR] Connection closed with error:', error);
      } else {
        console.log('[SignalR] Connection closed.');
      }

      if (this.connection === connection) {
        this.connection = null;
      }
    });
  }

  public stopConnection(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.configRetryTimer) {
      clearTimeout(this.configRetryTimer);
      this.configRetryTimer = null;
    }

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
    }

    this.stopTimer = setTimeout(() => {
      this.stopTimer = null;
      void this.stopConnectionImmediately();
    }, 500);
  }

  private async stopConnectionImmediately(): Promise<void> {
    const connection = this.connection;

    if (!connection) {
      return;
    }

    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // handled
      }
    }

    if (this.connection !== connection) {
      return;
    }

    if (connection.state === signalR.HubConnectionState.Disconnected) {
      this.connection = null;
      return;
    }

    try {
      await connection.stop();
    } catch (error: unknown) {
      console.error('[SignalR] Error while stopping connection:', error);
    } finally {
      if (this.connection === connection) {
        this.connection = null;
      }
    }
  }

  public getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }
}

export const signalRService = new SignalRService();
