'use client';
import type { Dispatch } from '@/types/dispatch';
import { workflowLabel, missionNextAction } from '@/lib/notifications';
export function DriverMissionActions({ dispatch, busy, onAccept, onStart, onArrive, onComplete }: {
  dispatch: Dispatch; busy: boolean; onAccept: () => Promise<void>; onStart: () => Promise<void>; onArrive: () => Promise<void>; onComplete: () => Promise<void>;
}) {
  const status = String(dispatch.status).toLowerCase();
  const started = ['2','started','inprogress','in_progress'].includes(status);
  const next = missionNextAction(dispatch);
  const handlers = { accept: onAccept, start: onStart, arrive: onArrive, complete: onComplete };
  const labels = { accept: 'قبول مأموریت', start: 'شروع حرکت و فعال‌کردن GPS', arrive: 'رسیدم به مقصد', complete: 'ثبت پایان مأموریت' };
  const action = next ? handlers[next] : null;
  const label = next ? labels[next] : '';
  return <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{workflowLabel(dispatch)}</p>
    {dispatch.acceptedAtUtc && <p className="text-xs text-neutral-500">پذیرش: {new Date(dispatch.acceptedAtUtc).toLocaleString('fa-IR')}</p>}
    {dispatch.arrivedAtUtc && <p className="text-xs text-emerald-600">رسیدن: {new Date(dispatch.arrivedAtUtc).toLocaleString('fa-IR')}</p>}
    {action && <button type="button" disabled={busy} onClick={() => void action()} className="min-h-12 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'در حال ثبت…' : label}</button>}
    {started && !dispatch.arrivedAtUtc && <p className="text-xs leading-6 text-neutral-500">پس از رسیدن به مقصد دکمه «رسیدم» را بزنید؛ رسیدن شما برای مدیر اعلام می‌شود.</p>}
  </div>;
}
