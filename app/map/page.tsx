// app/map/page.tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LiveMapEnhanced from '@/components/map/LiveMapEnhanced';

export default function MapPage() {
  return (
    <DashboardLayout>
      <div className="h-full">
       <LiveMapEnhanced/>
      </div>
    </DashboardLayout>
  );
}
