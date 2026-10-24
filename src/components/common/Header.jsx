import React from 'react';
import { useSolarGuard } from '../../context/SolarGuardContext';
import { 
  Sun, 
  ShieldCheck, 
  Wifi, 
  Camera, 
  Database, 
  Smartphone, 
  RotateCw, 
  Play, 
  Layers
} from 'lucide-react';
import { formatTimestamp } from '../../utils/formatters';

export default function Header({ activeTab, setActiveTab }) {
  const { 
    isDemoMode, 
    lastUpdated, 
    systemStatus, 
    mobilePreviewMode, 
    setMobilePreviewMode,
    cleaningState,
    triggerWipe
  } = useSolarGuard();

  return (
    <header className="sticky top-0 z-30 bg-[#09140d]/90 backdrop-blur-md border-b border-emerald-500/20 px-3 edge50:px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/80 border border-emerald-400/30 shadow-glow-green">
            <Sun className="w-5 h-5 text-emerald-400 animate-spin-slow" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center border border-black">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                SolarGuard
              </h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-semibold hidden edge50:inline">
                IoT System
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              3-Panel Telemetry • AI Surface Inspection • Automated Wiper
            </p>
          </div>
        </div>

        {/* Center / System Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
            <Wifi className={`w-3.5 h-3.5 ${systemStatus.esp32.connected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-zinc-400">ESP32:</span>
            <span className={`font-mono ${systemStatus.esp32.connected ? 'text-emerald-300' : 'text-rose-400'}`}>
              {systemStatus.esp32.connected ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Camera:</span>
            <span className="font-mono text-emerald-300">Ready</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">MongoDB:</span>
            <span className="font-mono text-emerald-300">Atlas</span>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Last sync timestamp */}
          <div className="text-right hidden sm:block text-[11px] font-mono text-zinc-400">
            <div className="text-zinc-500 text-[10px]">LAST SAMPLE</div>
            <span className="text-emerald-400/90 font-medium">{formatTimestamp(lastUpdated)}</span>
          </div>

          {/* Quick Wipe Action */}
          <button
            onClick={() => triggerWipe('Quick Header Action')}
            disabled={cleaningState.status === 'wiping' || cleaningState.status === 'cooldown'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              cleaningState.status === 'wiping'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : cleaningState.status === 'cooldown'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30 opacity-70 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${cleaningState.status === 'wiping' ? 'animate-spin' : ''}`} />
            <span className="hidden edge50:inline">
              {cleaningState.status === 'wiping'
                ? `Wiping ${cleaningState.progress}%`
                : cleaningState.status === 'cooldown'
                ? `Cooldown (${cleaningState.cooldownRemaining}s)`
                : 'Wipe Now'}
            </span>
          </button>

          {/* Motorola Edge 50 Frame Toggle */}
          <button
            onClick={() => setMobilePreviewMode(!mobilePreviewMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              mobilePreviewMode
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-glow-green'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-200'
            }`}
            title="Toggle Motorola Edge 50 Device Frame Preview (20:9 viewport)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Edge 50 View</span>
          </button>
        </div>
      </div>
    </header>
  );
}
