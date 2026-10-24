import { Bell, CheckCircle, AlertTriangle, XCircle, Info, Trash2, CheckCheck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import PageLayout from '../components/layout/PageLayout.jsx'
import DemoBanner from '../components/ui/DemoBanner.jsx'

const TYPE_META = {
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-800/30' },
  error:   { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-950/30 border-red-800/30'       },
  info:    { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-950/30 border-blue-800/30'     },
}

export default function AlertsHistory() {
  const { alerts, dismissAlert, clearResolved, demoMode } = useApp()

  const unresolved = alerts.filter(a => !a.resolved)
  const resolved   = alerts.filter(a =>  a.resolved)

  return (
    <PageLayout
      title="Alerts & History"
      subtitle="System warnings, detections, and event log"
      actions={
        resolved.length > 0 && (
          <button onClick={clearResolved} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Trash2 size={12} />
            Clear resolved
          </button>
        )
      }
    >
      {demoMode && <DemoBanner />}

      {/* Summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Pill count={unresolved.length} label="Unresolved" color="text-red-400 bg-red-950/40 border-red-800/30" />
        <Pill count={resolved.length}   label="Resolved"   color="text-green-400 bg-green-950/40 border-green-800/30" />
        <Pill count={alerts.filter(a => a.type === 'warning').length} label="Warnings" color="text-yellow-400 bg-yellow-950/40 border-yellow-800/30" />
        <Pill count={alerts.filter(a => a.type === 'error').length}   label="Errors"   color="text-red-400 bg-red-950/40 border-red-800/30" />
      </div>

      {/* Unresolved alerts */}
      {unresolved.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Bell size={14} className="text-red-400" /> Active Alerts
          </h2>
          <div className="flex flex-col gap-3">
            {unresolved.map(a => (
              <AlertRow key={a.id} alert={a} onDismiss={() => dismissAlert(a.id)} />
            ))}
          </div>
        </section>
      )}

      {unresolved.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3 mb-6">
          <CheckCheck size={32} className="text-green-500" />
          <p className="text-white font-medium">All clear — no active alerts</p>
          <p className="text-sm text-gray-400">The system is operating normally.</p>
        </div>
      )}

      {/* Resolved / history */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" /> Resolved / History
          </h2>
          <div className="flex flex-col gap-2">
            {resolved.map(a => (
              <AlertRow key={a.id} alert={a} resolved />
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  )
}

function AlertRow({ alert, onDismiss, resolved = false }) {
  const meta = TYPE_META[alert.type] ?? TYPE_META.info
  const Icon = meta.icon

  const timeStr = new Date(alert.timestamp).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 transition-opacity ${meta.bg} ${resolved ? 'opacity-50' : ''}`}>
      <Icon size={16} className={`${meta.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white">{alert.title}</p>
          {resolved && (
            <span className="text-[10px] bg-green-900/40 text-green-400 rounded-full px-1.5 py-0.5">Resolved</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-[10px] text-gray-600 mt-1">{timeStr}</p>
      </div>
      {!resolved && onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-gray-500 hover:text-green-300 hover:bg-[#1f3027] transition-colors flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <CheckCircle size={14} />
        </button>
      )}
    </div>
  )
}

function Pill({ count, label, color }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${color}`}>
      {count} {label}
    </span>
  )
}
