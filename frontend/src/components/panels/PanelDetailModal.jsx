import { X, Zap, Gauge, Activity, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import StatusBadge from '../ui/StatusBadge.jsx'

export default function PanelDetailModal({ panel, onClose }) {
  if (!panel) return null

  const { name, voltage, current, power, status, statusLabel, history } = panel

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111a14] border border-[#1f3027] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1f3027]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-900/50 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{name}</h2>
              <StatusBadge status={status} label={status === 'normal' ? 'Normal' : 'Warning'} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f3027] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Live readings */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap,      label: 'Voltage', value: `${voltage.toFixed(2)} V` },
              { icon: Gauge,    label: 'Current', value: `${current.toFixed(3)} A` },
              { icon: Activity, label: 'Power',   value: `${power.toFixed(3)} W` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card text-center">
                <Icon size={16} className="text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-base font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Status note */}
          {status !== 'normal' && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-sm text-yellow-300">
              ⚠ {statusLabel}
            </div>
          )}

          {/* Power history chart */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-sm font-medium text-gray-300">Power History (last 20 readings)</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f3027" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} unit=" W" width={45} />
                  <Tooltip
                    contentStyle={{ background: '#162119', border: '1px solid #1f3027', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="power"   stroke="#22c55e" strokeWidth={2} dot={false} name="Power (W)"   />
                  <Line type="monotone" dataKey="voltage" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Voltage (V)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
