import { type LucideIcon, ShieldCheck, UserCheck, Users } from 'lucide-react';

import { faNumber } from '@/lib/format';

interface DriverStatsProps {
  total: number;
  licensed: number;
  active: number;
}

interface StatConfig {
  label: string;
  value: number;
  icon: LucideIcon;
  boxClass: string; // کلاسهای کامل و ثابت ✅
  iconClass: string;
}

export const DriverStats = ({ total, licensed, active }: DriverStatsProps) => {
  const stats: StatConfig[] = [
    {
      label: 'کل رانندگان',
      value: total,
      icon: Users,
      boxClass:
        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'دارای گواهینامه',
      value: licensed,
      icon: ShieldCheck,
      boxClass:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
    {
      label: 'فعال در سیستم',
      value: active,
      icon: UserCheck,
      boxClass:
        'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      iconClass: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 ">
      {stats.map(({ label, value, icon: Icon, boxClass }) => (
        <div
          key={label}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl  p-5 "
        >
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 ${boxClass}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">
                {faNumber(value)} نفر
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
