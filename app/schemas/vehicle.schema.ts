import { normalizeVehiclePlate } from '@/lib/plate';
import { z } from 'zod';

import type { VehicleStatus, VehicleType } from '@/types/vehicle';

const toEnglishDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? toEnglishDigits(value).trim() : value;

const vehicleTypeSchema = z.coerce
  .number()
  .int()
  .refine((value) => [0, 1, 2, 3].includes(value), {
    message: 'نوع وسیله نقلیه را انتخاب کنید.',
  })
  .transform((value) => value as VehicleType);

const vehicleStatusSchema = z.coerce
  .number()
  .int()
  .refine((value) => [0, 1].includes(value), {
    message: 'وضعیت خودرو را انتخاب کنید.',
  })
  .transform((value) => value as VehicleStatus);

export const vehicleFormSchema = z.object({
  plateNumber: z.preprocess(
    normalizeText,
    z
      .string()
      .min(3, 'شماره پلاک باید حداقل ۳ کاراکتر باشد.')
      .max(50, 'شماره پلاک بیش از حد طولانی است.'),
  ),

  model: z.preprocess(
    normalizeText,
    z
      .string()
      .min(2, 'مدل خودرو باید حداقل ۲ کاراکتر باشد.')
      .max(100, 'مدل خودرو بیش از حد طولانی است.'),
  ),

  vehicleType: vehicleTypeSchema,

  status: vehicleStatusSchema,

  insuranceNumber: z.preprocess(
    normalizeText,
    z
      .string()
      .min(3, 'شماره بیمه‌نامه باید حداقل ۳ کاراکتر باشد.')
      .max(100, 'شماره بیمه‌نامه بیش از حد طولانی است.'),
  ),

  insuranceExpiryDate: z.preprocess(
    normalizeText,
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'تاریخ انقضای بیمه را به‌درستی انتخاب کنید.',
      ),
  ),

  currentDriverId: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional()
    .transform((value) => value ?? null),
}).superRefine((data, ctx) => {
  if (!normalizeVehiclePlate(data.plateNumber, data.vehicleType)) ctx.addIssue({
    code: 'custom', path: ['plateNumber'],
    message: data.vehicleType === 3 ? 'پلاک موتور باید سه رقم بالا و پنج رقم پایین داشته باشد.' : 'پلاک خودرو باید دو رقم، حرف، سه رقم و کد دو رقمی ایران داشته باشد.',
  });
});

export type VehicleFormInput = z.input<typeof vehicleFormSchema>;

export type VehicleFormValues = z.output<typeof vehicleFormSchema>;
