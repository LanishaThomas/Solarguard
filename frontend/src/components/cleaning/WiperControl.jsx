import { Waves, Play, RotateCcw, AlertTriangle, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Toggle from '../ui/Toggle.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

const WIPER_STATUS_META = {
  idle:     { label: 'Idle',     badge: 'normal',  color: 'text-green-400' },
  wiping:   { label: 'Wiping…', badge: 'info',    color: 'text-blue-400'  },
  cooldown: { label: 'Cooldown', badge: 'warning', color: 'text-yellow-400'},
  fault:    { label: 'Fault',    badge: 'error',   color: 'text-red-400'   },
}

export default function WiperControl({ compact = false }) {
  const { wiper, inspection, triggerWipe, toggleAutoClean } = useApp()
  const { status, autoMode, lastWipe } = wiper

  const meta      = WIPER_STATUS_META[status] ?? WIPER_STATUS_META.idle
  const canWipe   = status === 'idle'
  const lastWipeStr = lastWipe
    ? new Date(lastWipe).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'

  // Warn if trying to wipe a damaged panel
  const isDangerous = inspection?.predictedClass === 'crack_or_breakage'

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-900/50 rounded-md flex items-center justify-center">
            <Waves size={14} className="text-green-400" />
          </div>
          <span className="font-semibold text-white text-sm">Wiper Control</span>
        </div>
        <StatusBadge status={meta.badge} label={meta.label} />
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-3 bg-[#0d1710] rounded-lg px-3 py-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          status === 'wiping'   ? 'bg-blue-400 animate-pulse'  :
          status === 'cooldown' ? 'bg-yellow-400 animate-pulse':
          status === 'fault'    ? 'bg-red-400'                 :
          'bg-green-400'
        }`} />
        <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
        {status === 'wiping' && (
          <div className="ml-auto flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-1 h-4 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Damage warning */}
      {isDangerous && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-xs text-red-300">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Possible panel damage detected</p>
            <p className="text-red-400/70 mt-0.5">Automatic and manual wiping is not recommended while damage is suspected. Inspect the panel first.</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={triggerWipe}
          disabled={!canWipe || isDangerous}
          className="btn-primary flex items-center gap-2 flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'wiping' ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} />}
          {status === 'wiping' ? 'Wiping…' : 'Wipe Now'}
        </button>
      </div>

      {/* Auto mode toggle */}
      <div className="flex items-center justify-between bg-[#0d1710] rounded-lg px-3 py-2">
        <div>
          <p className="text-sm font-medium text-gray-300">Automatic Cleaning</p>
          <p className="text-xs text-gray-500 mt-0.5">Wipe when obstruction detected above confidence threshold</p>
        </div>
        <Toggle checked={autoMode} onChange={toggleAutoClean} disabled={isDangerous} />
      </div>

      {/* Last wipe */}
      {!compact && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={11} />
          <span>Last wipe: {lastWipeStr}</span>
        </div>
      )}
    </div>
  )
}
