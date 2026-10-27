import React from 'react';
import { Zap, Gauge, Thermometer, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatVoltage, formatCurrent, formatPower, formatTemperature } from '../../utils/formatters';
import { evaluatePanelHealth } from '../../utils/calculations';
import StatusBadge from '../common/StatusBadge';

export default function PanelCard({ panel, allPanels, settings, onSelect }) {
  const health = evaluatePanelHealth(panel, allPanels, settings);

  const isLow = health.status === 'warning' || health.status === 'critical';
  const isOffline = panel.status === 'offline';
  const maxVoltage = Math.max(...(allPanels || []).map((p) => p.voltage_v || 0), 0);
  const maxPower = Math.max(...(allPanels || []).map((p) => p.power_w || 0), 0);
  const isPeak = (maxPower >= 0.010 && panel.power_w === maxPower) || 
                 (maxVoltage >= 0.90 && panel.voltage_v === maxVoltage);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer flex flex-col justify-between border transition shadow-sm hover:shadow-md ${
        isOffline
          ? 'border-rose-300 bg-rose-50/50'
          : isLow
          ? 'border-amber-300 bg-amber-50/40'
          : isPeak
          ? 'border-amber-400/80 shadow-amber-100/50 hover:border-amber-500'
          : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${isPeak ? 'bg-amber-500 ring-2 ring-amber-300 animate-pulse' : 'bg-blue-600'}`} />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              {panel.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {isPeak && (
              <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-bold">
                PEAK LIGHT
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
              {panel.i2c_address}
            </span>
            <StatusBadge status={health.status} text={health.status.toUpperCase()} size="xs" />
          </div>
        </div>

        {/* Primary Metric: Power (W) */}
        <div className="mb-4 bg-gradient-to-br from-amber-50/80 to-blue-50/50 rounded-xl p-3 border border-amber-200/60">
          <div className="text-xs text-slate-600 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Output Power
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">INA219 Active</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900">
              {formatPower(panel.power_w)}
            </span>
            {health.deviationPercent !== 0 && (
              <span
                className={`text-xs font-mono font-bold ${
                  health.deviationPercent < 0 ? 'text-amber-600' : 'text-blue-600'
                }`}
              >
                {health.deviationPercent > 0 ? `+${health.deviationPercent}%` : `${health.deviationPercent}%`}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-1 truncate font-medium">
            {health.message}
          </div>
        </div>

        {/* Electrical Sensor Measurements (V, I, T) */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Voltage</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-blue-700 mt-0.5">
              {formatVoltage(panel.voltage_v)}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Current</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-slate-800 mt-0.5">
              {formatCurrent(panel.current_a)}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Back Temp</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-amber-600 mt-0.5">
              {formatTemperature(panel.temperature_c)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono text-slate-500">{panel.channel}</span>
        <span className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
          Detailed Analytics &rarr;
        </span>
      </div>
    </div>
  );
}

