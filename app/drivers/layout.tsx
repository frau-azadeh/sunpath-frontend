import type { ReactNode } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface DriversLayoutProps {
  children: ReactNode;
}

export default function DriversLayout({ children }: DriversLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
