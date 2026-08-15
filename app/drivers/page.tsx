import { driverService } from '@/services/driverService';
import type { Driver } from '@/types/driver';

import DriversPageClient from './DriversPageClient';

export default async function DriversPage() {
  let initialDrivers: Driver[] = [];
  let initialError = false;

  try {
    initialDrivers = await driverService.getAll();
  } catch {
    initialError = true;
  }

  return (
    <DriversPageClient
      initialDrivers={initialDrivers}
      initialError={initialError}
    />
  );
}
