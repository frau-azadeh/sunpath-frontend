import { z } from 'zod';

/**
 * تبدیل اعداد فارسی و عربی به انگلیسی؛
 * برای کد ملی و شماره موبایل ضروری است، چون کاربر ممکن است
 * اعداد را با کیبورد فارسی وارد کند.
 */
const normalizeDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

/**
 * بررسی معتبر بودن کد ملی ایران.
 */
const isValidNationalId = (nationalId: string): boolean => {
  if (!/^\d{10}$/.test(nationalId)) return false;

  // کدهای تکراری مانند 0000000000 یا 1111111111 معتبر نیستند.
  if (/^(\d)\1{9}$/.test(nationalId)) return false;

  const checkDigit = Number(nationalId[9]);

  const sum = nationalId
    .slice(0, 9)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);

  const remainder = sum % 11;

  return remainder < 2
    ? checkDigit === remainder
    : checkDigit === 11 - remainder;
};

const requiredText = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} الزامی است.`)
    .max(50, `${fieldName} نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.`);

export const driverFormSchema = z.object({
  firstName: requiredText('نام'),

  lastName: requiredText('نام خانوادگی'),

  nationalId: z
    .string()
    .transform((value) => normalizeDigits(value).replace(/\D/g, ''))
    .refine((value) => value.length === 10, {
      message: 'کد ملی باید دقیقاً ۱۰ رقم باشد.',
    })
    .refine(isValidNationalId, {
      message: 'کد ملی واردشده معتبر نیست.',
    }),

  phone: z
    .string()
    .transform((value) => normalizeDigits(value).replace(/\D/g, ''))
    .refine((value) => /^09\d{9}$/.test(value), {
      message: 'شماره تماس باید با ۰۹ شروع شده و ۱۱ رقم باشد.',
    }),

  licenseType: z
    .number({
      error: 'انتخاب نوع گواهینامه الزامی است.',
    })
    .int()
    .min(1, 'نوع گواهینامه نامعتبر است.')
    .max(3, 'نوع گواهینامه نامعتبر است.'),
});

/**
 * Type دادهٔ خام ورودی فرم، پیش از transform شدن Zod.
 */
export type DriverFormInput = z.input<typeof driverFormSchema>;

/**
 * Type دادهٔ نهایی و اعتبارسنجی‌شده برای ارسال به API.
 * nationalId و phone در این type نرمال‌سازی شده‌اند.
 */
export type DriverFormValues = z.output<typeof driverFormSchema>;
