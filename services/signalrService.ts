// src/services/signalrService.ts
import * as signalR from '@microsoft/signalr';

import { useVehicleStore } from '@/store/useVehicleStore';

type VehiclePositionPayload = {
  id?: number | string;
  vehicleId?: number | string;

  latitude?: number | string;
  longitude?: number | string;

  lat?: number | string;
  lng?: number | string;
  lon?: number | string;

  speed?: number | string;
  heading?: number | string;
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private configRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly eventName = 'VehiclePositionChanged';

  private getHubUrl(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const apiBaseUrl = window.CONFIG?.NEXT_PUBLIC_API_BASE?.trim();

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

    // اگر CONFIG هنوز آماده نشده، داینامیک retry کن
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
      .then(() => {
        console.log('[SignalR] Connected successfully:', hubUrl);
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
    connection.on(this.eventName, (data: VehiclePositionPayload) => {
      console.log(`[SignalR] ${this.eventName} received:`, data);

      const rawVehicleId = data.id ?? data.vehicleId;
      const rawLatitude = data.latitude ?? data.lat;
      const rawLongitude = data.longitude ?? data.lng ?? data.lon;

      const vehicleId = Number(rawVehicleId);
      const latitude = Number(rawLatitude);
      const longitude = Number(rawLongitude);
      const speed = Number(data.speed ?? 0);
      const heading = Number(data.heading ?? 0);

      if (!Number.isFinite(vehicleId)) {
        console.warn('[SignalR] Invalid vehicle id:', data);
        return;
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        console.warn('[SignalR] Invalid vehicle coordinates:', data);
        return;
      }

      useVehicleStore
        .getState()
        .updateVehiclePosition(
          vehicleId,
          latitude,
          longitude,
          Number.isFinite(speed) ? speed : 0,
          Number.isFinite(heading) ? heading : 0,
        );
    });

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
        // handled already
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
