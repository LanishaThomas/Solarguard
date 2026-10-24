import React from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  RotateCw, 
  Power, 
  ShieldCheck, 
  ShieldAlert, 
  AlertOctagon, 
  Sliders, 
  Timer, 
  CheckCircle2, 
  History,
  Info
} from 'lucide-react';
import { formatDateFull } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

export default function CleaningControlPage() {
  const { 
    cleaningState, 
    triggerWipe, 
    emergencyStop, 
    resetWiperFault, 
    toggleAutoCleaning, 
    inspection,
    settings,
    panels 
  } = useSolarGuard();

  const isWiping = cleaningState.status === 'wiping';
  const isCooldown = cleaningState.status === 'cooldown';
  const isStopped = cleaningState.status === 'stopped';
  const isDamage = inspection.preset?.isDamage;

  // Calculate wiper arm position on the 3 panels (from 10% to 90% across the container)
  const wiperPositionPercent = isWiping
    ? 10 + (cleaningState.progress / 100) * 80
    : 10;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            SG90 Wiper Control &amp; Mechanical Actuator Center
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Automated and manual sweep actuation with thermal cooldown, servo torque safety, and emergency cut-off
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <StatusBadge status={cleaningState.status} text={cleaningState.status.toUpperCase()} size="md" />
        </div>
      </div>

      {/* Main Interactive Wiper Visualizer */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border-emerald-500/25 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <RotateCw className={`w-5 h-5 text-emerald-400 ${isWiping ? 'animate-spin' : ''}`} />
            <h3 className="font-heading font-semibold text-lg text-zinc-100">
              Interactive 3-Panel Wiper Array
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-400">PWM Servo GPIO 18</span>
            <span className="text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
              5V External Supply
            </span>
          </div>
        </div>

        {/* Visual 3-Panel Physical Representation with Animated Wiper */}
        <div className="relative w-full h-56 sm:h-64 rounded-xl bg-gradient-to-b from-[#09160d] to-[#061009] border border-emerald-500/30 p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
          {/* Top Rail Bar */}
          <div className="w-full h-3 bg-zinc-800 rounded-full border border-zinc-700 relative">
            <div className="absolute inset-y-0 left-0 bg-emerald-500/30 rounded-full w-full" />
          </div>

          {/* 3 Physical Mini Solar Panels Layout */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 my-auto z-10">
            {panels.map((panel) => {
              const isP2 = panel.id === 2;
              return (
                <div
                  key={panel.id}
                  className="relative h-28 sm:h-32 rounded-xl bg-[#0e2417] border-2 border-emerald-500/40 p-2 sm:p-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">
                      {panel.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded">
                      {panel.power_w.toFixed(2)}W
                    </span>
                  </div>

                  {/* Photovoltaic Cells */}
                  <div className="grid grid-cols-3 grid-rows-2 gap-1 h-14 opacity-60">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-emerald-400/20 rounded-xs border border-emerald-400/30" />
                    ))}
                  </div>

                  {/* Surface condition indicator on Panel 2 */}
                  {isP2 && inspection.preset?.svgType === 'leaf' && (
                    <div className="absolute inset-0 bg-amber-950/40 rounded-xl flex items-center justify-center pointer-events-none">
                      <span className="text-2xl animate-bounce">🍂</span>
                    </div>
                  )}

                  {isP2 && inspection.preset?.isDamage && (
                    <div className="absolute inset-0 bg-rose-950/60 rounded-xl flex items-center justify-center pointer-events-none border border-rose-500">
                      <span className="text-xl">⚡</span>
                    </div>
                  )}

                  <div className="text-[9px] text-center font-mono text-zinc-400">
                    INA219 @ {panel.i2c_address}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wiper Squeegee Blade & Carriage Moving Across the Panels */}
          <div
            className="absolute top-2 bottom-3 w-5 transition-all duration-100 ease-linear z-30 pointer-events-none flex flex-col items-center"
            style={{ left: `${wiperPositionPercent}%` }}
          >
            {/* Wiper Motor Mount Carriage */}
            <div className="w-5 h-5 rounded-md bg-emerald-500 border border-white shadow-glow-green flex items-center justify-center">
              <RotateCw className={`w-3 h-3 text-black ${isWiping ? 'animate-spin' : ''}`} />
            </div>
            {/* Wiper Soft Silicone Blade */}
            <div className="w-2 flex-1 bg-gradient-to-b from-emerald-400 via-teal-300 to-cyan-400 rounded-full shadow-[0_0_12px_#34d399] opacity-95 my-1" />
            {/* Wiper tip */}
            <div className="w-4 h-2 bg-zinc-900 rounded-b-md border border-emerald-500/40" />
          </div>

          {/* Bottom Guide Track */}
          <div className="w-full h-2 bg-zinc-800 rounded-full border border-zinc-700 mt-2" />
        </div>

        {/* Real-time Wiper Progress & Status Banner */}
        <div className="mt-4 p-3 rounded-xl bg-black/40 border border-emerald-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">Current Actuator Status:</span>
            <span className="font-mono font-bold text-emerald-300">
              {isWiping
                ? `Wiping Sweep in Motion — ${cleaningState.progress}% Completed`
                : isCooldown
                ? `Resting in Cooldown — ${cleaningState.cooldownRemaining}s remaining`
                : isStopped
                ? 'EMERGENCY STOPPED'
                : 'Idle — Wiper Stationed at 15° Home'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-zinc-400 text-[11px]">
            <span>Last Sweep:</span>
            <span className="text-zinc-200">{formatDateFull(cleaningState.lastCleaned)}</span>
          </div>
        </div>
      </div>

      {/* Control Panels & Safety Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Actuation Controls */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20 space-y-4">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> Wiper Command Center
          </h3>

          {/* Auto-cleaning card */}
          <div className="p-4 rounded-xl bg-[#0b1710] border border-emerald-500/15 flex items-center justify-between">
            <div>
              <div className="font-heading font-semibold text-zinc-200 text-sm">
                Rule-Based Auto-Cleaning
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Automatically activates wiper when dust or leaves are detected above 85% confidence
              </div>
            </div>

            <button
              onClick={toggleAutoCleaning}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                cleaningState.autoCleaningEnabled ? 'bg-emerald-600' : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                  cleaningState.autoCleaningEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => triggerWipe('Manual Wiper Page')}
              disabled={isWiping || isCooldown || isDamage}
              className={`w-full py-3 px-4 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 transition ${
                isDamage
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 cursor-not-allowed'
                  : isWiping || isCooldown
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green'
              }`}
            >
              <RotateCw className={`w-4 h-4 ${isWiping ? 'animate-spin' : ''}`} />
              <span>
                {isDamage
                  ? 'CANNOT WIPE: Surface Crack Detected'
                  : isWiping
                  ? `Sweeping Across Panels (${cleaningState.progress}%)`
                  : isCooldown
                  ? `Cooldown Active (${cleaningState.cooldownRemaining}s)`
                  : 'Execute Manual Sweep (1.8s)'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={emergencyStop}
                className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Power className="w-3.5 h-3.5 text-rose-400" /> Emergency Cut-Off
              </button>

              <button
                onClick={resetWiperFault}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-heading text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                Reset Fault / Standby
              </button>
            </div>
          </div>
        </div>

        {/* Right: Hardware Safety & Electrical Rules */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20 space-y-3">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hardware Safety Pre-Flight
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/10 flex items-center justify-between">
              <span className="text-zinc-300">Surface Damage Lock:</span>
              {isDamage ? (
                <span className="text-rose-400 font-semibold font-mono flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> ENGAGED (Wiping Blocked)
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Clear (Safe to Wipe)
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/10 flex items-center justify-between">
              <span className="text-zinc-300">Dedicated 5V Supply Isolation:</span>
              <span className="text-emerald-400 font-semibold font-mono">
                Unified GND / Isolated 5V Rail
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/10 flex items-center justify-between">
              <span className="text-zinc-300">Servo Sweep Bounds:</span>
              <span className="text-emerald-400 font-mono">
                {settings.minSweepAngle}° min ➔ {settings.maxSweepAngle}° max
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/10 flex items-center justify-between">
              <span className="text-zinc-300">Overheat Cooldown Protection:</span>
              <span className="text-emerald-400 font-mono">
                {settings.wiperCooldownSec}s mandatory pause
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed">
            <strong>Power Safety Note:</strong> To prevent ESP32 brownout reboots during servo stall or inrush current, the SG90 is driven via an external regulated 5V power supply with a shared ground reference.
          </div>
        </div>
      </div>

      {/* Cleaning History Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-semibold text-base text-zinc-100">
              Wiper Cleaning Audit Trail
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Recorded Sweep Operations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-500/15 text-zinc-400">
                <th className="pb-2 font-medium">Log ID</th>
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Trigger Type</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Sweep Arc</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Telemetry Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {cleaningState.history.map((log) => (
                <tr key={log.id} className="hover:bg-emerald-950/20">
                  <td className="py-2.5 font-bold text-emerald-400">{log.id}</td>
                  <td className="py-2.5 text-zinc-400">{formatDateFull(log.timestamp)}</td>
                  <td className="py-2.5 font-sans font-semibold text-zinc-200">{log.triggerType}</td>
                  <td className="py-2.5">{log.durationMs} ms</td>
                  <td className="py-2.5 text-emerald-300">{log.sweepAngle}</td>
                  <td className="py-2.5">
                    <StatusBadge status="completed" text={log.status} size="xs" />
                  </td>
                  <td className="py-2.5 text-zinc-400 font-sans text-[11px]">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
