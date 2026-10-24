import React from 'react';
import { useSolarGuard } from '../../context/SolarGuardContext';
import { AlertTriangle, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function DemoBanner() {
  const { isDemoMode, setIsDemoMode, activeScenario, setActiveScenario } = useSolarGuard();

  if (!isDemoMode) {
    return (
      <div className="bg-amber-950/40 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>LIVE HARDWARE MODE:</strong> Awaiting live telemetry packets from ESP32 REST server (<code className="font-mono bg-black/40 px-1 rounded">192.168.1.150</code>). No synthetic data will be shown.
          </span>
        </div>
        <button
          onClick={() => setIsDemoMode(true)}
          className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded transition"
        >
          Return to Demo / Simulated Telemetry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-emerald-950/50 border-b border-emerald-500/30 px-3 edge50:px-4 py-2 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide">
            SIMULATION MODE
          </span>
          <span className="hidden sm:inline text-emerald-300/80">
            Simulated IoT telemetry for prototyping. Readings clearly marked.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <label className="text-[11px] text-zinc-400 hidden md:inline">Test Scenario:</label>
        <select
          value={activeScenario}
          onChange={(e) => setActiveScenario(e.target.value)}
          className="bg-black/60 border border-emerald-500/40 rounded px-2 py-1 text-xs text-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="shaded_panel_2">Panel 2 Shaded / Obstructed (Default)</option>
          <option value="normal">Optimal Sunlight (All 3 Normal)</option>
          <option value="thermal_alert">Thermal Surge (DS18B20 &gt; 58°C)</option>
          <option value="surface_crack">Surface Fracture / Crack (Wiper Locked)</option>
          <option value="sensor_fault">INA219 #3 Sensor Fault</option>
        </select>

        <button
          onClick={() => setIsDemoMode(false)}
          className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-2 py-1 rounded transition"
          title="Switch to Live Hardware Polling Mode"
        >
          Switch to Live Mode
        </button>
      </div>
    </div>
  );
}
