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

  /**
   * دریافت همه مأموریت‌ها از دیتابیس
   */
  fetchDispatches: (signal?: AbortSignal) => Promise<void>;

  /**
   * دریافت یک مأموریت بر اساس شناسه
   */
  fetchDispatchById: (id: number, signal?: AbortSignal) => Promise<void>;

  /**
   * ایجاد مأموریت جدید
   */
  createDispatch: (
    data: CreateDispatchRequest,
  ) => Promise<CreateDispatchResponse>;

  /**
   * تغییر وضعیت مأموریت
   */
  updateDispatchStatus: (
    id: number,
    data: UpdateDispatchStatusRequest,
  ) => Promise<void>;

  /**
   * ثبت موقعیت خودرو
   */
  updateVehicleLocation: (data: UpdateVehicleLocationRequest) => Promise<void>;

  setDispatches: (dispatches: Dispatch[]) => void;
  setActiveDispatch: (dispatch: Dispatch | null) => void;
  clearActiveDispatch: () => void;
  clearError: () => void;
};

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === 'AbortError';
};

export const useDispatchStore = create<DispatchState>((set, get) => ({
  dispatches: [],
  activeDispatch: null,
  loading: false,
  error: null,

  // =========================================================
  // دریافت همه مأموریت‌ها
  // =========================================================

  fetchDispatches: async (signal) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const dispatches = await dispatchService.getAll(signal);

      set({
        dispatches,
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

  // =========================================================
  // دریافت یک مأموریت
  // =========================================================

  fetchDispatchById: async (id, signal) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const dispatch = await dispatchService.getById(id, signal);

      const dispatchExists = get().dispatches.some(
        (item) => item.id === dispatch.id,
      );

      set((state) => ({
        activeDispatch: dispatch,

        dispatches: dispatchExists
          ? state.dispatches.map((item) =>
              item.id === dispatch.id ? dispatch : item,
            )
          : [dispatch, ...state.dispatches],

        loading: false,
        error: null,
      }));
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

  // =========================================================
  // ایجاد مأموریت
  // =========================================================

  createDispatch: async (data) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const result = await dispatchService.create(data);

      set({
        loading: false,
        error: null,
      });

      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        'ایجاد مأموریت با خطا مواجه شد.',
      );

      set({
        loading: false,
        error: errorMessage,
      });

      throw error;
    }
  },

  // =========================================================
  // تغییر وضعیت مأموریت
  // =========================================================

  updateDispatchStatus: async (id, data) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await dispatchService.updateStatus(id, data);

      set((state) => ({
        loading: false,
        error: null,

        dispatches: state.dispatches.map((item) =>
          item.id === id
            ? {
                ...item,
                status: data.status,
              }
            : item,
        ),

        activeDispatch:
          state.activeDispatch?.id === id
            ? {
                ...state.activeDispatch,
                status: data.status,
              }
            : state.activeDispatch,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        'به‌روزرسانی وضعیت مأموریت با خطا مواجه شد.',
      );

      set({
        loading: false,
        error: errorMessage,
      });

      throw error;
    }
  },

  // =========================================================
  // ثبت موقعیت خودرو
  // =========================================================

  updateVehicleLocation: async (data) => {
    set({
      error: null,
    });

    try {
      await dispatchService.updateVehicleLocation(data);
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        'ثبت موقعیت خودرو با خطا مواجه شد.',
      );

      set({
        error: errorMessage,
      });

      throw error;
    }
  },

  // =========================================================
  // تنظیم دستی لیست مأموریت‌ها
  // =========================================================

  setDispatches: (dispatches) => {
    set({
      dispatches,
    });
  },

  // =========================================================
  // تنظیم مأموریت فعال
  // =========================================================

  setActiveDispatch: (dispatch) => {
    set({
      activeDispatch: dispatch,
    });
  },

  // =========================================================
  // پاک‌کردن مأموریت فعال
  // =========================================================

  clearActiveDispatch: () => {
    set({
      activeDispatch: null,
    });
  },

  // =========================================================
  // پاک‌کردن خطا
  // =========================================================

  clearError: () => {
    set({
      error: null,
    });
  },
}));
