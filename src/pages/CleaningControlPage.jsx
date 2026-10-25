import React from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  RotateCw, 
  Power, 
  ShieldCheck, 
  ShieldAlert, 
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
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
            SG90 Wiper Control &amp; Mechanical Actuator Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Automated and manual sweep actuation with thermal cooldown, servo torque safety, and emergency cut-off
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <StatusBadge status={cleaningState.status} text={cleaningState.status.toUpperCase()} size="md" />
        </div>
      </div>

      {/* Main Interactive Wiper Visualizer */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <RotateCw className={`w-5 h-5 text-blue-600 ${isWiping ? 'animate-spin' : ''}`} />
            <h3 className="font-heading font-semibold text-lg text-slate-900">
              Interactive 3-Panel Wiper Array
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 font-medium">PWM Servo GPIO 18</span>
            <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-semibold">
              5V External Supply
            </span>
          </div>
        </div>

        {/* Visual 3-Panel Physical Representation with Animated Wiper */}
        <div className="relative w-full h-56 sm:h-64 rounded-xl bg-slate-100 border border-slate-300 p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
          {/* Top Rail Bar */}
          <div className="w-full h-3 bg-slate-300 rounded-full border border-slate-400 relative">
            <div className="absolute inset-y-0 left-0 bg-blue-500/20 rounded-full w-full" />
          </div>

          {/* 3 Physical Solar Panels Layout */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 my-auto z-10">
            {panels.map((panel) => {
              return (
                <div
                  key={panel.id}
                  className="relative h-28 sm:h-32 rounded-xl bg-gradient-to-b from-blue-900 to-slate-900 border-2 border-blue-600 p-2 sm:p-3 flex flex-col justify-between shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-200 font-bold">
                      {panel.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-black/60 px-1.5 py-0.5 rounded font-bold">
                      {panel.power_w.toFixed(2)}W
                    </span>
                  </div>

                  {/* Photovoltaic Cells */}
                  <div className="grid grid-cols-3 grid-rows-2 gap-1 h-14 opacity-50">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-blue-400/20 rounded-xs border border-blue-400/40" />
                    ))}
                  </div>

                  <div className="text-[10px] text-center font-mono text-blue-200/80 font-medium">
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
            <div className="w-5 h-5 rounded-md bg-amber-400 border border-amber-600 shadow-md flex items-center justify-center">
              <RotateCw className={`w-3 h-3 text-slate-900 ${isWiping ? 'animate-spin' : ''}`} />
            </div>
            {/* Wiper Soft Silicone Blade */}
            <div className="w-2 flex-1 bg-amber-400 rounded-full shadow-md my-1 border border-amber-500" />
            {/* Wiper tip */}
            <div className="w-4 h-2 bg-blue-600 rounded-b-md border border-blue-700" />
          </div>

          {/* Bottom Guide Track */}
          <div className="w-full h-2 bg-slate-300 rounded-full border border-slate-400 mt-2" />
        </div>

        {/* Real-time Wiper Progress & Status Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600 font-medium">Current Actuator Status:</span>
            <span className="font-mono font-bold text-slate-900">
              {isWiping
                ? `Wiping Sweep in Motion — ${cleaningState.progress}% Completed`
                : isCooldown
                ? `Resting in Cooldown — ${cleaningState.cooldownRemaining}s remaining`
                : isStopped
                ? 'EMERGENCY STOPPED'
                : 'Idle — Wiper Stationed at 15° Home'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-slate-500 text-xs">
            <span>Last Sweep:</span>
            <span className="text-slate-800 font-semibold">{formatDateFull(cleaningState.lastCleaned)}</span>
          </div>
        </div>
      </div>

      {/* Control Panels & Safety Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Actuation Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" /> Wiper Command Center
          </h3>

          {/* Auto-cleaning card */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="font-heading font-semibold text-slate-900 text-sm">
                Rule-Based Auto-Cleaning
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Automatically activates wiper when dust or debris are detected above 85% confidence
              </div>
            </div>

            <button
              onClick={toggleAutoCleaning}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                cleaningState.autoCleaningEnabled ? 'bg-blue-600' : 'bg-slate-300 border border-slate-400'
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
                  ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                  : isWiping || isCooldown
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
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
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Power className="w-3.5 h-3.5 text-rose-600" /> Emergency Cut-Off
              </button>

              <button
                onClick={resetWiperFault}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                Reset Fault / Standby
              </button>
            </div>
          </div>
        </div>

        {/* Right: Hardware Safety & Electrical Rules */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Hardware Safety Pre-Flight
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Surface Damage Lock:</span>
              {isDamage ? (
                <span className="text-rose-600 font-semibold font-mono flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> ENGAGED (Wiping Blocked)
                </span>
              ) : (
                <span className="text-blue-700 font-semibold font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Clear (Safe to Wipe)
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Dedicated 5V Supply Isolation:</span>
              <span className="text-blue-700 font-semibold font-mono">
                Unified GND / Isolated 5V Rail
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Servo Sweep Bounds:</span>
              <span className="text-slate-900 font-mono font-semibold">
                {settings.minSweepAngle}° min ➔ {settings.maxSweepAngle}° max
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Overheat Cooldown Protection:</span>
              <span className="text-amber-600 font-mono font-semibold">
                {settings.wiperCooldownSec}s mandatory pause
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 leading-relaxed font-medium">
            <strong className="text-blue-900">Power Safety Note:</strong> To prevent ESP32 brownout reboots during servo inrush current, the SG90 is driven via an external regulated 5V power supply with a shared ground reference.
          </div>
        </div>
      </div>

      {/* Cleaning History Table */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-semibold text-base text-slate-900">
              Wiper Cleaning Audit Trail
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            MongoDB Cleaning Logs
          </span>
        </div>

        {cleaningState.history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No cleaning sweep operations recorded yet. Execute a manual sweep or enable auto-cleaning.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-semibold">Log ID</th>
                  <th className="pb-2 font-semibold">Timestamp</th>
                  <th className="pb-2 font-semibold">Trigger Type</th>
                  <th className="pb-2 font-semibold">Duration</th>
                  <th className="pb-2 font-semibold">Sweep Arc</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Telemetry Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cleaningState.history.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-blue-700">{log.id}</td>
                    <td className="py-2.5 text-slate-500">{formatDateFull(log.timestamp)}</td>
                    <td className="py-2.5 font-sans font-semibold text-slate-900">{log.triggerType}</td>
                    <td className="py-2.5">{log.durationMs} ms</td>
                    <td className="py-2.5 text-amber-600 font-bold">{log.sweepAngle}</td>
                    <td className="py-2.5">
                      <StatusBadge status="completed" text={log.status} size="xs" />
                    </td>
                    <td className="py-2.5 text-slate-600 font-sans text-xs">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
