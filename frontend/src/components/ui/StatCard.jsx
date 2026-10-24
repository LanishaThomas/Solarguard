/**
 * Small metric card used in panel/temperature/wiper summaries.
 * Props: label, value, unit, icon (Lucide component), trend, status
 */
export default function StatCard({ label, value, unit, icon: Icon, status = 'normal', trend, children }) {
  const statusColor = {
    normal:   'text-green-400',
    warning:  'text-yellow-400',
    critical: 'text-red-400',
    info:     'text-blue-400',
  }[status] ?? 'text-green-400'

  return (
    <div className="card flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">{label}</span>
        {Icon && (
          <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-[#1f3027] ${statusColor}`}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold leading-none ${statusColor}`}>{value ?? '—'}</span>
        {unit && <span className="text-sm text-gray-400 mb-0.5">{unit}</span>}
      </div>
      {trend !== undefined && (
        <p className="text-xs text-gray-500">{trend}</p>
      )}
      {children}
    </div>
  )
}
