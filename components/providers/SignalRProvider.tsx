'use client';

import { useEffect } from 'react';

import { signalRService } from '@/services/signalrService';
import { useVehicleStore } from '@/store/useVehicleStore';

export default function SignalRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadVehicles = useVehicleStore((state) => state.loadVehicles);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await loadVehicles();

      if (isMounted) {
        await signalRService.startConnection();
      }
    };

    void init().catch(error => console.warn('اتصال زنده ناموفق بود؛ تلاش مجدد انجام می‌شود.', error));
    const retry = window.setInterval(() => {
      if (isMounted) void signalRService.startConnection().catch(error => console.warn('SignalR reconnect failed:', error));
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(retry);
      void signalRService.stopConnection();
    };
  }, [loadVehicles]);

  return <>{children}</>;
}
