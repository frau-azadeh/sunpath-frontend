import { CreditCard, EllipsisVertical, Phone } from 'lucide-react';

import { faNumber } from '@/lib/format';
import type { Driver } from '@/types/driver';

interface DriverTableRowProps {
  driver: Driver;
  onOpenActions?: (driver: Driver) => void;
}

export const DriverTableRow = ({
  driver,
  onOpenActions,
}: DriverTableRowProps) => {
  const fullName = `${driver.firstName} ${driver.lastName}`.trim();
  const initial = driver.firstName.trim().charAt(0) || '?';

  return (
    <tr className="transition-colors hover:bg-muted/50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-orange-100 font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
          >
            {initial}
          </div>

          <span className="font-semibold text-foreground">{fullName}</span>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard size={15} aria-hidden="true" />
          <span dir="ltr">{faNumber(driver.nationalId)}</span>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone size={15} aria-hidden="true" />
          <span dir="ltr">{faNumber(driver.phone)}</span>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          پایه {faNumber(driver.licenseType)}
        </span>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-center">
        <button
          type="button"
          aria-label={`عملیات راننده ${fullName}`}
          onClick={() => onOpenActions?.(driver)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <EllipsisVertical size={18} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
};
