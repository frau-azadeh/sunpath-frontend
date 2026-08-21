import { Activity, Bike, Car, Truck, Warehouse } from 'lucide-react';

import { faNumber } from '@/lib/format';

interface VehicleStatsProps {
  total: number;
  active: number;
  trucks: number;
  cars: number;
  bikes: number;
}

interface StatItem {
  label: string;
  value: number;
  icon: typeof Car;
  iconClassName: string;
  iconWrapperClassName: string;
}

export function VehicleStats({
  total,
  active,
  trucks,
  cars,
  bikes,
}: VehicleStatsProps) {
  const stats: StatItem[] = [
    {
      label: 'کل ناوگان',
      value: total,
      icon: Warehouse,
      iconClassName: 'text-blue-600 dark:text-blue-400',
      iconWrapperClassName: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'خودروهای فعال',
      value: active,
      icon: Activity,
      iconClassName: 'text-emerald-600 dark:text-emerald-400',
      iconWrapperClassName: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'کامیون و وانت',
      value: trucks,
      icon: Truck,
      iconClassName: 'text-orange-600 dark:text-orange-400',
      iconWrapperClassName: 'bg-orange-50 dark:bg-orange-500/10',
    },
    {
      label: 'خودروهای سواری',
      value: cars,
      icon: Car,
      iconClassName: 'text-violet-600 dark:text-violet-400',
      iconWrapperClassName: 'bg-violet-50 dark:bg-violet-500/10',
    },
    {
      label: 'موتورسیکلت',
      value: bikes,
      icon: Bike,
      iconClassName: 'text-rose-600 dark:text-rose-400',
      iconWrapperClassName: 'bg-rose-50 dark:bg-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconWrapperClassName}`}
              >
                <Icon size={21} className={stat.iconClassName} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </p>

                <p className="mt-1 text-xl  text-neutral-900 dark:text-white">
                  {faNumber(stat.value)}
                  <span className="mr-1 text-xs font-medium text-neutral-400">
                    دستگاه
                  </span>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
