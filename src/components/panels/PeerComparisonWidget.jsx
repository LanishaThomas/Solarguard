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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-600" />
          <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
            Peer-Panel Median Comparison Logic
          </h3>
        </div>
        <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-semibold">
          Rule: Power &lt; {(dropRatio * 100).toFixed(0)}% of Median
        </span>
      </div>

      <p className="text-xs text-slate-600 mb-4 font-medium">
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
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-semibold text-xs text-slate-900">
                  {panel.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">{panel.i2c_address}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-slate-900">
                  {formatPower(panel.power_w)}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    diff < 0 ? 'text-amber-600' : 'text-blue-600'
                  }`}
                >
                  {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                </span>
              </div>

              {/* Progress bar vs median */}
              <div className="mt-2">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isBelowThreshold && isSunlightAdequate ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(5, (panel.power_w / (medianPower * 1.3 || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500 font-medium">Diagnosis:</span>
                <span
                  className={`font-semibold ${
                    isBelowThreshold && isSunlightAdequate ? 'text-amber-700' : 'text-blue-700'
                  }`}
                >
                  {isBelowThreshold && isSunlightAdequate ? 'Output Anomaly' : 'Peer Tolerant'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-2 font-medium">
        <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-900 font-semibold">Minimum Illumination Baseline: </span>
          The median comparison rule is dynamically gated when median power drops below <strong>{minSunlight}W</strong> (dusk/clouds), preventing simultaneous false alarms across all panels.
        </div>
      </div>
    </div>
  );
}
