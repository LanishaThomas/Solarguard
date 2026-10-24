import { Zap, Gauge, Activity } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge.jsx'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  YAxis,
} from 'recharts'

export default function PanelCard({ panel, onClick }) {
  const { id, name, voltage, current, power, status, statusLabel, history } = panel

  const statusColor = {
    normal:  'border-green-800/50',
    warning: 'border-yellow-700/60',
    error:   'border-red-700/60',
  }[status] ?? 'border-[#1f3027]'

  const sparkColor = {
    normal:  '#22c55e',
    warning: '#facc15',
    error:   '#f87171',
  }[status] ?? '#22c55e'

  return (
    <button
      onClick={onClick}
      className={`card border-2 ${statusColor} flex flex-col gap-3 text-left hover:bg-[#1a2a1e] transition-colors w-full focus:outline-none focus:ring-2 focus:ring-green-500`}
      aria-label={`${name} details`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-900/50 rounded-md flex items-center justify-center">
            <Zap size={14} className="text-green-400" />
          </div>
          <span className="font-semibold text-white text-sm">{name}</span>
        </div>
        <StatusBadge status={status} label={status === 'normal' ? 'Normal' : status === 'warning' ? 'Warning' : 'Error'} />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={Zap} label="Voltage" value={voltage.toFixed(2)} unit="V" />
        <Metric icon={Gauge} label="Current" value={current.toFixed(3)} unit="A" />
        <Metric icon={Activity} label="Power" value={power.toFixed(3)} unit="W" highlight />
      </div>

      {/* Spark chart */}
      <div className="h-16 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history.slice(-12)} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip
              contentStyle={{ background: '#162119', border: '1px solid #1f3027', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: sparkColor }}
              formatter={v => [`${v} W`, 'Power']}
            />
            <Line
              type="monotone"
              dataKey="power"
              stroke={sparkColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status label */}
      {status !== 'normal' && (
        <p className="text-xs text-yellow-300/80 bg-yellow-900/20 rounded-lg px-2 py-1 leading-snug">
          ⚠ {statusLabel}
        </p>
      )}
    </button>
  )
}

function Metric({ label, value, unit, highlight }) {
  return (
    <div className="bg-[#0d1710] rounded-lg px-2 py-1.5 flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-green-300' : 'text-white'}`}>
        {value}<span className="text-[10px] text-gray-400 font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  )
}
