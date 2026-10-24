import React from 'react';
import { calculateMedian } from '../../utils/calculations';
import { formatPower } from '../../utils/formatters';
import { Scale, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PeerComparisonWidget({ panels, settings }) {
  const powers = panels.map((p) => p.power_w);
  const medianPower = calculateMedian(powers);
  const dropRatio = settings.peerDropThreshold || 0.70;
  const minSunlight = settings.minSunlightThresholdW || 0.20;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
            Peer-Panel Median Comparison Logic
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
          Rule: Power &lt; {(dropRatio * 100).toFixed(0)}% of Median
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-4">
        According to the SolarGuard specification, INA219 readings cannot distinguish between shadows, angle, or soiling. The system compares each panel against the <strong>median power ({formatPower(medianPower)})</strong> of all three panels under uniform daylight.
      </p>

      {/* Median Calculation Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {panels.map((panel) => {
          const diff = medianPower > 0 ? ((panel.power_w - medianPower) / medianPower) * 100 : 0;
          const isBelowThreshold = panel.power_w < medianPower * dropRatio;
          const isSunlightAdequate = medianPower >= minSunlight;

          return (
            <div
              key={panel.id}
              className={`p-3.5 rounded-xl border transition ${
                isBelowThreshold && isSunlightAdequate
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]'
                  : 'bg-[#0d1c13] border-emerald-500/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-semibold text-xs text-zinc-200">
                  {panel.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{panel.i2c_address}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-white">
                  {formatPower(panel.power_w)}
                </span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    diff < 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                </span>
              </div>

              {/* Progress bar vs median */}
              <div className="mt-2">
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isBelowThreshold && isSunlightAdequate ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(5, (panel.power_w / (medianPower * 1.3 || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-800 text-[10px] flex items-center justify-between">
                <span className="text-zinc-400">Diagnosis:</span>
                <span
                  className={`font-semibold ${
                    isBelowThreshold && isSunlightAdequate ? 'text-amber-300' : 'text-emerald-300'
                  }`}
                >
                  {isBelowThreshold && isSunlightAdequate ? 'Output Anomaly' : 'Peer Tolerant'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/10 text-xs text-zinc-400 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-zinc-200 font-semibold">Minimum Illumination Baseline: </span>
          The median comparison rule is dynamically gated when median power drops below <strong>{minSunlight}W</strong> (dusk/clouds), preventing simultaneous false alarms across all panels.
        </div>
      </div>
    </div>
  );
}
