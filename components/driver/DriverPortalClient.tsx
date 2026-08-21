'use client';

import { useState } from 'react';

import { toast } from 'sonner';

import { dispatchService } from '@/services/dispatchService';

import { DriverBottomNavigation } from './DriverBottomNavigation';
import { DriverDispatchView } from './DriverDispatchView';
import { DriverProfileView } from './DriverProfileView';
import { DriverRouteView } from './DriverRouteView';
import { DriverSidebar } from './DriverSidebar';
import { DriverTopbar } from './DriverTopbar';
import { mockDispatch, mockDriverProfile } from './driver-data';
import type { DriverActiveDispatch, DriverPageTab } from './driver-types';

export function DriverPortalClient() {
  const [activeTab, setActiveTab] = useState<DriverPageTab>('dispatch');

  const [dispatch, setDispatch] = useState<DriverActiveDispatch>(mockDispatch);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartDispatch = async (): Promise<void> => {
    try {
      setIsSubmitting(true);

      await dispatchService.updateStatus(dispatch.id, {
        status: 'InProgress',
      });

      setDispatch((current) => ({
        ...current,
        status: 'InProgress',
      }));

      toast.success('مأموریت شروع شد.', {
        description:
          'در مرحله‌ی بعد، اتصال GPS و ارسال موقعیت را فعال می‌کنیم.',
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'شروع مأموریت ناموفق بود.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDispatch = async (): Promise<void> => {
    try {
      setIsSubmitting(true);

      await dispatchService.updateStatus(dispatch.id, {
        status: 'Completed',
      });

      setDispatch((current) => ({
        ...current,
        status: 'Completed',
      }));

      toast.success('مأموریت با موفقیت پایان یافت.');
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'پایان مأموریت ناموفق بود.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px]">
        <DriverSidebar
          profile={mockDriverProfile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <DriverTopbar
            profile={mockDriverProfile}
            activeTab={activeTab}
            onProfileClick={() => setActiveTab('profile')}
          />

          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {activeTab === 'dispatch' && (
              <DriverDispatchView
                dispatch={dispatch}
                isSubmitting={isSubmitting}
                onStartDispatch={handleStartDispatch}
                onCompleteDispatch={handleCompleteDispatch}
              />
            )}

            {activeTab === 'route' && <DriverRouteView dispatch={dispatch} />}

            {activeTab === 'profile' && (
              <DriverProfileView profile={mockDriverProfile} />
            )}
          </div>
        </div>
      </div>

      <DriverBottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </main>
  );
}
