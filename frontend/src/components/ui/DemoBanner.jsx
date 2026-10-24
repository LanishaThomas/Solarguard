import { FlaskConical } from 'lucide-react'

/**
 * Prominent banner shown at the top of every page in demo mode.
 * Makes it 100% clear to viewers / assessors that data is simulated.
 */
export default function DemoBanner() {
  return (
    <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-700/40 rounded-xl px-4 py-3 mb-6 text-sm">
      <FlaskConical size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-300">Demo Mode — Simulated Data</p>
        <p className="text-amber-400/70 text-xs mt-0.5">
          No hardware or backend is connected. All sensor readings, camera predictions,
          and alerts are generated locally for demonstration purposes.
          Live values update every 3 seconds to simulate real-time telemetry.
        </p>
      </div>
    </div>
  )
}
