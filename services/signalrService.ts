import * as signalR from '@microsoft/signalr';

import { useVehicleStore } from '@/store/useVehicleStore';

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  public startConnection(): void {
    if (this.connection) return;

    // دسترسی مستقیم به کانفیگِ تزریق شده در مرورگر
    const baseUrl = window.CONFIG?.NEXT_PUBLIC_API_BASE;

    if (!baseUrl) {
      console.error('SignalR Error: Configuration (window.CONFIG) is missing!');
      return;
    }

    const HUB_URL = `${baseUrl}/vehicleHub`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection
      .start()
      .then(() => console.log(`Connected to SunPath Hub at: ${baseUrl} 🛰️`))
      .catch((err) => console.error('SignalR Connection Error: ', err));

    this.connection.on('VehiclePositionChanged', (data) => {
      useVehicleStore
        .getState()
        .updateVehiclePosition(
          data.id,
          data.latitude,
          data.longitude,
          data.speed,
          data.heading,
        );
    });
  }
}

export const signalRService = new SignalRService();
