export type VehicleStatus = 0 | 1;

export type VehicleType = 0 | 1 | 2 | 3;

export interface Vehicle {
  id: number;
  plateNumber: string;
  model: string | null;
  status: VehicleStatus;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastUpdateAt: string | null;
  speed: number;
  heading: number;
  latitude: number | null;
  longitude: number | null;
  lastUpdate: string | null;
  vehicleType: VehicleType;
  insuranceNumber: string | null;
  insuranceExpiryDate: string | null;
  currentDriverId: number | null;
  currentDriverName: string | null;
}

export interface CreateVehicleRequest {
  plateNumber: string;
  model: string | null;
  status: VehicleStatus;
  vehicleType: VehicleType;
  insuranceNumber: string | null;
  insuranceExpiryDate: string | null;
  currentDriverId: number | null;
}

export type UpdateVehicleRequest = CreateVehicleRequest;
