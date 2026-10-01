'use client';
import { useEffect, useState } from 'react';
import { englishDigits } from '@/lib/plate';

export function MotorcyclePlateInput({ value, onChange, onBlur, disabled, hasError }: {
  value: string; onChange: (value: string) => void; onBlur: () => void; disabled?: boolean; hasError?: boolean;
}) {
  const split = (raw: string): [string, string] => {
    const normalized = englishDigits(raw).replace(/\s/g, '');
    if (/^\d{8}$/.test(normalized)) return [normalized.slice(0, 3), normalized.slice(3)];
    const match = normalized.match(/^(\d{0,3})[-/]?(\d{0,5})$/);
    return match ? [match[1], match[2]] : ['', ''];
  };
  const [parts, setParts] = useState(() => split(value));
  useEffect(() => { setParts(split(value)); }, [value]);
  const change = (index: number, raw: string) => {
    const next = [...parts] as [string, string];
    next[index] = englishDigits(raw).replace(/\D/g, '').slice(0, index === 0 ? 3 : 5);
    setParts(next); onChange(`${next[0]}-${next[1]}`);
  };
  return <div className="space-y-2"><div dir="ltr" className="inline-flex overflow-hidden rounded-xl border border-neutral-400 bg-white text-neutral-950">
    <div className="flex w-10 flex-col items-center justify-center bg-blue-700 text-[9px] text-white"><span>🇮🇷</span><span>I.R. IRAN</span></div>
    <div className="flex flex-col items-center p-2"><span className="text-xs">ایران</span>
      {parts.map((part, index) => <input key={index} value={part} onChange={event => change(index, event.target.value)} onBlur={onBlur} disabled={disabled} aria-invalid={hasError}
        aria-label={index === 0 ? 'سه رقم بالای پلاک موتور' : 'پنج رقم پایین پلاک موتور'} inputMode="numeric" maxLength={index === 0 ? 3 : 5}
        placeholder={index === 0 ? '۱۲۳' : '۴۵۶۷۸'} className="w-36 border-b border-neutral-200 bg-white p-2 text-center text-lg font-black outline-none focus:bg-orange-50" />)}
    </div></div><p className="text-xs text-neutral-500">پلاک موتور: سه رقم در بالا و پنج رقم در پایین، بدون حرف.</p></div>;
}
