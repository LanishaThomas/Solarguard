import React from 'react';
import { useSolarGuard } from '../../context/SolarGuardContext';
import { 
  LayoutDashboard, 
  Cpu, 
  Camera, 
  RotateCw, 
  Bell, 
  Settings, 
  Activity,
  Layers,
  Database,
  ExternalLink
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
      desc: 'Surface inspection'
    },
    {
      id: 'cleaning',
      label: 'Cleaning Control',
      icon: RotateCw,
      badge: cleaningState.status === 'wiping' ? 'Active' : null,
      badgeColor: cleaningState.status === 'wiping' ? 'bg-cyan-500' : 'bg-emerald-500',
      desc: 'SG90 Wiper actuator'
    },
    {
      id: 'alerts',
      label: 'Alerts & History',
      icon: Bell,
      badge: unackAlertsCount > 0 ? unackAlertsCount : null,
      badgeColor: criticalCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-black',
      desc: 'Rules & safety log'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      desc: 'MongoDB & thresholds'
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#07110a] border-r border-emerald-500/15 p-4 min-h-[calc(100vh-61px)] justify-between select-none">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="text-[11px] font-mono tracking-wider text-emerald-400/70 uppercase px-3 mb-2 font-semibold">
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
                      ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-500/40 shadow-glow-green font-medium'
                      : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/30 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900/60 text-zinc-400 group-hover:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-heading">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-zinc-800 text-zinc-300'
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

        {/* Hardware Status Snapshot Box */}
        <div className="rounded-xl p-3.5 bg-gradient-to-b from-[#0d1d13] to-[#0a160e] border border-emerald-500/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Hardware Topology
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              ESP32
            </span>
          </div>

          <div className="text-xs space-y-1.5 text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>INA219 x3:</span>
              <span className="text-emerald-400">3 Channels</span>
            </div>
            <div className="flex justify-between">
              <span>DS18B20 Temp:</span>
              <span className="text-emerald-400">GPIO 4</span>
            </div>
            <div className="flex justify-between">
              <span>SG90 Servo:</span>
              <span className="text-emerald-400">PWM GPIO 18</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-emerald-400">MongoDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-emerald-500/15 text-[11px] text-zinc-500 space-y-1">
        <div className="flex items-center justify-between text-zinc-400">
          <span>SolarGuard Prototyping</span>
          <span className="font-mono text-emerald-400">v1.0.0</span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-tight">
          Designed for Desktop &amp; Motorola Edge 50 Mobile
        </p>
      </div>
    </aside>
  );
}
