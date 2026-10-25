import React from 'react';
import { SunMedium, BatteryCharging, Zap } from 'lucide-react';
import { formatPower } from '../../utils/formatters';

export default function TotalPowerCard({ totalPower, dailyYieldWh, panels }) {
  const maxRatedCapacity = 4.5; // 3x 1.5W physical panels nominal rating
  const powerPercentage = Math.min(100, Math.round((totalPower / maxRatedCapacity) * 100));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-1.5">
            <SunMedium className="w-4 h-4 text-amber-500" /> Total Solar Generation
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            Real Telemetry
          </span>
        </div>

        {/* Big Power Number */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-slate-900">
            {formatPower(totalPower)}
          </span>
          <span className="text-xs font-mono text-slate-500 font-medium">
            / {maxRatedCapacity}W rated
          </span>
        </div>

        {/* Capacity Bar in Solar Yellow */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
            <span>Array Output Ratio</span>
            <span className="text-amber-700 font-bold">{powerPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${powerPercentage}%` }}
            />
          </div>
        </div>

        {/* Breakdown bar between panels */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-600 mb-1.5 font-mono">Channel Contribution:</div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
            {panels.map((p, idx) => {
              const share = totalPower > 0 ? (p.power_w / totalPower) * 100 : 33.3;
              const colors = ['bg-amber-400', 'bg-blue-600', 'bg-amber-600'];
              return (
                <div
                  key={p.id}
                  style={{ width: `${share}%` }}
                  className={`${colors[idx % colors.length]} transition-all duration-500`}
                  title={`${p.name}: ${p.power_w.toFixed(2)}W (${share.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-mono text-slate-600 text-center font-medium">
            {panels.map((p, idx) => (
              <div key={p.id} className="truncate">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${idx === 1 ? 'bg-blue-600' : 'bg-amber-500'}`} />
                P{p.id}: {p.power_w.toFixed(2)}W
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yield bottom metrics */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-1.5">
          <BatteryCharging className="w-4 h-4 text-blue-600" />
          <span className="text-slate-600">Daily Yield:</span>
          <span className="font-mono font-bold text-slate-900">{dailyYieldWh} Wh</span>
        </div>
        <div className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          INA219 x3
        </div>
      </div>
    </div>
  );
}
