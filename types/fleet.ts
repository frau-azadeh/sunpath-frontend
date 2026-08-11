export interface Vehicle {
  id: number;
  plateNumber: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  lastUpdate: string; 
}
