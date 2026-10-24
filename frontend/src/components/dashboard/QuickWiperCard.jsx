import React from 'react';
import { RotateCw, ShieldCheck, AlertOctagon, Check, Play, Pause, Power } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function QuickWiperCard({ cleaningState, triggerWipe, emergencyStop, toggleAutoCleaning, onNavigate }) {
  const isWiping = cleaningState.status === 'wiping';
  const isCooldown = cleaningState.status === 'cooldown';
  const isStopped = cleaningState.status === 'stopped';

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCw className={`w-4 h-4 text-emerald-400 ${isWiping ? 'animate-spin' : ''}`} />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
              Cleaning Mechanism
            </h3>
          </div>
          <StatusBadge status={cleaningState.status} text={cleaningState.status.toUpperCase()} size="xs" />
        </div>

        {/* Cleaning State Status Box */}
        <div className="bg-black/40 rounded-xl p-3 border border-emerald-500/10 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-400 font-medium">SG90 Wiper Actuator:</span>
            <span className="font-mono text-emerald-400 text-xs">
              {isWiping ? `Sweeping (${cleaningState.progress}%)` : isCooldown ? `Cooldown (${cleaningState.cooldownRemaining}s)` : 'Standby'}
            </span>
          </div>

          {/* Progress bar during wipe */}
          <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-150 ${
                isWiping
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-glow-green'
                  : isCooldown
                  ? 'bg-amber-500'
                  : 'bg-emerald-700/40'
              }`}
              style={{
                width: isWiping
                  ? `${cleaningState.progress}%`
                  : isCooldown
                  ? `${(cleaningState.cooldownRemaining / 45) * 100}%`
                  : '100%',
              }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1.5">
            <span>Range: 15° - 165°</span>
            <span>Duration: 1.8s</span>
          </div>
        </div>

        {/* Automatic Cleaning Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-4">
          <div>
            <div className="text-xs font-semibold text-zinc-200">Auto-Cleaning (ML Triggered)</div>
            <div className="text-[10px] text-zinc-400">Wipe when dust or leaves are detected</div>
          </div>
          <button
            onClick={toggleAutoCleaning}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
              cleaningState.autoCleaningEnabled ? 'bg-emerald-600' : 'bg-zinc-800 border border-zinc-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                cleaningState.autoCleaningEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => triggerWipe('Manual Dashboard Action')}
            disabled={isWiping || isCooldown}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-heading font-medium text-xs sm:text-sm transition-all shadow-glow-green ${
              isWiping || isCooldown
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${isWiping ? 'animate-spin' : ''}`} />
            <span>
              {isWiping ? 'Wiper in Motion...' : isCooldown ? `Cooldown (${cleaningState.cooldownRemaining}s)` : 'Wipe Now'}
            </span>
          </button>

          <button
            onClick={emergencyStop}
            className="px-3 py-2.5 rounded-xl font-medium text-xs bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5"
            title="Emergency Motor Stop"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">E-Stop</span>
          </button>
        </div>

        <button
          onClick={onNavigate}
          className="w-full text-center text-[11px] text-emerald-400/90 hover:underline pt-1 block"
        >
          View Wiper Visualizer &amp; Sweep Logs &rarr;
        </button>
      </div>
    </div>
  );
}
