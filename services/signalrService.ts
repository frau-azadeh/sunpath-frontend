'use client';

import * as signalR from '@microsoft/signalr';

import { useMissionStore } from '@/store/useMissionStore';
import { useVehicleStore } from '@/store/useVehicleStore';

declare global {
  interface Window {
    CONFIG?: {
      NEXT_PUBLIC_API_BASE?: string;
    };
  }
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  private startPromise: Promise<void> | null = null;

  private handlersRegistered = false;

  /* =========================================================
     Base URL
  ========================================================= */

  private getBaseUrl(): string {
    if (typeof window !== 'undefined' && window.CONFIG?.NEXT_PUBLIC_API_BASE) {
      return String(window.CONFIG.NEXT_PUBLIC_API_BASE).replace(/\/+$/, '');
    }

    return '';
  }

  /* =========================================================
     Connection
  ========================================================= */

  private getConnection(): signalR.HubConnection {
    if (this.connection) {
      return this.connection;
    }

    const base = this.getBaseUrl();

    if (!base) {
      throw new Error('NEXT_PUBLIC_API_BASE تنظیم نشده است.');
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${base}/vehicleHub`)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerHandlers();

    return this.connection;
  }

  /* =========================================================
     Reload
  ========================================================= */

  private async reloadVehicles(): Promise<void> {
    try {
      await useVehicleStore.getState().loadVehicles();
    } catch (error) {
      console.error('[SignalR] reloadVehicles:', error);
    }
  }

  private async reloadMissions(): Promise<void> {
    try {
      await useMissionStore.getState().loadMissions();
    } catch (error) {
      console.error('[SignalR] reloadMissions:', error);
    }
  }

  private async reloadAll(): Promise<void> {
    await Promise.allSettled([this.reloadVehicles(), this.reloadMissions()]);
  }

  /* =========================================================
     GPS
  ========================================================= */

  private applyVehiclePosition(payload: any): void {
    if (!payload) {
      return;
    }

    const vehicleId =
      payload.vehicleId ?? payload.VehicleId ?? payload.id ?? payload.Id;

    const latitude = Number(
      payload.latitude ?? payload.Latitude ?? payload.lat,
    );

    const longitude = Number(
      payload.longitude ?? payload.Longitude ?? payload.lng,
    );

    const speed = Number(payload.speed ?? payload.Speed ?? 0);

    const heading = Number(payload.heading ?? payload.Heading ?? 0);

    if (vehicleId == null) {
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    useVehicleStore
      .getState()
      .updateVehiclePosition(vehicleId, latitude, longitude, speed, heading);
  }

  /* =========================================================
     Events
  ========================================================= */

  private registerHandlers(): void {
    if (!this.connection || this.handlersRegistered) {
      return;
    }

    const connection = this.connection;

    this.handlersRegistered = true;

    /* =======================================================
       CREATE MISSION
    ======================================================= */

    connection.on('DispatchCreated', async (dispatch: any) => {
      console.log('[SignalR] DispatchCreated', dispatch);

      if (dispatch && dispatch.id != null) {
        useMissionStore.getState().upsertMission(dispatch);
      }

      await this.reloadAll();
    });

    /* =======================================================
       UPDATE MISSION
    ======================================================= */

    connection.on('DispatchUpdated', async (dispatch: any) => {
      console.log('[SignalR] DispatchUpdated', dispatch);

      if (dispatch && dispatch.id != null) {
        useMissionStore.getState().upsertMission(dispatch);
      }

      await this.reloadAll();
    });

    /* =======================================================
       DELETE MISSION
    ======================================================= */

    connection.on('DispatchDeleted', async (dispatchId: number | string) => {
      console.log('[SignalR] DispatchDeleted', dispatchId);

      useMissionStore.getState().removeMission(dispatchId);

      await this.reloadAll();
    });

    /* =======================================================
       STATUS
    ======================================================= */

    connection.on('DispatchStatusChanged', async (dispatch: any) => {
      console.log('[SignalR] DispatchStatusChanged', dispatch);

      if (dispatch && dispatch.id != null) {
        useMissionStore.getState().upsertMission(dispatch);
      }

      await this.reloadAll();
    });

    /* =======================================================
       OPTIONAL GENERAL EVENT
    ======================================================= */

    connection.on('DispatchChanged', async (payload: any) => {
      console.log('[SignalR] DispatchChanged', payload);

      await this.reloadAll();
    });

    /* =======================================================
       VEHICLE UPDATED
    ======================================================= */

    connection.on('VehicleUpdated', async (payload: any) => {
      console.log('[SignalR] VehicleUpdated', payload);

      /*
       * payload این event partial است.
       * پس برای اطمینان Vehicles را از DB reload می‌کنیم.
       */

      await this.reloadVehicles();
    });

    /* =======================================================
       GPS
    ======================================================= */

    connection.on('VehiclePositionChanged', (payload: any) => {
      this.applyVehiclePosition(payload);
    });

    /*
     * event قدیمی Backend
     */

    connection.on('vehicleLocationUpdated', (payload: any) => {
      this.applyVehiclePosition(payload);
    });

    /* =======================================================
       Reconnect
    ======================================================= */

    connection.onreconnecting((error) => {
      console.warn('[SignalR] reconnecting', error);
    });

    connection.onreconnected(async (connectionId) => {
      console.log('[SignalR] reconnected', connectionId);

      try {
        await connection.invoke('SubscribeLiveMap');
      } catch (error) {
        console.warn('[SignalR] SubscribeLiveMap failed', error);
      }

      await this.reloadAll();
    });

    connection.onclose((error) => {
      console.warn('[SignalR] closed', error);
    });
  }

  /* =========================================================
     START
  ========================================================= */

  public async startConnection(): Promise<void> {
    const connection = this.getConnection();

    if (connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (connection.state === signalR.HubConnectionState.Reconnecting) {
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = connection
      .start()
      .then(async () => {
        console.log('[SignalR] connected:', connection.connectionId);

        try {
          await connection.invoke('SubscribeLiveMap');
        } catch (error) {
          console.warn('[SignalR] SubscribeLiveMap:', error);
        }

        await this.reloadAll();
      })
      .catch((error) => {
        console.error('[SignalR] connection failed:', error);

        throw error;
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  /* =========================================================
     STOP
  ========================================================= */

  public async stopConnection(): Promise<void> {
    if (!this.connection) {
      return;
    }

    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      return;
    }

    await this.connection.stop();
  }

  /* =========================================================
     STATE
  ========================================================= */

  public getState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }
}

export const signalRService = new SignalRService();
