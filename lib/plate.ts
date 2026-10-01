/** VehicleType 3 is motorcycle in the application's registration form. */
export const MOTORCYCLE_TYPE = 3;
export const englishDigits = (value: string): string => value
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
export const persianDigits = (value: string): string => value.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
export type ParsedPlate =
  | { kind: 'motorcycle'; top: string; bottom: string }
  | { kind: 'car'; left: string; letter: string; middle: string; iran: string };
export function parseVehiclePlate(value: unknown, vehicleType?: number | null): ParsedPlate | null {
  const normalized = englishDigits(String(value ?? '')).trim().replace(/ایران/g, '')
    .replace(/\s+/g, '').replace(/[يك]/g, char => char === 'ي' ? 'ی' : 'ک');
  // Numeric eight-digit plates can be recognized in historical records without type metadata.
  if (vehicleType === MOTORCYCLE_TYPE || (vehicleType == null && /^\d{3}[-/]?\d{5}$/.test(normalized))) {
    const match = normalized.match(/^(\d{3})[-/]?(\d{5})$/);
    return match ? { kind: 'motorcycle', top: match[1], bottom: match[2] } : null;
  }
  const match = normalized.match(/^(\d{2})([آ-ی])(\d{3})[-/]?(\d{2})$/);
  return match ? { kind: 'car', left: match[1], letter: match[2], middle: match[3], iran: match[4] } : null;
}
export function normalizeVehiclePlate(value: unknown, vehicleType: number): string | null {
  const plate = parseVehiclePlate(value, vehicleType);
  if (!plate) return null;
  return plate.kind === 'motorcycle' ? `${plate.top}-${plate.bottom}` : `${plate.left}${plate.letter}${plate.middle}-${plate.iran}`;
}
export function formatVehiclePlate(value: unknown, vehicleType?: number | null): string {
  const plate = parseVehiclePlate(value, vehicleType);
  if (!plate) return persianDigits(String(value ?? '').trim()) || 'پلاک ثبت نشده';
  return persianDigits(plate.kind === 'motorcycle'
    ? `${plate.top} / ${plate.bottom}`
    : `${plate.left} ${plate.letter} ${plate.middle} ایران ${plate.iran}`);
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
