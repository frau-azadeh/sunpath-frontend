// components/dashboard/Sidebar.tsx
import { LayoutDashboard, Truck, Map as MapIcon, Settings, Bell, Coffee } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-amber-400 p-2 rounded-lg">
           <Truck size={24} className="text-slate-900" />
        </div>
        <span className="font-bold text-xl tracking-tight">SunPath</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <NavItem icon={<LayoutDashboard size={20} />} label="داشبورد" active />
        <NavItem icon={<MapIcon size={20} />} label="نقشه زنده" />
        <NavItem icon={<Truck size={20} />} label="ناوگان" />
        <NavItem icon={<Bell size={20} />} label="هشدارها" />
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
         <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
               <Coffee size={18} />
            </div>
            <div className="flex flex-col">
               <span className="text-sm font-medium text-white">آزاده جون</span>
               <span className="text-xs text-slate-500">مدیر سیستم</span>
            </div>
         </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
    active ? 'bg-amber-400 text-slate-900 font-semibold' : 'hover:bg-slate-800'
  }`}>
    {icon}
    <span className="text-sm">{label}</span>
  </div>
);

export default Sidebar;
