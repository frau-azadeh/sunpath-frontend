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
        signalRService.startConnection();
      }
    };

    init();

    return () => {
      isMounted = false;
      void signalRService.stopConnection();
    };
  }, [loadVehicles]);

  return <>{children}</>;
}
