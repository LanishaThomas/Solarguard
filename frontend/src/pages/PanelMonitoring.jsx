import { useState } from 'react'
import { SunMedium, TrendingUp, Zap, Gauge, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import PageLayout from '../components/layout/PageLayout.jsx'
import DemoBanner from '../components/ui/DemoBanner.jsx'
import PanelCard from '../components/panels/PanelCard.jsx'
import PanelDetailModal from '../components/panels/PanelDetailModal.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
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

const PANEL_COLORS = ['#22c55e', '#60a5fa', '#f59e0b']

export default function PanelMonitoring() {
  const { panels, demoMode } = useApp()
  const [selectedPanel, setSelectedPanel] = useState(null)

  // Build combined history for comparison chart
  const maxLen = Math.max(...panels.map(p => p.history.length))
  const combinedHistory = Array.from({ length: maxLen }, (_, i) => {
    const point = { time: panels[0].history[i]?.time ?? `${i}` }
    panels.forEach(p => {
      if (p.history[i]) point[p.name] = p.history[i].power
    })
    return point
  })

  const median = arr => {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }
  const powers = panels.map(p => p.power)
  const med = median(powers)

  return (
    <PageLayout
      title="Panel Monitoring"
      subtitle="Independent voltage, current, and power readings for each panel"
    >
      {demoMode && <DemoBanner />}

      {/* Panel cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {panels.map(p => (
          <PanelCard key={p.id} panel={p} onClick={() => setSelectedPanel(p)} />
        ))}
      </div>

      {/* Peer comparison table */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <SunMedium size={14} className="text-green-400" /> Peer Power Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-[#1f3027]">
                <th className="text-left pb-2 font-medium">Panel</th>
                <th className="text-right pb-2 font-medium">Voltage (V)</th>
                <th className="text-right pb-2 font-medium">Current (A)</th>
                <th className="text-right pb-2 font-medium">Power (W)</th>
                <th className="text-right pb-2 font-medium">vs Median</th>
                <th className="text-right pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {panels.map(p => {
                const diffPct = Math.round(((p.power - med) / med) * 100)
                return (
                  <tr key={p.id} className="border-b border-[#1f3027]/50 hover:bg-[#1a2a1e] transition-colors">
                    <td className="py-2 font-medium text-white">{p.name}</td>
                    <td className="py-2 text-right text-gray-300">{p.voltage.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-300">{p.current.toFixed(3)}</td>
                    <td className="py-2 text-right font-semibold text-white">{p.power.toFixed(3)}</td>
                    <td className={`py-2 text-right font-medium ${diffPct < -30 ? 'text-red-400' : diffPct < 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {diffPct >= 0 ? '+' : ''}{diffPct}%
                    </td>
                    <td className="py-2 text-right">
                      <StatusBadge status={p.status} label={p.status === 'normal' ? 'Normal' : 'Warning'} />
                    </td>
                  </tr>
                )
              })}
              <tr className="text-xs text-gray-500">
                <td className="pt-2 font-medium" colSpan={3}>Peer median</td>
                <td className="pt-2 text-right font-semibold text-gray-300">{med.toFixed(3)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Combined trend chart */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-green-400" /> Power Trend — All Panels
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedHistory} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3027" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} unit=" W" width={45} />
              <Tooltip
                contentStyle={{ background: '#162119', border: '1px solid #1f3027', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {panels.map((p, i) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.name}
                  stroke={PANEL_COLORS[i]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert rule reminder */}
      <div className="bg-[#0d1710] border border-[#1f3027] rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
        <p className="font-medium text-gray-300 mb-1">Alert rule</p>
        A panel is flagged when its power is below <span className="text-yellow-300">70%</span> of the peer-panel median
        for <span className="text-yellow-300">5 consecutive readings</span>, and total output is above the minimum sunlight threshold.
        Thresholds are configurable in Settings.
      </div>

      {selectedPanel && (
        <PanelDetailModal panel={selectedPanel} onClose={() => setSelectedPanel(null)} />
      )}
    </PageLayout>
  )
}
