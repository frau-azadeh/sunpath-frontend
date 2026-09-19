import { apiRequest } from '@/lib/api/request';
import type { DriverAuthUser } from '@/types/driver-auth';

type LoginResponse = {
  success: boolean;
  driverId: number;
  fullName: string;
  phone: string;
  currentVehicleId?: number | null;
  token: string;
  message?: string;
};

export const driverAuthService = {
  async login(username: string, password: string) {
    try {
      const response = await apiRequest<LoginResponse>(
        '/api/driverauth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
      );
      if (!response.success)
        return { success: false, message: response.message || 'خطا در ورود' };
      const data: DriverAuthUser = {
        driverId: response.driverId,
        fullName: response.fullName,
        phone: response.phone,
        currentVehicleId: response.currentVehicleId ?? undefined,
        token: response.token,
      };
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'خطا در برقراری ارتباط با سرور',
      };
    }
  },
};
