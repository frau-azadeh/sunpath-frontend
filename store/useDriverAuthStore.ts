import { create } from 'zustand';
import type { DriverAuthUser } from '@/types/driver-auth';

interface DriverAuthState {
  driver: DriverAuthUser | null;
  isAuthenticated: boolean;
  setDriver: (driver: DriverAuthUser) => void;
  hydrate: () => void;
  logout: () => void;
}

export const useDriverAuthStore = create<DriverAuthState>((set) => ({
  driver: null,
  isAuthenticated: false,
  setDriver: (driver) => {
    if (typeof window !== 'undefined') localStorage.setItem('driver_session', JSON.stringify(driver));
    set({ driver, isAuthenticated: true });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('driver_session');
      if (saved) set({ driver: JSON.parse(saved), isAuthenticated: true });
    } catch { localStorage.removeItem('driver_session'); }
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('driver_session');
    set({ driver: null, isAuthenticated: false });
  },
}));