/**
 * SolarGuard — Demo Mode Data
 * All values here are simulated. No hardware is connected.
 * Replace with real API calls when integrating backend.
 */

/** Generate n-point history for a panel */
function genHistory(base, variance, n = 20) {
  return Array.from({ length: n }, (_, i) => ({
    time: `${String(10 + i).padStart(2, '0')}:00`,
    power: parseFloat((base + (Math.random() - 0.5) * variance).toFixed(3)),
    voltage: parseFloat((5.2 + (Math.random() - 0.5) * 0.4).toFixed(2)),
    current: parseFloat((0.18 + (Math.random() - 0.5) * 0.06).toFixed(3)),
  }))
}

function genTempHistory(n = 24) {
  return Array.from({ length: n }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    temp: parseFloat((38 + Math.sin(i / 4) * 8 + Math.random() * 3).toFixed(1)),
  }))
}

export const DEMO_PANELS = [
  {
    id: 1,
    name: 'Panel 1',
    voltage: 5.38,
    current: 0.192,
    power: 1.033,
    status: 'normal',
    statusLabel: 'Normal',
    history: genHistory(1.0, 0.2),
  },
  {
    id: 2,
    name: 'Panel 2',
    voltage: 4.91,
    current: 0.082,
    power: 0.403,
    status: 'warning',
    statusLabel: 'Low output (−60 % below peer median)',
    history: genHistory(0.4, 0.15),
  },
  {
    id: 3,
    name: 'Panel 3',
    voltage: 5.24,
    current: 0.175,
    power: 0.917,
    status: 'normal',
    statusLabel: 'Normal',
    history: genHistory(0.9, 0.2),
  },
]

export const DEMO_TEMPERATURE = {
  current: 42.6,
  unit: '°C',
  status: 'normal',          // 'normal' | 'warning' | 'critical'
  threshold: 55,
  history: genTempHistory(),
}

export const DEMO_INSPECTION = {
  predictedClass: 'dust',
  confidence: 0.87,
  label: 'Dust',
  timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
  imageUrl: null,           // will show placeholder
  cleanable: true,
}

export const DEMO_WIPER = {
  status: 'idle',           // 'idle' | 'wiping' | 'cooldown' | 'fault'
  autoMode: false,
  cooldownSec: 0,
  lastWipe: new Date(Date.now() - 12 * 60_000).toISOString(),
}

export const DEMO_CONNECTION = {
  esp32: true,
  camera: true,
  backend: false,           // backend intentionally disconnected in demo
}

export const DEMO_ALERTS = [
  {
    id: 'a1',
    type: 'warning',
    title: 'Panel 2 — Low output',
    message: 'Panel 2 power is 60 % below the peer-panel median for 5+ consecutive readings.',
    timestamp: new Date(Date.now() - 8 * 60_000).toISOString(),
    resolved: false,
  },
  {
    id: 'a2',
    type: 'info',
    title: 'Surface inspection — Dust detected',
    message: 'Camera inspection predicts dust on Panel 1 with 87 % confidence.',
    timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
    resolved: false,
  },
  {
    id: 'a3',
    type: 'info',
    title: 'Wiper cycle completed',
    message: 'Manual wipe cycle completed successfully. Panel 1 surface was cleaned.',
    timestamp: new Date(Date.now() - 25 * 60_000).toISOString(),
    resolved: true,
  },
  {
    id: 'a4',
    type: 'warning',
    title: 'Temperature rising',
    message: 'Panel temperature reached 49 °C. Monitor closely; alert threshold is 55 °C.',
    timestamp: new Date(Date.now() - 45 * 60_000).toISOString(),
    resolved: true,
  },
  {
    id: 'a5',
    type: 'error',
    title: 'Backend API offline',
    message: 'Cannot reach the SolarGuard backend API. Showing cached demo data.',
    timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
    resolved: false,
  },
]

export const DEFAULT_SETTINGS = {
  lowOutputThreshold: 70,       // % below peer median
  lowOutputSamples: 5,          // consecutive readings before alert
  minOutputWatts: 0.1,          // minimum watts to consider a panel active
  tempAlertCelsius: 55,
  tempAlertDurationSec: 30,
  cleanConfidenceThreshold: 80, // % confidence before auto-wipe
  cleaningCooldownMin: 15,
  autoCleanEnabled: false,
}

/** Helper — detection class meta */
export const DETECTION_CLASSES = {
  clean:                { label: 'Clean',                   color: 'text-green-400',  cleanable: false, dangerous: false },
  dust:                 { label: 'Dust',                    color: 'text-yellow-400', cleanable: true,  dangerous: false },
  bird_droppings:       { label: 'Bird droppings',          color: 'text-orange-400', cleanable: true,  dangerous: false },
  leaves_or_foreign_object: { label: 'Leaves / debris',    color: 'text-amber-400',  cleanable: true,  dangerous: false },
  crack_or_breakage:    { label: 'Crack / damage',          color: 'text-red-400',    cleanable: false, dangerous: true  },
  other_obstruction:    { label: 'Unknown obstruction',     color: 'text-blue-400',   cleanable: false, dangerous: false },
}
