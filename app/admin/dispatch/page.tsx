'use client';

import React, { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Send,
  Truck,
  UserCheck,
} from 'lucide-react';

import { dispatchService } from '@/services/dispatchService';
import { driverService } from '@/services/driverService';
import { vehicleService } from '@/services/vehicleService';
import type { Driver } from '@/types/driver';
import type { Vehicle } from '@/types/vehicle';

const AdminMissionMapPicker = dynamic(
  () => import('@/components/admin/AdminMissionMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">
        در حال بارگذاری نقشه دیسپچ ادمین...
      </div>
    ),
  },
);

type Point = { lat: number; lng: number; name: string };

export default function AdminDispatchPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [origin, setOrigin] = useState<Point>({
    lat: 35.6997,
    lng: 51.338,
    name: 'موقعیت فعلی راننده',
  });
  const [destination, setDestination] = useState<Point | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [d, v] = await Promise.all([
        driverService.getAll(),
        vehicleService.getAll(),
      ]);
      setDrivers(d);
      setVehicles(v);
      if (!selectedDriverId && d[0]) setSelectedDriverId(d[0].id);
      if (!selectedVehicleId && v[0]) setSelectedVehicleId(v[0].id);
    } catch (e) {
      setAlert({
        type: 'error',
        message: e instanceof Error ? e.message : 'دریافت اطلاعات ناموفق بود.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => Number(v.status) === 1),
    [vehicles],
  );
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  useEffect(() => {
    if (!selectedDriver) return;
    const assignedVehicle = vehicles.find(
      (v) => v.currentDriverId === selectedDriver.id,
    );
    if (assignedVehicle) setSelectedVehicleId(assignedVehicle.id);
    const lat = Number(
      assignedVehicle?.latitude ?? assignedVehicle?.lastLatitude,
    );
    const lng = Number(
      assignedVehicle?.longitude ?? assignedVehicle?.lastLongitude,
    );
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0)
      setOrigin({
        lat,
        lng,
        name: `موقعیت فعلی ${selectedDriver.firstName} ${selectedDriver.lastName}`,
      });
  }, [selectedDriverId, selectedDriver, vehicles]);

  const handleDispatchMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !selectedVehicleId || !destination) {
      setAlert({
        type: 'error',
        message: 'راننده، خودرو و مقصد را مشخص کنید.',
      });
      return;
    }
    setIsSubmitting(true);
    setAlert(null);
    try {
      await dispatchService.create({
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
        title: title.trim() || `مأموریت به ${destination.name}`,
        description: notes.trim() || null,
        originTitle: origin.name,
        originLatitude: origin.lat,
        originLongitude: origin.lng,
        destinationTitle: destination.name,
        destinationLatitude: destination.lat,
        destinationLongitude: destination.lng,
      });
      setAlert({
        type: 'success',
        message: 'مأموریت ثبت شد و در پنل راننده نمایش داده می‌شود.',
      });
      setTitle('');
      setNotes('');
      await load();
    } catch (e) {
      setAlert({
        type: 'error',
        message: e instanceof Error ? e.message : 'ثبت مأموریت ناموفق بود.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans dir-rtl"
      dir="rtl"
    >
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            SP
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              پنل کنترل و دیسپچ ناوگان (Admin)
            </h1>
            <p className="text-xs text-slate-400">
              تخصیص مأموریت و نظارت بر مسیر
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>{drivers.length.toLocaleString('fa-IR')} راننده</span>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              ثبت مأموریت جدید برای راننده
            </h2>
            {alert && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${alert.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}
              >
                {alert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {alert.message}
              </div>
            )}
            {isLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-amber-400" />
              </div>
            ) : (
              <form onSubmit={handleDispatchMission} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                    انتخاب راننده مجری:
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {drivers.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDriverId(d.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${selectedDriverId === d.id ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck className="w-4 h-4" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">
                              {d.firstName} {d.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {d.phone}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          {d.username}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                    خودرو:
                  </label>
                  <select
                    required
                    value={selectedVehicleId ?? ''}
                    onChange={(e) =>
                      setSelectedVehicleId(Number(e.target.value))
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                  >
                    <option value="">انتخاب خودرو...</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} - {v.model || 'نامشخص'}
                        {v.currentDriverId
                          ? ` — راننده: ${v.currentDriverName || ''}`
                          : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {selectedVehicle
                      ? `خودروی انتخابی: ${selectedVehicle.plateNumber}`
                      : ''}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    مبدأ حرکت:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={origin.name}
                      onChange={(e) =>
                        setOrigin({ ...origin, name: e.target.value })
                      }
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                    />
                    <MapPin className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    مقصد مأموریت:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={destination?.name || ''}
                      onChange={(e) =>
                        setDestination(
                          destination
                            ? { ...destination, name: e.target.value }
                            : { lat: 35.7, lng: 51.4, name: e.target.value },
                        )
                      }
                      placeholder="روی نقشه کلیک کنید..."
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                    />
                    <Navigation className="w-4 h-4 text-rose-400 absolute right-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    عنوان مأموریت:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تحویل محموله"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    توضیحات:
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting
                    ? 'در حال ارسال...'
                    : 'ارسال مأموریت به راننده منتخب'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col min-h-[520px] bg-slate-900 border border-slate-800 p-2 sm:p-3 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 text-xs text-slate-400">
            <span>کلیک روی نقشه برای انتخاب نقطه</span>
            <span className="text-amber-400 font-mono">نقشه زنده آنلاین</span>
          </div>
          <div className="flex-1 w-full h-full">
            <AdminMissionMapPicker
              origin={origin}
              destination={destination}
              onSelectOrigin={(coords) => setOrigin(coords)}
              onSelectDestination={(coords) => setDestination(coords)}
              activeDrivers={drivers.map((d) => {
                const v = vehicles.find((x) => x.currentDriverId === d.id);
                return {
                  id: d.id,
                  name: `${d.firstName} ${d.lastName}`,
                  lat: Number(v?.latitude ?? v?.lastLatitude ?? 35.6892),
                  lng: Number(v?.longitude ?? v?.lastLongitude ?? 51.389),
                  speed: Number(v?.speed ?? 0),
                };
              })}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
