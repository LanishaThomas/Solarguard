import { useState } from 'react'
import { Activity, Zap, Thermometer, Waves } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import PageLayout from '../components/layout/PageLayout.jsx'
import DemoBanner from '../components/ui/DemoBanner.jsx'
import PanelCard from '../components/panels/PanelCard.jsx'
import PanelDetailModal from '../components/panels/PanelDetailModal.jsx'
import TemperatureCard from '../components/temperature/TemperatureCard.jsx'
import WiperControl from '../components/cleaning/WiperControl.jsx'
import InspectionCard from '../components/camera/InspectionCard.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

export default function Dashboard() {
  const { panels, alerts, demoMode } = useApp()
  const [selectedPanel, setSelectedPanel] = useState(null)

  const unresolvedAlerts = alerts.filter(a => !a.resolved).slice(0, 3)
  const totalPower = panels.reduce((s, p) => s + p.power, 0)
  const warningCount = panels.filter(p => p.status !== 'normal').length

  const barData = panels.map(p => ({
    name: p.name,
    Power: parseFloat(p.power.toFixed(3)),
    Voltage: parseFloat(p.voltage.toFixed(2)),
  }))

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Live overview of all SolarGuard panels and systems"
    >
      {demoMode && <DemoBanner />}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryTile icon={Zap}        label="Total Power"   value={`${totalPower.toFixed(2)} W`} status="normal" />
        <SummaryTile icon={Activity}   label="Active Panels" value={`${panels.length - warningCount} / ${panels.length}`} status={warningCount > 0 ? 'warning' : 'normal'} />
        <SummaryTile icon={Thermometer} label="Temperature"  value={`${useApp().temperature.current.toFixed(1)} °C`} status={useApp().temperature.status} />
        <SummaryTile icon={Waves}      label="Wiper"         value={useApp().wiper.status.charAt(0).toUpperCase() + useApp().wiper.status.slice(1)} status={useApp().wiper.status === 'fault' ? 'error' : 'normal'} />
      </div>

      {/* Panel cards */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Panel Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {panels.map(p => (
          <PanelCard key={p.id} panel={p} onClick={() => setSelectedPanel(p)} />
        ))}
      </div>

      {/* Power comparison chart */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={14} className="text-green-400" />
          Panel Power Comparison
        </h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3027" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ background: '#162119', border: '1px solid #1f3027', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Power"   fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="Voltage" fill="#60a5fa" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom grid: temp + camera + wiper + alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TemperatureCard compact />
        <InspectionCard  compact />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WiperControl compact />
        {/* Recent alerts */}
        <div className="card flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={14} className="text-green-400" /> Recent Alerts
          </h2>
          {unresolvedAlerts.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No unresolved alerts — all clear.</p>
          ) : (
            unresolvedAlerts.map(a => (
              <div key={a.id} className="flex items-start gap-2 bg-[#0d1710] rounded-lg px-3 py-2">
                <StatusBadge status={a.type === 'error' ? 'error' : a.type === 'warning' ? 'warning' : 'info'} label={a.title} />
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPanel && (
        <PanelDetailModal panel={selectedPanel} onClose={() => setSelectedPanel(null)} />
      )}
    </PageLayout>
  )
}

function SummaryTile({ icon: Icon, label, value, status }) {
  const { demoMode } = useApp()
  const color = { normal: 'text-green-400', warning: 'text-yellow-400', error: 'text-red-400' }[status] ?? 'text-green-400'
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className={color} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  )
}
