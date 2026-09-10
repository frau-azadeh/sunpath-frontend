import { z } from 'zod';

const normalizeDigits = (value: string) =>
  value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
       .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const isValidNationalId = (value: string) => {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return false;
  const check = Number(value[9]);
  const sum = value.slice(0, 9).split('').reduce((t, d, i) => t + Number(d) * (10 - i), 0);
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
};

export const driverFormSchema = z.object({
  firstName: z.string().trim().min(1, 'نام الزامی است.').max(50),
  lastName: z.string().trim().min(1, 'نام خانوادگی الزامی است.').max(50),
  nationalId: z.string().transform(normalizeDigits).transform(v => v.replace(/\D/g, ''))
    .refine(v => v.length === 10, 'کد ملی باید دقیقاً ۱۰ رقم باشد.')
    .refine(isValidNationalId, 'کد ملی واردشده معتبر نیست.'),
  phone: z.string().transform(normalizeDigits).transform(v => v.replace(/\D/g, ''))
    .refine(v => /^09\d{9}$/.test(v), 'شماره تماس نامعتبر است.'),
  licenseType: z.number().int().min(1).max(3),
  username: z.string().trim().min(3, 'نام کاربری حداقل ۳ کاراکتر باشد.').max(100),
  password: z.string().max(200).optional().or(z.literal('')),
});
export type DriverFormInput = z.input<typeof driverFormSchema>;
export type DriverFormValues = z.output<typeof driverFormSchema>;