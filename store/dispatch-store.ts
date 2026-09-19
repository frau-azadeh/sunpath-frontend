'use client';

import { create } from 'zustand';

import { dispatchService } from '@/services/dispatchService';
import type {
  CreateDispatchRequest,
  Dispatch,
  UpdateDispatchStatusRequest,
  UpdateVehicleLocationRequest,
} from '@/types/dispatch';

type CreateDispatchResponse = {
  id: number;
};

type DispatchState = {
  dispatches: Dispatch[];

  activeDispatch: Dispatch | null;

  loading: boolean;

  error: string | null;

  fetchDispatches: (signal?: AbortSignal) => Promise<void>;

  fetchDispatchById: (id: number, signal?: AbortSignal) => Promise<void>;

  createDispatch: (
    data: CreateDispatchRequest,
  ) => Promise<CreateDispatchResponse>;

  updateDispatchStatus: (
    id: number,
    data: UpdateDispatchStatusRequest,
  ) => Promise<void>;

  updateVehicleLocation: (data: UpdateVehicleLocationRequest) => Promise<void>;

  setDispatches: (dispatches: Dispatch[]) => void;

  setActiveDispatch: (dispatch: Dispatch | null) => void;

  upsertDispatch: (dispatch: Dispatch) => void;

  removeDispatch: (id: number) => void;

  clearActiveDispatch: () => void;

  clearError: () => void;
};

/* =========================================================
   Helpers
========================================================= */

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === 'AbortError';
};

/* =========================================================
   Store
========================================================= */

export const useDispatchStore = create<DispatchState>((set, get) => ({
  dispatches: [],

  activeDispatch: null,

  loading: false,

  error: null,

  /* =====================================================
         دریافت همه مأموریت‌ها
      ===================================================== */

  fetchDispatches: async (signal) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const dispatches = await dispatchService.getAll(signal);

      set({
        dispatches: Array.isArray(dispatches) ? dispatches : [],

        loading: false,

        error: null,
      });
    } catch (error) {
      if (isAbortError(error)) {
        set({
          loading: false,
        });

        return;
      }

      set({
        loading: false,

        error: getErrorMessage(
          error,
          'بارگذاری لیست مأموریت‌ها با خطا مواجه شد.',
        ),
      });
    }
  },

  /* =====================================================
         دریافت یک مأموریت
      ===================================================== */

  fetchDispatchById: async (id, signal) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const dispatch = await dispatchService.getById(id, signal);

      set((state) => {
        const exists = state.dispatches.some(
          (item) => Number(item.id) === Number(dispatch.id),
        );

        return {
          activeDispatch: dispatch,

          dispatches: exists
            ? state.dispatches.map((item) =>
                Number(item.id) === Number(dispatch.id) ? dispatch : item,
              )
            : [dispatch, ...state.dispatches],

          loading: false,

          error: null,
        };
      });
    } catch (error) {
      if (isAbortError(error)) {
        set({
          loading: false,
        });

        return;
      }

      set({
        loading: false,

        error: getErrorMessage(error, 'بارگذاری مأموریت با خطا مواجه شد.'),
      });
    }
  },

  /* =====================================================
         ایجاد مأموریت
      ===================================================== */

  createDispatch: async (data) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const result = await dispatchService.create(data);

      /*
       * Controller فقط id برمی‌گرداند.
       *
       * بنابراین بعد از Create،
       * مأموریت کامل را از API می‌گیریم.
       */

      try {
        const created = await dispatchService.getById(result.id);

        get().upsertDispatch(created);
      } catch (reloadError) {
        console.warn(
          '[DispatchStore] created dispatch reload failed:',
          reloadError,
        );

        /*
         * اگر GET by id شکست خورد،
         * حداقل کل لیست را دوباره می‌گیریم.
         */

        try {
          const dispatches = await dispatchService.getAll();

          set({
            dispatches: Array.isArray(dispatches) ? dispatches : [],
          });
        } catch (listError) {
          console.warn('[DispatchStore] reload dispatches failed:', listError);
        }
      }

      set({
        loading: false,
        error: null,
      });

      return result;
    } catch (error) {
      const message = getErrorMessage(error, 'ایجاد مأموریت با خطا مواجه شد.');

      set({
        loading: false,
        error: message,
      });

      throw error;
    }
  },

  /* =====================================================
         تغییر وضعیت مأموریت
      ===================================================== */

  updateDispatchStatus: async (id, data) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await dispatchService.updateStatus(id, data);

      /*
       * ابتدا state لوکال را سریع تغییر می‌دهیم.
       */

      set((state) => ({
        loading: false,

        error: null,

        dispatches: state.dispatches.map((item) =>
          Number(item.id) === Number(id)
            ? {
                ...item,
                status: data.status,
              }
            : item,
        ),

        activeDispatch:
          Number(state.activeDispatch?.id) === Number(id)
            ? {
                ...state.activeDispatch!,
                status: data.status,
              }
            : state.activeDispatch,
      }));

      /*
       * بعد نسخه واقعی DB را می‌گیریم.
       */

      try {
        const updated = await dispatchService.getById(id);

        get().upsertDispatch(updated);
      } catch (error) {
        console.warn('[DispatchStore] status refresh failed:', error);
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        'به‌روزرسانی وضعیت مأموریت با خطا مواجه شد.',
      );

      set({
        loading: false,
        error: message,
      });

      throw error;
    }
  },

  /* =====================================================
         ثبت GPS
      ===================================================== */

  updateVehicleLocation: async (data) => {
    set({
      error: null,
    });

    try {
      await dispatchService.updateVehicleLocation(data);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'ثبت موقعیت خودرو با خطا مواجه شد.',
      );

      set({
        error: message,
      });

      throw error;
    }
  },

  /* =====================================================
         Set list
      ===================================================== */

  setDispatches: (dispatches) => {
    set({
      dispatches: Array.isArray(dispatches) ? dispatches : [],
    });
  },

  /* =====================================================
         Active
      ===================================================== */

  setActiveDispatch: (dispatch) => {
    set({
      activeDispatch: dispatch,
    });
  },

  /* =====================================================
         UPSERT
      ===================================================== */

  upsertDispatch: (dispatch) => {
    if (!dispatch || dispatch.id == null) {
      return;
    }

    set((state) => {
      const index = state.dispatches.findIndex(
        (item) => Number(item.id) === Number(dispatch.id),
      );

      if (index === -1) {
        return {
          dispatches: [dispatch, ...state.dispatches],

          activeDispatch:
            Number(state.activeDispatch?.id) === Number(dispatch.id)
              ? dispatch
              : state.activeDispatch,
        };
      }

      const dispatches = [...state.dispatches];

      dispatches[index] = {
        ...dispatches[index],
        ...dispatch,
      };

      return {
        dispatches,

        activeDispatch:
          Number(state.activeDispatch?.id) === Number(dispatch.id)
            ? {
                ...state.activeDispatch!,
                ...dispatch,
              }
            : state.activeDispatch,
      };
    });
  },

  /* =====================================================
         REMOVE
      ===================================================== */

  removeDispatch: (id) => {
    set((state) => ({
      dispatches: state.dispatches.filter(
        (item) => Number(item.id) !== Number(id),
      ),

      activeDispatch:
        Number(state.activeDispatch?.id) === Number(id)
          ? null
          : state.activeDispatch,
    }));
  },

  /* =====================================================
         Clear active
      ===================================================== */

  clearActiveDispatch: () => {
    set({
      activeDispatch: null,
    });
  },

  /* =====================================================
         Clear error
      ===================================================== */

  clearError: () => {
    set({
      error: null,
    });
  },
}));
