import React from 'react';
import { Zap, Gauge, Thermometer, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatVoltage, formatCurrent, formatPower, formatTemperature } from '../../utils/formatters';
import { evaluatePanelHealth } from '../../utils/calculations';
import StatusBadge from '../common/StatusBadge';

export default function PanelCard({ panel, allPanels, settings, onSelect }) {
  const health = evaluatePanelHealth(panel, allPanels, settings);

  const isLow = health.status === 'warning' || health.status === 'critical';
  const isOffline = panel.status === 'offline';

  return (
    <div
      onClick={onSelect}
      className={`glass-panel glass-card-interactive rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer flex flex-col justify-between ${
        isOffline
          ? 'border-rose-500/40 bg-rose-950/20'
          : isLow
          ? 'border-amber-500/40 bg-amber-950/20'
          : 'border-emerald-500/20 hover:border-emerald-400/40'
      }`}
    >
      {/* Background Solar Cell Grid Watermark */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-emerald-400">
          <rect x="5" y="5" width="40" height="40" rx="4" />
          <rect x="55" y="5" width="40" height="40" rx="4" />
          <rect x="5" y="55" width="40" height="40" rx="4" />
          <rect x="55" y="55" width="40" height="40" rx="4" />
        </svg>
      </div>

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
              {panel.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
              {panel.i2c_address}
            </span>
            <StatusBadge status={health.status} text={health.status.toUpperCase()} size="xs" />
          </div>
        </div>

        {/* Primary Metric: Power (W) */}
        <div className="mb-4 bg-black/40 rounded-xl p-3 border border-emerald-500/10">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Output Power
            </span>
            <span className="text-[10px] font-mono text-zinc-500">[Simulated INA219]</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-300">
              {formatPower(panel.power_w)}
            </span>
            {health.deviationPercent !== 0 && (
              <span
                className={`text-xs font-mono font-medium ${
                  health.deviationPercent < 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {health.deviationPercent > 0 ? `+${health.deviationPercent}%` : `${health.deviationPercent}%`}
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 truncate">
            {health.message}
          </div>
        </div>

        {/* Electrical Sensor Measurements (V, I, T) */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0b160f] p-2 rounded-lg border border-emerald-500/10">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Voltage</div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-zinc-200 mt-0.5">
              {formatVoltage(panel.voltage_v)}
            </div>
          </div>

          <div className="bg-[#0b160f] p-2 rounded-lg border border-emerald-500/10">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Current</div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-zinc-200 mt-0.5">
              {formatCurrent(panel.current_a)}
            </div>
          </div>

          <div className="bg-[#0b160f] p-2 rounded-lg border border-emerald-500/10">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Back Temp</div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-emerald-400 mt-0.5">
              {formatTemperature(panel.temperature_c)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-mono text-zinc-500">{panel.channel}</span>
        <span className="text-emerald-400/90 font-medium hover:underline flex items-center gap-1">
          Detailed Analytics &rarr;
        </span>
      </div>
    </div>
  );
}
