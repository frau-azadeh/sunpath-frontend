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

  private readonly eventName = 'VehiclePositionChanged';

  /**
   * آدرس Hub را از تنظیمات عمومی برنامه می‌خواند.
   *
   * مثال:
   * http://localhost:5000
   * تبدیل می‌شود به:
   * http://localhost:5000/vehicleHub
   */
  private getHubUrl(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const apiBaseUrl = window.CONFIG?.NEXT_PUBLIC_API_BASE?.trim();

    if (!apiBaseUrl) {
      console.error(
        '[SignalR] Missing window.CONFIG.NEXT_PUBLIC_API_BASE.',
      );

      return null;
    }

    const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, '');

    return `${normalizedBaseUrl}/vehicleHub`;
  }

  /**
   * اتصال SignalR را ایجاد و اجرا می‌کند.
   */
  public startConnection(): void {
    if (typeof window === 'undefined') {
      console.warn('[SignalR] Cannot start connection on server.');
      return;
    }

    /**
     * اگر Cleanup قبلی یک Stop تأخیری ثبت کرده،
     * چون اتصال دوباره لازم شده آن را لغو می‌کنیم.
     */
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;

      console.log('[SignalR] Pending stop cancelled.');
    }

    /**
     * اگر قبلاً فرآیند Start در حال اجراست،
     * اتصال جدید نساز.
     */
    if (this.startPromise) {
      console.log('[SignalR] Connection start is already in progress.');
      return;
    }

    /**
     * اگر اتصال فعال است، اتصال جدید نساز.
     */
    if (this.connection) {
      const state = this.connection.state;

      if (
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        console.log(
          `[SignalR] Existing connection is already active. State: ${state}`,
        );

        return;
      }

      /**
       * اگر اتصال قبلی در وضعیت Disconnected است،
       * آن را پاک می‌کنیم تا اتصال جدید ساخته شود.
       */
      this.connection = null;
    }

    const hubUrl = this.getHubUrl();

    if (!hubUrl) {
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

  /**
   * تمام Event Handlerهای SignalR را ثبت می‌کند.
   */
  private registerHandlers(
    connection: signalR.HubConnection,
  ): void {
    connection.on(
      this.eventName,
      (data: VehiclePositionPayload) => {
        console.log(
          `[SignalR] ${this.eventName} received:`,
          data,
        );

        const rawVehicleId = data.id ?? data.vehicleId;

        const rawLatitude =
          data.latitude ?? data.lat;

        const rawLongitude =
          data.longitude ?? data.lng ?? data.lon;

        const vehicleId = Number(rawVehicleId);
        const latitude = Number(rawLatitude);
        const longitude = Number(rawLongitude);
        const speed = Number(data.speed ?? 0);
        const heading = Number(data.heading ?? 0);

        if (!Number.isFinite(vehicleId)) {
          console.warn(
            '[SignalR] Invalid vehicle id:',
            data,
          );

          return;
        }

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          console.warn(
            '[SignalR] Invalid vehicle coordinates:',
            data,
          );

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
      },
    );

    connection.onreconnecting((error) => {
      console.warn(
        '[SignalR] Reconnecting...',
        error,
      );
    });

    connection.onreconnected((connectionId) => {
      console.log(
        '[SignalR] Reconnected successfully:',
        connectionId,
      );
    });

    connection.onclose((error) => {
      if (error) {
        console.error(
          '[SignalR] Connection closed with error:',
          error,
        );
      } else {
        console.log(
          '[SignalR] Connection closed.',
        );
      }

      if (this.connection === connection) {
        this.connection = null;
      }
    });
  }

  /**
   * اتصال را متوقف می‌کند.
   *
   * Stop با تأخیر کوتاه انجام می‌شود تا اگر React StrictMode
   * بلافاصله Start را دوباره صدا زد، اتصال در حین Negotiation
   * قطع نشود.
   */
  public stopConnection(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
    }

    this.stopTimer = setTimeout(() => {
      this.stopTimer = null;

      void this.stopConnectionImmediately();
    }, 500);
  }

  /**
   * Stop واقعی اتصال.
   */
  private async stopConnectionImmediately(): Promise<void> {
    const connection = this.connection;

    if (!connection) {
      console.log(
        '[SignalR] No active connection to stop.',
      );

      return;
    }

    /**
     * اگر Start در حال Negotiation است، صبر می‌کنیم
     * تا Promise آن تمام شود؛ سپس Stop می‌کنیم.
     *
     * این قسمت خطای:
     * The connection was stopped during negotiation
     * را جلوگیری می‌کند.
     */
    if (this.startPromise) {
      console.log(
        '[SignalR] Waiting for negotiation before stopping...',
      );

      try {
        await this.startPromise;
      } catch {
        // خطای Start قبلاً داخل startConnection لاگ شده است.
      }
    }

    /**
     * ممکن است در زمان انتظار، اتصال جدیدی ساخته شده باشد.
     * در این صورت اتصال فعلی را متوقف نکن.
     */
    if (this.connection !== connection) {
      return;
    }

    const state = connection.state;

    if (
      state === signalR.HubConnectionState.Disconnected
    ) {
      this.connection = null;

      console.log(
        '[SignalR] Connection is already disconnected.',
      );

      return;
    }

    try {
      await connection.stop();

      console.log(
        '[SignalR] Connection stopped manually.',
      );
    } catch (error: unknown) {
      console.error(
        '[SignalR] Error while stopping connection:',
        error,
      );
    } finally {
      if (this.connection === connection) {
        this.connection = null;
      }
    }
  }

  /**
   * برای Debug در Console.
   */
  public getConnectionState():
    | signalR.HubConnectionState
    | null {
    return this.connection?.state ?? null;
  }
}

export const signalRService = new SignalRService();
