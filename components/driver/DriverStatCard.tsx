import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
};

export function DriverStatCard({ icon, label, value }: Props) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3.5 dark:bg-neutral-950">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 text-sm font-black text-neutral-800 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}
