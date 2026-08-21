import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
  iconClassName?: string;
};

export function DriverInfoRow({
  icon,
  label,
  value,
  compact = false,
  iconClassName,
}: Props) {
  return (
    <div className={`flex gap-3 ${compact ? 'items-start' : 'items-center'}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        } ${
          iconClassName ??
          'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {label}
        </p>

        <p
          className={`mt-0.5 break-words font-bold text-neutral-800 dark:text-neutral-100 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
