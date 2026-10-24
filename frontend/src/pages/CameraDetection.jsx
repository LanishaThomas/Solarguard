import { Camera, RefreshCw, ShieldAlert, CheckCircle, Layers } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { DETECTION_CLASSES } from '../data/demoData.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import DemoBanner from '../components/ui/DemoBanner.jsx'
import InspectionCard from '../components/camera/InspectionCard.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'

const CLASS_KEYS = Object.keys(DETECTION_CLASSES)

export default function CameraDetection() {
  const { inspection, demoMode } = useApp()
  const { predictedClass, confidence } = inspection

  const confPct = Math.round(confidence * 100)

  return (
    <PageLayout
      title="Camera & Detection"
      subtitle="Panel surface inspection via computer vision"
    >
      {demoMode && <DemoBanner />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main inspection card */}
        <div className="flex flex-col gap-4">
          <InspectionCard />

          {/* Capture button (demo-safe) */}
          <div className="card flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera size={14} className="text-green-400" /> Capture & Analyse
            </h3>
            <p className="text-xs text-gray-400">
              In live mode this sends a camera frame to the ML inference service.
              In demo mode the result shown is simulated.
            </p>
            <button
              className="btn-secondary flex items-center gap-2 justify-center"
              onClick={() => {}} // no-op in demo
            >
              <RefreshCw size={14} />
              Capture New Image {demoMode && <span className="text-xs opacity-60">(Demo)</span>}
            </button>
          </div>
        </div>

        {/* Class legend + model info */}
        <div className="flex flex-col gap-4">
          {/* Class legend */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Layers size={14} className="text-green-400" /> Detection Classes
            </h3>
            <div className="flex flex-col gap-2">
              {CLASS_KEYS.map(key => {
                const meta = DETECTION_CLASSES[key]
                const isActive = key === predictedClass
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      isActive ? 'bg-[#1a2a1e] border border-[#2a3f30]' : 'bg-[#0d1710]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        meta.dangerous ? 'bg-red-400' : meta.cleanable ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <span className={`text-sm ${meta.color}`}>{meta.label}</span>
                      {isActive && (
                        <span className="text-[10px] bg-green-800/50 text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {meta.cleanable && <span className="text-yellow-400/70">Cleanable</span>}
                      {meta.dangerous && <span className="text-red-400/70 flex items-center gap-1"><ShieldAlert size={10} /> No auto-wipe</span>}
                      {!meta.cleanable && !meta.dangerous && <span className="text-green-400/70 flex items-center gap-1"><CheckCircle size={10} /> Safe</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cleaning policy */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Cleaning Policy</h3>
            <div className="flex flex-col gap-2 text-xs text-gray-400 leading-relaxed">
              <PolicyRow label="clean"                    action="No action" safe />
              <PolicyRow label="dust"                    action="Offer or auto-wipe" warn />
              <PolicyRow label="bird_droppings"          action="Offer or auto-wipe" warn />
              <PolicyRow label="leaves_or_foreign_object" action="Offer or auto-wipe" warn />
              <PolicyRow label="crack_or_breakage"       action="Alert only — wiping disabled" danger />
              <PolicyRow label="other_obstruction"       action="Notify user — no auto-wipe" info />
            </div>
            <p className="text-[10px] text-gray-600 mt-3 leading-relaxed">
              Predictions are probabilistic estimates only. A high confidence score does not guarantee the label is correct.
              Auto-wipe only activates when confidence exceeds the configured threshold and no damage is predicted.
            </p>
          </div>

          {/* Model info */}
          <div className="card text-xs text-gray-400 leading-relaxed">
            <h3 className="text-sm font-semibold text-white mb-2">Model Info</h3>
            <div className="flex flex-col gap-1">
              <InfoRow label="Architecture"   value="MobileNetV3 (transfer learning)" />
              <InfoRow label="Input size"     value="224 × 224 px" />
              <InfoRow label="Classes"        value="6" />
              <InfoRow label="Inference host" value={demoMode ? 'Demo (local)' : 'ml-service:8001'} />
              <InfoRow label="Status"         value={demoMode ? 'Simulated' : 'Active'} highlight={!demoMode} />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function PolicyRow({ label, action, safe, warn, danger, info }) {
  const meta = DETECTION_CLASSES[label] ?? {}
  const color = danger ? 'text-red-400' : warn ? 'text-yellow-400' : safe ? 'text-green-400' : 'text-blue-400'
  return (
    <div className="flex items-center justify-between bg-[#0d1710] rounded px-2 py-1.5">
      <span className={`font-mono ${meta.color ?? 'text-gray-400'}`}>{label}</span>
      <span className={color}>{action}</span>
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between bg-[#0d1710] rounded px-2 py-1">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? 'text-green-400 font-medium' : 'text-gray-300'}>{value}</span>
    </div>
  )
}
