import type { Metadata } from 'next';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

import VehiclesPageClient from './VehiclesPageClient';

export const metadata: Metadata = {
  title: 'مدیریت خودروها | SunPath',
  description: 'ثبت و مدیریت خودروهای ناوگان SunPath',
};

export default function VehiclesPage() {
  return (
    <DashboardLayout>
      <div className="h-full">
        <VehiclesPageClient />
      </div>
    </DashboardLayout>
  );
}
