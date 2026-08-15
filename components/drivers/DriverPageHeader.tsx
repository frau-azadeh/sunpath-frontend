import { UserPlus } from 'lucide-react';

interface DriverPageHeaderProps {
  onCreate: () => void;
}

export const DriverPageHeader = ({ onCreate }: DriverPageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          ناوگان رانندگان
        </h1>

        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          مدیریت و پایش اطلاعات رانندگان SunPath
        </p>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-orange-600 px-5 text-sm font-bold text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:self-auto"
      >
        <UserPlus size={18} aria-hidden="true" />
        ثبت راننده جدید
      </button>
    </div>
  );
};
