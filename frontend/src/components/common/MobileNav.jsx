import React from 'react';
import { useSolarGuard } from '../../context/SolarGuardContext';
import { 
  LayoutDashboard, 
  Cpu, 
  Camera, 
  RotateCw, 
  Bell, 
  Settings 
} from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab }) {
  const { alerts, cleaningState } = useSolarGuard();

  const unackAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const isWiping = cleaningState.status === 'wiping';

  const navItems = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'panels', label: 'Panels', icon: Cpu },
    { id: 'camera', label: 'Vision', icon: Camera },
    { 
      id: 'cleaning', 
      label: 'Wiper', 
      icon: RotateCw, 
      isPulse: isWiping 
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: Bell, 
      badge: unackAlertsCount > 0 ? unackAlertsCount : null 
    },
    { id: 'settings', label: 'Config', icon: Settings }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none shadow-lg">
      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl touch-target transition-all ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50 border border-blue-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-blue-600' : 'text-slate-500'
                  } ${item.isPulse ? 'animate-spin text-amber-500' : ''}`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-heading tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
