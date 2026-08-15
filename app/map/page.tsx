import { DashboardLayout } from '@/components/layout/DashboardLayout';
import MapClient from './MapClient';

export default function MapPage() {
  return (
    <DashboardLayout>
      <div className="h-full">
        <MapClient />
      </div>
    </DashboardLayout>
  );
}
