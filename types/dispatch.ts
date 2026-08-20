export type DispatchStatus =
  'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Dispatch {
  id: number;
  driverId: number | null;
  vehicleId: number;
  title: string | null;
  description: string | null;
  originTitle: string | null;
  originLatitude: number | null;
  originLongitude: number | null;
  destinationTitle: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  status: DispatchStatus | string;
  createdAtUtc: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  updatedAtUtc: string | null;
}

export interface CreateDispatchRequest {
  driverId: number | null;
  vehicleId: number;
  title: string;
  description: string | null;
  originTitle: string;
  originLatitude: number | null;
  originLongitude: number | null;
  destinationTitle: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}

export interface UpdateDispatchStatusRequest {
  status: DispatchStatus | string;
}

export interface UpdateVehicleLocationRequest {
  vehicleId: number;
  driverId: number | null;
  missionId: number | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recordedAtUtc: string | null;
}
