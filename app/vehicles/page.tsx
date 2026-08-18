import type { Metadata } from 'next';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { driverService } from '@/services/driverService';
import type { Driver } from '@/types/driver';

import VehiclesPageClientPageClient from './VehiclesPageClient';

export const metadata: Metadata = {
  title: 'مدیریت ناوگان و رانندگان | SunPath',
  description: 'مدیریت یکپارچه ناوگان خودرویی و رانندگان سامانه SunPath',
};

export default async function FleetPage() {
  let initialDrivers: Driver[] = [];
  let initialDriversError = false;

  try {
    initialDrivers = await driverService.getAll();
  } catch {
    initialDriversError = true;
  }

  return (
    <DashboardLayout>
      <div className="h-full">
        <VehiclesPageClientPageClient
          initialDrivers={initialDrivers}
          initialDriversError={initialDriversError}
        />
      </div>
    </DashboardLayout>
  );
}
