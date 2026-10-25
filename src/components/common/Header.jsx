import React from 'react';
import { useSolarGuard } from '../../context/SolarGuardContext';
import { 
  Sun, 
  ShieldCheck, 
  Wifi, 
  Camera, 
  Database, 
  Smartphone, 
  RotateCw
} from 'lucide-react';
import { formatTimestamp } from '../../utils/formatters';

export default function Header({ activeTab, setActiveTab }) {
  const { 
    lastUpdated, 
    systemStatus, 
    mobilePreviewMode, 
    setMobilePreviewMode,
    cleaningState,
    triggerWipe,
    modelStatus
  } = useSolarGuard();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 edge50:px-4 sm:px-6 py-3 transition-all shadow-sm">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 shadow-sm">
            <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white shadow-xs">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold font-heading tracking-tight text-slate-900">
                Solar<span className="text-blue-600">Guard</span>
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold hidden edge50:inline">
                IoT System
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              3-Panel Telemetry • AI Surface Inspection • Automated SG90 Wiper
            </p>
          </div>
        </div>

        {/* Center / System Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
            <Wifi className={`w-3.5 h-3.5 ${systemStatus.esp32.connected ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="text-slate-500">ESP32:</span>
            <span className={`font-bold ${systemStatus.esp32.connected ? 'text-blue-600' : 'text-slate-500'}`}>
              {systemStatus.esp32.connected ? 'Online' : 'Standby'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-500">Model:</span>
            <span className={`font-bold ${modelStatus.isConnected ? 'text-blue-600' : 'text-slate-500'}`}>
              {modelStatus.isConnected ? 'Loaded' : 'Ready'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">DB:</span>
            <span className="font-bold text-slate-700">.env</span>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Last sync timestamp */}
          <div className="text-right hidden sm:block text-[11px] font-mono text-slate-500">
            <div className="text-[10px] uppercase font-bold text-slate-400">STATUS</div>
            <span className="text-slate-700 font-semibold">{formatTimestamp(lastUpdated)}</span>
          </div>

          {/* Quick Wipe Action in Solar Yellow / Blue */}
          <button
            onClick={() => triggerWipe('Quick Header Action')}
            disabled={cleaningState.status === 'wiping' || cleaningState.status === 'cooldown'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all shadow-sm ${
              cleaningState.status === 'wiping'
                ? 'bg-amber-400 text-amber-950 border border-amber-500 animate-pulse'
                : cleaningState.status === 'cooldown'
                ? 'bg-slate-100 text-slate-500 border border-slate-300 opacity-80 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${cleaningState.status === 'wiping' ? 'animate-spin text-amber-900' : 'text-white'}`} />
            <span className="hidden edge50:inline">
              {cleaningState.status === 'wiping'
                ? `Wiping ${cleaningState.progress}%`
                : cleaningState.status === 'cooldown'
                ? `Cooldown (${cleaningState.cooldownRemaining}s)`
                : 'Wipe Surface'}
            </span>
          </button>

          {/* Motorola Edge 50 View Toggle */}
          <button
            onClick={() => setMobilePreviewMode(!mobilePreviewMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              mobilePreviewMode
                ? 'bg-blue-50 border-blue-400 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle Mobile View Preview"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Mobile Frame</span>
          </button>
        </div>
      </div>
    </header>
  );
}
