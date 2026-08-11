// src/components/providers/SignalRProvider.tsx
'use client';

import { useEffect } from 'react';
import { signalRService } from '@/services/signalrService';

export default function SignalRProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // یک وقفه بسیار کوتاه (یا چک کردن موجود بودن کانفیگ)
    const initSignalR = () => {
      if (window.CONFIG) {
        signalRService.startConnection();
      } else {
        // اگر هنوز لود نشده، یک لحظه صبر کن و دوباره چک کن
        setTimeout(initSignalR, 100);
      }
    };

    initSignalR();
  }, []);

  return <>{children}</>;
}
