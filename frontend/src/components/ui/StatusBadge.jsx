import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const VARIANTS = {
  normal:   { cls: 'status-ok',    icon: CheckCircle },
  ok:       { cls: 'status-ok',    icon: CheckCircle },
  warning:  { cls: 'status-warn',  icon: AlertTriangle },
  error:    { cls: 'status-error', icon: XCircle },
  critical: { cls: 'status-error', icon: XCircle },
  info:     { cls: 'status-info',  icon: Info },
}

export default function StatusBadge({ status = 'normal', label }) {
  const { cls, icon: Icon } = VARIANTS[status] ?? VARIANTS.normal
  return (
    <span className={cls}>
      <Icon size={10} />
      {label}
    </span>
  )
}
