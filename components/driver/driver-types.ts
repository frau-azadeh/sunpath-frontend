export type DriverDispatchStatus =
  | 'Assigned'
  | 'Started'
  | 'Completed'
  | 'Cancelled';

export type DriverPageTab =
  | 'dispatch'
  | 'route'
  | 'history'
  | 'profile';

export type DriverActiveDispatch = {
  id: number;

  status: DriverDispatchStatus;

  title: string;

  description?: string | null;

  vehicleId: number;

  vehiclePlate: string;

  vehicleName: string;

  originTitle: string;

  originLatitude: number | null;

  originLongitude: number | null;

  destinationTitle: string;

  destinationLatitude: number | null;

  destinationLongitude: number | null;

  distanceKm: number;

  estimatedDurationMinutes: number;

  scheduledAt: string;
};

export type DriverCurrentVehicle = {
  id: number;

  plateNumber: string;

  name: string;

  vehicleType?: number | null;
};

export type DriverProfile = {
  id: number;

  fullName: string;

  phoneNumber: string;

  driverCode: string;

  avatarInitials: string;

  currentVehicle: DriverCurrentVehicle | null;

  vehicleCount: number;

  completedDispatches: number;

  rating: number;
};

export type DriverRouteHistoryPoint = {
  latitude: number;

  longitude: number;

  accuracy: number | null;

  speed: number | null;

  heading: number | null;

  recordedAtUtc: string;
};

export type DriverRouteHistory = {
  dispatchId: number;

  title: string | null;

  vehicleId: number;

  vehiclePlate: string | null;

  originTitle: string | null;

  destinationTitle: string | null;

  originLatitude: number | null;

  originLongitude: number | null;

  destinationLatitude: number | null;

  destinationLongitude: number | null;

  startedAtUtc: string | null;

  completedAtUtc: string | null;

  distanceKm: number;

  durationSeconds: number;

  points: DriverRouteHistoryPoint[];
};

export type DispatchStatusConfig = {
  label: string;

  className: string;
};