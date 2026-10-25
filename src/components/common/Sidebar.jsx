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

export default function Sidebar({ activeTab, setActiveTab }) {
  const { alerts, cleaningState, panels } = useSolarGuard();

  const unackAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Overview & telemetry'
    },
    {
      id: 'panels',
      label: 'Panel Monitoring',
      icon: Cpu,
      badge: `${panels.length} Ch`,
      desc: 'INA219 3-channel metrics'
    },
    {
      id: 'camera',
      label: 'Camera & Detection',
      icon: Camera,
      badge: 'AI ML',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      desc: 'Surface inspection'
    },
    {
      id: 'cleaning',
      label: 'Cleaning Control',
      icon: RotateCw,
      badge: cleaningState.status === 'wiping' ? 'Active' : null,
      badgeColor: cleaningState.status === 'wiping' ? 'bg-amber-400 text-amber-950 font-bold animate-pulse' : 'bg-blue-100 text-blue-800',
      desc: 'SG90 Wiper actuator'
    },
    {
      id: 'alerts',
      label: 'Alerts & History',
      icon: Bell,
      badge: unackAlertsCount > 0 ? unackAlertsCount : null,
      badgeColor: criticalCount > 0 ? 'bg-rose-500 text-white font-bold animate-pulse' : 'bg-amber-400 text-slate-950 font-bold',
      desc: 'Rules & safety log'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      desc: 'Actuator & thresholds'
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 p-4 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto justify-between select-none shadow-xs">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-3 mb-2 font-bold">
            System Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-heading">{item.label}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between text-slate-700 font-medium">
          <span>SolarGuard System</span>
          <span className="font-mono text-blue-600 font-bold">v1.0.0</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Desktop &amp; Mobile Responsive View
        </p>
      </div>
    </aside>
  );
}
