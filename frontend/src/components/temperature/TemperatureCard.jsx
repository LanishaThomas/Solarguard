import { Thermometer, AlertTriangle } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { useApp } from '../../context/AppContext.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

export default function TemperatureCard({ compact = false }) {
  const { temperature, settings } = useApp()
  const { current, status, history } = temperature
  const threshold = settings.tempAlertCelsius

  const tempColor = status === 'warning' ? '#f59e0b' : status === 'critical' ? '#ef4444' : '#22c55e'
  const pct = Math.min(100, Math.round((current / threshold) * 100))

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-900/50 rounded-md flex items-center justify-center">
            <Thermometer size={14} className="text-green-400" />
          </div>
          <span className="font-semibold text-white text-sm">Panel Temperature</span>
        </div>
        <StatusBadge
          status={status === 'normal' ? 'normal' : 'warning'}
          label={status === 'normal' ? 'Normal' : 'High Temp'}
        />
      </div>

      {/* Big reading + gauge */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-4xl font-bold" style={{ color: tempColor }}>{current.toFixed(1)}</span>
          <span className="text-lg text-gray-400 ml-1">°C</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>0°C</span>
            <span className="text-yellow-400">Limit: {threshold}°C</span>
          </div>
          <div className="h-3 bg-[#1f3027] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(to right, #22c55e, ${tempColor})`,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{pct}% of alert threshold</p>
        </div>
      </div>

      {/* Alert message */}
      {status !== 'normal' && (
        <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-2 text-xs text-yellow-300">
          <AlertTriangle size={12} />
          <span>Temperature above configured limit ({threshold}°C). Monitor closely.</span>
        </div>
      )}

      {/* Chart — only on non-compact view */}
      {!compact && (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tempColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={tempColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3027" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval={5} />
              <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} unit="°C" width={38} />
              <Tooltip
                contentStyle={{ background: '#162119', border: '1px solid #1f3027', borderRadius: 8, fontSize: 11 }}
                itemStyle={{ color: tempColor }}
                formatter={v => [`${v} °C`, 'Temp']}
              />
              <ReferenceLine y={threshold} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Limit', fill: '#f59e0b', fontSize: 9 }} />
              <Area type="monotone" dataKey="temp" stroke={tempColor} fill="url(#tempGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
