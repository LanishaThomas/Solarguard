import React from 'react';
import { Thermometer, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatTemperature } from '../../utils/formatters';
import { evaluateTemperature } from '../../utils/calculations';
import StatusBadge from '../common/StatusBadge';

export default function TemperatureCard({ temperature, maxThreshold = 55 }) {
  const evalResult = evaluateTemperature(temperature, maxThreshold);
  const isHigh = evalResult.status === 'warning' || evalResult.status === 'critical';

  return (
    <div
      className={`glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between ${
        isHigh ? 'border-rose-500/40 bg-rose-950/20' : 'border-emerald-500/25'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Thermometer className={`w-4 h-4 ${isHigh ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            DS18B20 Temperature
          </span>
          <StatusBadge status={evalResult.status} text={evalResult.status.toUpperCase()} size="xs" />
        </div>

        {/* Temperature Reading */}
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
              isHigh ? 'text-rose-400' : 'text-emerald-300'
            }`}
          >
            {formatTemperature(temperature)}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            / {maxThreshold}°C limit
          </span>
        </div>

        {/* Status text */}
        <p className="text-xs text-zinc-400 mt-2">
          {evalResult.message}
        </p>

        {/* Visual Thermal Gauge */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
            <span>20°C (Ambient)</span>
            <span className={temperature >= maxThreshold ? 'text-rose-400 font-bold' : ''}>
              Threshold: {maxThreshold}°C
            </span>
            <span>80°C</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800 relative">
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
              style={{ left: `${((maxThreshold - 20) / 60) * 100}%` }}
              title={`Limit: ${maxThreshold}°C`}
            />
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHigh ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.max(5, Math.min(100, ((temperature - 20) / 60) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Pinout and sensor specs */}
      <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-mono">GPIO 4 • 4.7kΩ Pullup</span>
        <span className="text-emerald-400/90 font-mono text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          Waterproof Probe
        </span>
      </div>
    </div>
  );
}
