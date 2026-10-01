import { formatVehiclePlate, parseVehiclePlate, persianDigits } from '@/lib/plate';

export function VehiclePlate({ value, vehicleType, compact = false }: {
  value?: unknown; vehicleType?: number | null; compact?: boolean;
}) {
  const plate = parseVehiclePlate(value, vehicleType);
  const label = formatVehiclePlate(value, vehicleType);
  if (!plate) return <span dir="ltr" className="inline-block rounded-lg border border-dashed border-neutral-300 px-2 py-1 text-xs" title="فرمت قدیمی یا نامعتبر؛ برای اصلاح ویرایش کنید">{label}</span>;
  return <span dir="ltr" role="img" aria-label={label} title={label}
    className={`inline-flex shrink-0 overflow-hidden rounded-lg border border-neutral-400 bg-white align-middle font-black text-neutral-950 shadow-sm ${compact ? 'text-xs' : 'text-base'}`}>
    <span className="flex w-7 flex-col items-center justify-center bg-blue-700 p-1 text-[6px] leading-tight text-white"><span>🇮🇷</span><span>I.R.</span><span>IRAN</span></span>
    {plate.kind === 'motorcycle'
      ? <span className="flex min-w-24 flex-col items-center px-3 py-1"><span className="text-[7px] font-normal">ایران</span><span>{persianDigits(plate.top)}</span><span className="w-full border-t border-neutral-300 text-center tracking-widest">{persianDigits(plate.bottom)}</span></span>
      : <><span className="flex items-center gap-2 px-2 py-2"><span>{persianDigits(plate.left)}</span><span>{plate.letter}</span><span>{persianDigits(plate.middle)}</span></span><span className="flex flex-col items-center justify-center border-l border-neutral-300 px-2"><span className="text-[7px] font-normal">ایران</span><span>{persianDigits(plate.iran)}</span></span></>}
  </span>;
}
