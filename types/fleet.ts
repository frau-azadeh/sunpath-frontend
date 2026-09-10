export interface VehicleDispatchInfo {
  id?: number;
  originLat?: number | null;
  originLng?: number | null;
  originAddress?: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationAddress?: string | null;
  status?: number | string;
}

export interface Vehicle {
  id: number;
  plateNumber: string;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  lastUpdate: string;

  // فیلدهای مأموریت و دیسپچ برای نمایش مسیر و مقصد روی نقشه
  model?: string | null;
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastUpdateAt?: string | null;
  currentDriverName?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  originAddress?: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationAddress?: string | null;
  dispatch?: VehicleDispatchInfo | null;
  fuelConsumedLiters?: number;
  tripDistanceKm?: number;
  tripDurationSeconds?: number;
  stopDurationSeconds?: number;
}
