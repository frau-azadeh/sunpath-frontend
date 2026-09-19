import { create } from 'zustand';

import type { Dispatch } from '@/types/dispatch';

declare global {
  interface Window {
    CONFIG?: {
      NEXT_PUBLIC_API_BASE?: string;
    };
  }
}

interface MissionState {
  missions: Dispatch[];
  isLoading: boolean;
  error: string | null;

  loadMissions: () => Promise<void>;

  setMissions: (missions: Dispatch[]) => void;

  upsertMission: (mission: Dispatch) => void;

  removeMission: (id: number | string) => void;

  clearMissions: () => void;
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.CONFIG?.NEXT_PUBLIC_API_BASE) {
    return String(window.CONFIG.NEXT_PUBLIC_API_BASE).replace(/\/+$/, '');
  }

  return '';
}

function normalizeList(data: any): Dispatch[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  return [];
}

export const useMissionStore = create<MissionState>((set) => ({
  missions: [],

  isLoading: false,

  error: null,

  loadMissions: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/Dispatches`, {
        method: 'GET',

        headers: {
          Accept: 'application/json',
        },

        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`GET /api/Dispatches failed: ${response.status}`);
      }

      const data = await response.json();

      const missions = normalizeList(data);

      set({
        missions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[MissionStore] loadMissions error:', error);

      set({
        isLoading: false,

        error:
          error instanceof Error ? error.message : 'خطا در دریافت مأموریت‌ها',
      });
    }
  },

  setMissions: (missions) => {
    set({
      missions,
    });
  },

  upsertMission: (mission) => {
    if (!mission || mission.id == null) {
      return;
    }

    set((state) => {
      const index = state.missions.findIndex(
        (item) => String(item.id) === String(mission.id),
      );

      if (index === -1) {
        return {
          missions: [mission, ...state.missions],
        };
      }

      const missions = [...state.missions];

      missions[index] = {
        ...missions[index],
        ...mission,
      };

      return {
        missions,
      };
    });
  },

  removeMission: (id) => {
    set((state) => ({
      missions: state.missions.filter(
        (mission) => String(mission.id) !== String(id),
      ),
    }));
  },

  clearMissions: () => {
    set({
      missions: [],
      error: null,
    });
  },
}));
