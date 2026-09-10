'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Navigation,
  KeyRound,
  Phone,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useDriverAuthStore } from '@/store/useDriverAuthStore';
import { driverAuthService } from '@/services/driverAuthService';

export default function DriverLoginPage() {
  const router = useRouter();
  const setDriver = useDriverAuthStore((state) => state.setDriver);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await driverAuthService.login(username, password);
      if (result.success && result.data) {
        setDriver(result.data);
        localStorage.setItem('driver_session', JSON.stringify(result.data));
        // هدایت مستقیم به صفحه کابین راننده
        router.push('/driver/dispatch');
      } else {
        setErrorMessage(result.message || 'شماره تماس یا رمز عبور نامعتبر است.');
      }
    } catch {
      setErrorMessage('خطا در برقراری ارتباط با سرور دیسپچ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-neutral-50 px-4 py-8 font-vazir transition-colors dark:bg-neutral-950"
    >
      {/* هاله‌های نوری تم سان‌پث در پس‌زمینه */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl dark:bg-orange-500/5" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/90"
      >
        {/* هدر لاگین */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-md shadow-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400">
            <Navigation size={32} />
          </div>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white sm:text-2xl">
            کابین ناوبری سان‌پث
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            ورود اختصاصی رانندگان ناوگان دیسپچ
          </p>
        </div>

        {/* پیام خطای فرم */}
        {errorMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* فرم ورود */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              نام کاربری راننده
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری خود را وارد کنید"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pr-10 pl-4 text-xs font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-orange-500 dark:focus:bg-neutral-900"
              />
              <Phone
                size={16}
                className="pointer-events-none absolute right-3.5 top-3.5 text-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              رمز عبور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pr-10 pl-4 text-xs font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-orange-500 dark:focus:bg-neutral-900"
              />
              <KeyRound
                size={16}
                className="pointer-events-none absolute right-3.5 top-3.5 text-neutral-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>در حال تأیید هویت...</span>
              </>
            ) : (
              <>
                <span>ورود به سامانه مأموریت</span>
                <ArrowLeft size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>ارتباط امن رمزنگاری‌شده با هسته ناوگان SunPath</span>
        </div>
      </motion.div>
    </div>
  );
}
