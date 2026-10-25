import React from 'react';
import { RotateCw, ShieldCheck, AlertOctagon, Check, Play, Pause, Power } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function QuickWiperCard({ cleaningState, triggerWipe, emergencyStop, toggleAutoCleaning, onNavigate }) {
  const isWiping = cleaningState.status === 'wiping';
  const isCooldown = cleaningState.status === 'cooldown';
  const isStopped = cleaningState.status === 'stopped';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCw className={`w-4 h-4 text-blue-600 ${isWiping ? 'animate-spin' : ''}`} />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              Cleaning Mechanism
            </h3>
          </div>
          <StatusBadge status={cleaningState.status} text={cleaningState.status.toUpperCase()} size="xs" />
        </div>

        {/* Cleaning State Status Box */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">SG90 Wiper Actuator:</span>
            <span className="font-mono text-blue-700 font-semibold text-xs">
              {isWiping ? `Sweeping (${cleaningState.progress}%)` : isCooldown ? `Cooldown (${cleaningState.cooldownRemaining}s)` : 'Standby'}
            </span>
          </div>

          {/* Progress bar during wipe */}
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
            <div
              className={`h-full transition-all duration-150 ${
                isWiping
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-blue-600'
                  : isCooldown
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
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

          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5 font-medium">
            <span>Range: 15° - 165°</span>
            <span>Duration: 1.8s</span>
          </div>
        </div>

        {/* Automatic Cleaning Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100 mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-900">Auto-Cleaning (ML Triggered)</div>
            <div className="text-[11px] text-slate-600">Wipe when dust or leaves are detected</div>
          </div>
          <button
            onClick={toggleAutoCleaning}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
              cleaningState.autoCleaningEnabled ? 'bg-blue-600' : 'bg-slate-300 border border-slate-400'
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-heading font-medium text-xs sm:text-sm transition-all shadow-sm ${
              isWiping || isCooldown
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white font-semibold'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${isWiping ? 'animate-spin' : ''}`} />
            <span>
              {isWiping ? 'Wiper in Motion...' : isCooldown ? `Cooldown (${cleaningState.cooldownRemaining}s)` : 'Wipe Now'}
            </span>
          </button>

          <button
            onClick={emergencyStop}
            className="px-3 py-2.5 rounded-xl font-medium text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5"
            title="Emergency Motor Stop"
          >
            <Power className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">E-Stop</span>
          </button>
        </div>

        <button
          onClick={onNavigate}
          className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-1 block"
        >
          View Wiper Visualizer &amp; Sweep Logs &rarr;
        </button>
      </div>
    </div>
  );
}

