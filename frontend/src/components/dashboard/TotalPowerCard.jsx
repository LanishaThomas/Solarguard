import React from 'react';
import { SunMedium, TrendingUp, BatteryCharging, Zap } from 'lucide-react';
import { formatPower } from '../../utils/formatters';

export default function TotalPowerCard({ totalPower, dailyYieldWh, panels }) {
  const maxSimulatedCapacity = 4.5; // 3x 1.5W panels nominal
  const powerPercentage = Math.min(100, Math.round((totalPower / maxSimulatedCapacity) * 100));

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/25 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <SunMedium className="w-4 h-4 text-emerald-400" /> Total Solar Generation
          </span>
          <span className="text-[10px] font-mono text-zinc-500">[Simulated Aggregate]</span>
        </div>

        {/* Big Power Number */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
            {formatPower(totalPower)}
          </span>
          <span className="text-xs font-mono text-emerald-400/90 font-medium">
            / {maxSimulatedCapacity}W rated
          </span>
        </div>

        {/* Capacity Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono">
            <span>Array Capacity</span>
            <span className="text-emerald-300 font-semibold">{powerPercentage}%</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-emerald-500/20">
            <div
              className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500 shadow-glow-green"
              style={{ width: `${powerPercentage}%` }}
            />
          </div>
        </div>

        {/* Breakdown bar between panels */}
        <div className="mt-4 pt-3 border-t border-emerald-500/15">
          <div className="text-[11px] text-zinc-400 mb-1.5 font-mono">Panel Contribution:</div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-black/40">
            {panels.map((p, idx) => {
              const share = totalPower > 0 ? (p.power_w / totalPower) * 100 : 33.3;
              const colors = ['bg-emerald-500', 'bg-teal-400', 'bg-cyan-500'];
              return (
                <div
                  key={p.id}
                  style={{ width: `${share}%` }}
                  className={`${colors[idx]} transition-all duration-500`}
                  title={`${p.name}: ${p.power_w.toFixed(2)}W (${share.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-mono text-zinc-400 text-center">
            {panels.map((p, idx) => (
              <div key={p.id} className="truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                P{p.id}: {p.power_w.toFixed(2)}W
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yield bottom metrics */}
      <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-1.5">
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-400">Est. Daily Yield:</span>
          <span className="font-mono font-bold text-emerald-300">{dailyYieldWh} Wh</span>
        </div>
        <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          3x INA219 Shunts
        </div>
      </div>
    </div>
  );
}
