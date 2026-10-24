import React from 'react';
import { Camera, CheckCircle2, AlertTriangle, ShieldX, Sparkles, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SurfaceInspectionSnippet({ inspection, onNavigate }) {
  const preset = inspection.preset || {};
  const isCrack = preset.isDamage;
  const isClean = preset.className === 'clean';

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
              Surface Inspection AI
            </h3>
          </div>
          <StatusBadge
            status={isCrack ? 'critical' : isClean ? 'optimal' : 'warning'}
            text={preset.className ? preset.className.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}
            size="xs"
          />
        </div>

        {/* Visual Panel Surface Mini Preview */}
        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-[#0c1810] border border-emerald-500/20 mb-3 flex items-center justify-center p-2">
          {/* Simulated Solar Panel Cells Grid */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1 p-2 opacity-30 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-emerald-400/20 rounded border border-emerald-500/30" />
            ))}
          </div>

          {/* Condition Visual Overlay */}
          {preset.svgType === 'leaf' && (
            <div className="relative z-10 flex flex-col items-center text-amber-400">
              <span className="text-3xl animate-bounce">🍂</span>
              <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded mt-1 text-amber-300 border border-amber-500/40">
                Leaf Debris on Panel 2
              </span>
            </div>
          )}

          {preset.svgType === 'clean' && (
            <div className="relative z-10 flex flex-col items-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shadow-glow-green" />
              <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded mt-1 text-emerald-300 border border-emerald-500/40">
                Surface Clear &amp; High Reflectivity
              </span>
            </div>
          )}

          {preset.svgType === 'dust' && (
            <div className="relative z-10 flex flex-col items-center text-yellow-300">
              <div className="w-16 h-12 bg-yellow-600/30 rounded-lg blur-xs flex items-center justify-center border border-yellow-500/30">
                <span className="text-xs font-mono text-yellow-200">Dust Film</span>
              </div>
              <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded mt-1 text-yellow-300 border border-yellow-500/40">
                Particulate Accumulation
              </span>
            </div>
          )}

          {preset.svgType === 'droppings' && (
            <div className="relative z-10 flex flex-col items-center text-rose-300">
              <span className="text-2xl">⚠️</span>
              <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded mt-1 text-rose-300 border border-rose-500/40">
                Opaque Soiling
              </span>
            </div>
          )}

          {preset.svgType === 'crack' && (
            <div className="relative z-10 flex flex-col items-center text-rose-400">
              <ShieldX className="w-8 h-8 text-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono bg-rose-950 px-2 py-0.5 rounded mt-1 text-rose-200 border border-rose-500/40">
                FRACTURE: AUTO-WIPER LOCKED
              </span>
            </div>
          )}
        </div>

        {/* Prediction & Confidence */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-zinc-400">Classification:</span>
            <span className="font-semibold text-emerald-300">{preset.title}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-zinc-400">Confidence Score:</span>
            <span className="font-mono text-emerald-400">
              {Math.round((preset.confidence || 0.9) * 100)}%
            </span>
          </div>

          {/* Confidence Bar */}
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${isCrack ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.round((preset.confidence || 0.9) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-500/10">
        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-between text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>Open Full Vision Camera Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
