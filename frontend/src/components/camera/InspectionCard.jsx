import { Camera, RefreshCw, ImageOff, ShieldAlert } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { DETECTION_CLASSES } from '../../data/demoData.js'
import StatusBadge from '../ui/StatusBadge.jsx'

export default function InspectionCard({ compact = false }) {
  const { inspection } = useApp()
  const { predictedClass, confidence, timestamp, imageUrl } = inspection

  const classMeta = DETECTION_CLASSES[predictedClass] ?? DETECTION_CLASSES['other_obstruction']
  const confPct   = Math.round(confidence * 100)
  const timeStr   = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'

  const badgeStatus =
    classMeta.dangerous  ? 'error'   :
    classMeta.cleanable  ? 'warning' :
    'normal'

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-900/50 rounded-md flex items-center justify-center">
            <Camera size={14} className="text-green-400" />
          </div>
          <span className="font-semibold text-white text-sm">Surface Inspection</span>
        </div>
        <StatusBadge
          status={badgeStatus}
          label={classMeta.label}
        />
      </div>

      {/* Image preview */}
      <div className="relative bg-[#0d1710] rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-[#1f3027]">
        {imageUrl ? (
          <img src={imageUrl} alt="Panel surface" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <ImageOff size={32} />
            <span className="text-xs">No image captured</span>
            <span className="text-[10px] text-gray-700">(Demo mode — camera not connected)</span>
          </div>
        )}
        {/* Class overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className={`text-xs font-semibold bg-black/70 backdrop-blur px-2 py-0.5 rounded ${classMeta.color}`}>
            {classMeta.label}
          </span>
          <span className="text-xs font-semibold bg-black/70 backdrop-blur px-2 py-0.5 rounded text-white">
            {confPct}% confidence
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Model confidence</span>
          <span className={classMeta.color}>{confPct}%</span>
        </div>
        <div className="h-2 bg-[#1f3027] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${confPct}%`,
              background: classMeta.dangerous ? '#ef4444' : classMeta.cleanable ? '#f59e0b' : '#22c55e',
            }}
          />
        </div>
      </div>

      {/* Damage warning */}
      {classMeta.dangerous && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-xs text-red-300">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Possible damage detected</p>
            <p className="text-red-400/70 mt-0.5">Automatic cleaning disabled. Manual inspection recommended.</p>
          </div>
        </div>
      )}

      {/* Cleanable hint */}
      {classMeta.cleanable && !classMeta.dangerous && (
        <p className="text-xs text-yellow-300/80 bg-yellow-900/20 rounded-lg px-3 py-1.5">
          ⚠ {classMeta.label} detected — cleaning may help. Use Wiper Control to clean.
        </p>
      )}

      {/* Footnote */}
      {!compact && (
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Predictions are probabilistic. A high confidence score is not a guaranteed diagnosis.
          Last capture: {timeStr}
        </p>
      )}
    </div>
  )
}
