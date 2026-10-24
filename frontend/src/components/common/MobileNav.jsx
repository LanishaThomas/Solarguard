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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07130b]/95 backdrop-blur-xl border-t border-emerald-500/20 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none">
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
                  ? 'text-emerald-300 font-semibold bg-emerald-950/60 shadow-glow-green border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/20'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-emerald-400' : 'text-zinc-400'
                  } ${item.isPulse ? 'animate-spin text-cyan-400' : ''}`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
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
