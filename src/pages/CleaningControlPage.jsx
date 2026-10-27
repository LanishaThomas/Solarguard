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
    panels,
    systemStatus
  } = useSolarGuard();

  const isWiping = cleaningState?.status === 'wiping';
  const isCooldown = cleaningState?.status === 'cooldown';
  const isStopped = cleaningState?.status === 'stopped';
  const isDamage = Boolean(inspection?.preset?.isDamage);
  const isEsp32Connected = Boolean(systemStatus?.esp32?.connected);

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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-medium">
            <span className={`w-2 h-2 rounded-full ${isEsp32Connected ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>ESP32 (GPIO 18): {isEsp32Connected ? 'EMQX Synced' : 'Ready'}</span>
          </div>
          <StatusBadge status={cleaningState?.status || 'idle'} text={(cleaningState?.status || 'IDLE').toUpperCase()} size="md" />
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
