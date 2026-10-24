import { Settings as SettingsIcon, Save, RotateCcw, Zap, Thermometer, Camera, Waves } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { DEFAULT_SETTINGS } from '../data/demoData.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import DemoBanner from '../components/ui/DemoBanner.jsx'

export default function Settings() {
  const { settings, updateSettings, demoMode } = useApp()
  const [local, setLocal] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  function handleChange(key, value) {
    setLocal(s => ({ ...s, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    updateSettings(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    setLocal({ ...DEFAULT_SETTINGS })
    updateSettings(DEFAULT_SETTINGS)
    setSaved(false)
  }

  return (
    <PageLayout
      title="Settings"
      subtitle="Configure thresholds, cleaning behaviour, and alert rules"
      actions={
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={handleSave} className={`btn-primary flex items-center gap-1.5 text-xs ${saved ? 'bg-green-700' : ''}`}>
            <Save size={12} /> {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      }
    >
      {demoMode && <DemoBanner />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel output thresholds */}
        <Section icon={Zap} title="Panel Output Rules">
          <NumberField
            label="Low output threshold"
            description="Flag a panel when its power is below this % of the peer median"
            value={local.lowOutputThreshold}
            min={10} max={95} step={5} unit="%"
            onChange={v => handleChange('lowOutputThreshold', v)}
          />
          <NumberField
            label="Consecutive samples before alert"
            description="Number of back-to-back low readings required to raise an alert"
            value={local.lowOutputSamples}
            min={1} max={20} step={1} unit="readings"
            onChange={v => handleChange('lowOutputSamples', v)}
          />
          <NumberField
            label="Minimum panel output"
            description="Panels below this are considered off/nighttime — comparison is skipped"
            value={local.minOutputWatts}
            min={0.01} max={2} step={0.05} unit="W"
            onChange={v => handleChange('minOutputWatts', v)}
          />
        </Section>

        {/* Temperature */}
        <Section icon={Thermometer} title="Temperature Monitoring">
          <NumberField
            label="Alert temperature"
            description="Raise a warning when panel temperature exceeds this value"
            value={local.tempAlertCelsius}
            min={30} max={90} step={1} unit="°C"
            onChange={v => handleChange('tempAlertCelsius', v)}
          />
          <NumberField
            label="Alert duration"
            description="Temperature must exceed the limit for this long before alerting"
            value={local.tempAlertDurationSec}
            min={5} max={300} step={5} unit="sec"
            onChange={v => handleChange('tempAlertDurationSec', v)}
          />
          <InfoBox>
            Choose the alert temperature based on your panel datasheet.
            Do not assume a universal safe threshold — this is a prototype setting.
          </InfoBox>
        </Section>

        {/* Cleaning */}
        <Section icon={Waves} title="Cleaning & Wiper">
          <NumberField
            label="Auto-clean confidence threshold"
            description="Minimum ML confidence % required before automatic cleaning is triggered"
            value={local.cleanConfidenceThreshold}
            min={50} max={99} step={1} unit="%"
            onChange={v => handleChange('cleanConfidenceThreshold', v)}
          />
          <NumberField
            label="Cleaning cooldown"
            description="Minimum time between wipe cycles"
            value={local.cleaningCooldownMin}
            min={1} max={120} step={1} unit="min"
            onChange={v => handleChange('cleaningCooldownMin', v)}
          />
          <InfoBox>
            Auto-clean will never activate when crack/breakage is predicted,
            regardless of this threshold.
          </InfoBox>
        </Section>

        {/* Model / camera */}
        <Section icon={Camera} title="Camera & Model">
          <StaticField label="Inference endpoint" value={demoMode ? 'Demo (simulated)' : 'http://localhost:8001/predict'} />
          <StaticField label="Model architecture"  value="MobileNetV3 — transfer learning" />
          <StaticField label="Classes"             value="clean, dust, bird_droppings, leaves/debris, crack, other" />
          <InfoBox>
            Camera and ML inference settings are configured in the backend environment.
            Changing them here is not yet connected in demo mode.
          </InfoBox>
        </Section>
      </div>
    </PageLayout>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Icon size={14} className="text-green-400" /> {title}
      </h3>
      {children}
    </div>
  )
}

function NumberField({ label, description, value, min, max, step, unit, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <p className="text-xs text-gray-500">{description}</p>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-green-500 h-1.5 bg-[#1f3027] rounded-full"
        />
        <div className="flex items-center gap-1 min-w-[70px]">
          <input
            type="number"
            min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-14 bg-[#0d1710] border border-[#1f3027] rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  )
}

function StaticField({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#0d1710] rounded-lg px-3 py-2 text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-300 font-medium text-right">{value}</span>
    </div>
  )
}

function InfoBox({ children }) {
  return (
    <div className="bg-[#0d1710] rounded-lg px-3 py-2 text-[11px] text-gray-500 leading-relaxed border border-[#1f3027]/50">
      {children}
    </div>
  )
}
