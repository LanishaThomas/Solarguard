import { Waves, Clock, History, CheckCircle, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import PageLayout from '../components/layout/PageLayout.jsx'
import DemoBanner from '../components/ui/DemoBanner.jsx'
import WiperControl from '../components/cleaning/WiperControl.jsx'
import TemperatureCard from '../components/temperature/TemperatureCard.jsx'
import Toggle from '../components/ui/Toggle.jsx'

const WIPE_LOG = [
  { time: '10:42', trigger: 'Manual', result: 'Completed', panel: 'Panel 1' },
  { time: '09:15', trigger: 'Auto',   result: 'Completed', panel: 'Panel 2' },
  { time: '08:30', trigger: 'Manual', result: 'Completed', panel: 'Panel 1' },
  { time: '07:55', trigger: 'Auto',   result: 'Skipped — cooldown', panel: 'Panel 1' },
  { time: '06:10', trigger: 'Manual', result: 'Completed', panel: 'Panel 3' },
]

export default function CleaningControl() {
  const { wiper, settings, updateSettings, demoMode } = useApp()
  const { autoMode, status, lastWipe } = wiper

  const lastWipeStr = lastWipe
    ? new Date(lastWipe).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never'

  return (
    <PageLayout
      title="Cleaning Control"
      subtitle="Manual and automatic wiper management"
    >
      {demoMode && <DemoBanner />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          {/* Primary wiper control */}
          <WiperControl />

          {/* Safety notes */}
          <div className="card flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" /> Safety Rules
            </h3>
            <ul className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
              {[
                'Wiper will not start if a crack or damage is predicted.',
                'Auto-clean only triggers when model confidence exceeds the configured threshold.',
                `Minimum cooldown of ${settings.cleaningCooldownMin} min between cycles.`,
                'Manual wipe is always subject to the cooldown timer.',
                'A physical emergency-stop switch overrides all software commands.',
                'Backend offline: auto-clean defaults to OFF.',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle size={10} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Auto-clean settings summary */}
          <div className="card flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Waves size={14} className="text-green-400" /> Auto-Clean Settings
            </h3>

            <SettingRow
              label="Confidence threshold"
              description="Minimum model confidence % before auto-wipe activates"
              value={`${settings.cleanConfidenceThreshold}%`}
            />
            <SettingRow
              label="Cooldown period"
              description="Minimum time between cleaning cycles"
              value={`${settings.cleaningCooldownMin} min`}
            />
            <SettingRow
              label="Auto-clean enabled"
              description="Master toggle for automatic cleaning"
              value={autoMode ? 'On' : 'Off'}
              highlight={autoMode}
            />

            <p className="text-xs text-gray-500">
              To change these values, go to <span className="text-green-400">Settings</span>.
            </p>
          </div>

          {/* Last wipe info */}
          <div className="card flex items-center gap-3">
            <Clock size={18} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Last wipe cycle</p>
              <p className="text-xs text-gray-400 mt-0.5">{lastWipeStr}</p>
            </div>
            <div className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
              status === 'idle' ? 'bg-green-900/40 text-green-400' :
              status === 'cooldown' ? 'bg-yellow-900/40 text-yellow-400' :
              status === 'wiping' ? 'bg-blue-900/40 text-blue-400' :
              'bg-red-900/40 text-red-400'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>

          {/* Wipe log */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <History size={14} className="text-green-400" /> Wipe Log (Demo)
            </h3>
            <div className="flex flex-col gap-1.5">
              {WIPE_LOG.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-[#0d1710] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-mono">{entry.time}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.trigger === 'Auto' ? 'bg-blue-900/40 text-blue-300' : 'bg-green-900/40 text-green-300'
                    }`}>{entry.trigger}</span>
                    <span className="text-gray-400">{entry.panel}</span>
                  </div>
                  <span className={`font-medium ${entry.result === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {entry.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function SettingRow({ label, description, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#0d1710] rounded-lg px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm text-white">{label}</p>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{description}</p>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${highlight ? 'text-green-400' : 'text-gray-300'}`}>
        {value}
      </span>
    </div>
  )
}
