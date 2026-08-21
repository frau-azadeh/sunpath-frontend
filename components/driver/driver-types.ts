export type DriverDispatchStatus = 'Assigned' | 'InProgress' | 'Completed';

export type DriverPageTab = 'dispatch' | 'route' | 'profile';

export type DriverActiveDispatch = {
  id: number;
  status: DriverDispatchStatus;
  title: string;
  vehiclePlate: string;
  vehicleName: string;
  originTitle: string;
  destinationTitle: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  scheduledAt: string;
};

export type DriverProfile = {
  fullName: string;
  phoneNumber: string;
  driverCode: string;
  avatarInitials: string;
  vehicleCount: number;
  completedDispatches: number;
  rating: number;
};

export type DispatchStatusConfig = {
  label: string;
  className: string;
};
