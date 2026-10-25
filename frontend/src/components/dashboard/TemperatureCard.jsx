import React from 'react';
import { Thermometer } from 'lucide-react';
import { formatTemperature } from '../../utils/formatters';
import { evaluateTemperature } from '../../utils/calculations';
import StatusBadge from '../common/StatusBadge';

export default function TemperatureCard({ temperature, maxThreshold = 55 }) {
  const evalResult = evaluateTemperature(temperature, maxThreshold);
  const isHigh = evalResult.status === 'warning' || evalResult.status === 'critical';

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm relative overflow-hidden flex flex-col justify-between ${
        isHigh ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-mono tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
            <Thermometer className={`w-4 h-4 ${isHigh ? 'text-rose-600 animate-pulse' : 'text-blue-600'}`} />
            DS18B20 Temperature
          </span>
          <StatusBadge status={evalResult.status} text={evalResult.status.toUpperCase()} size="xs" />
        </div>

        {/* Temperature Reading */}
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
              isHigh ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {formatTemperature(temperature)}
          </span>
          <span className="text-xs font-mono text-slate-500 font-medium">
            / {maxThreshold}°C limit
          </span>
        </div>

        {/* Status text */}
        <p className="text-xs text-slate-600 mt-2">
          {evalResult.message}
        </p>

        {/* Visual Thermal Gauge */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
            <span>20°C (Ambient)</span>
            <span className={temperature >= maxThreshold ? 'text-rose-600 font-bold' : 'font-semibold'}>
              Limit: {maxThreshold}°C
            </span>
            <span>80°C</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200 relative">
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
              style={{ left: `${((maxThreshold - 20) / 60) * 100}%` }}
              title={`Limit: ${maxThreshold}°C`}
            />
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHigh ? 'bg-rose-500 shadow-xs' : 'bg-blue-600'
              }`}
              style={{
                width: `${Math.max(5, Math.min(100, ((temperature - 20) / 60) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Pinout and sensor specs */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-mono">GPIO 4 • 4.7kΩ</span>
        <span className="text-blue-700 font-mono text-[10px] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
          1-Wire Probe
        </span>
      </div>
    </div>
  );
}
