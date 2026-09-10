export interface DriverAuthUser {
  driverId: number;
  fullName: string;
  phone: string;
  currentVehicleId?: number;
  token: string;
}

export interface TripMetrics {
  missionId: number;
  distanceKm: number;
  durationMinutes: number;
  stopDurationMinutes: number;
  fuelConsumedLiters: number;
  efficiencyScore: number;
}
