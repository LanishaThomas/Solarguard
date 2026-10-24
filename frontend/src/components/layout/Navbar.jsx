import { useState } from 'react'
import {
  LayoutDashboard,
  SunMedium,
  Camera,
  Waves,
  Bell,
  Settings,
  Menu,
  X,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'panels',      label: 'Panel Monitoring',  icon: SunMedium },
  { id: 'camera',      label: 'Camera & Detection',icon: Camera },
  { id: 'cleaning',    label: 'Cleaning Control',  icon: Waves },
  { id: 'alerts',      label: 'Alerts & History',  icon: Bell },
  { id: 'settings',    label: 'Settings',          icon: Settings },
]

export default function Navbar() {
  const { activeNav, setNav, connection, alerts, demoMode } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  const unresolvedCount = alerts.filter(a => !a.resolved).length

  function handleNav(id) {
    setNav(id)
    setMobileOpen(false)
  }

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d1710]/95 backdrop-blur border-b border-[#1f3027] flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-green-300 text-lg tracking-tight">SolarGuard</span>
        </div>

        {/* Centre — demo badge + connection pills */}
        <div className="hidden sm:flex items-center gap-2">
          {demoMode && (
            <span className="text-xs font-semibold bg-amber-800/40 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded-full">
              ⚡ DEMO MODE
            </span>
          )}
          <ConnectionPill label="ESP32"   ok={connection.esp32} />
          <ConnectionPill label="Camera"  ok={connection.camera} />
          <ConnectionPill label="Backend" ok={connection.backend} />
        </div>

        {/* Right — alerts badge + hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav('alerts')}
            className="relative p-2 rounded-lg text-gray-400 hover:text-green-300 hover:bg-[#1f3027] transition-colors"
            aria-label="Alerts"
          >
            <Bell size={18} />
            {unresolvedCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {unresolvedCount > 9 ? '9+' : unresolvedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-green-300 hover:bg-[#1f3027] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Desktop sidebar ───────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed top-14 left-0 bottom-0 w-56 bg-[#0d1710] border-r border-[#1f3027] py-4 z-40">
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`nav-link ${activeNav === id ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {id === 'alerts' && unresolvedCount > 0 && (
                <span className="ml-auto text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5 font-bold">
                  {unresolvedCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 py-3 border-t border-[#1f3027]">
          {demoMode && (
            <div className="text-xs text-amber-400/80 bg-amber-950/30 rounded-lg p-2 mb-2">
              <p className="font-semibold">⚡ Demo Mode Active</p>
              <p className="text-amber-500/70 mt-0.5">Simulated data only. No hardware connected.</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <ConnectionPill label="ESP32"   ok={connection.esp32}   full />
            <ConnectionPill label="Camera"  ok={connection.camera}  full />
            <ConnectionPill label="Backend" ok={connection.backend} full />
          </div>
        </div>
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-64 bg-[#0d1710] border-r border-[#1f3027] flex flex-col pt-16 pb-4">
            {demoMode && (
              <div className="mx-3 mb-3 text-xs text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-2">
                <p className="font-semibold">⚡ DEMO MODE</p>
                <p className="text-amber-500/70">Simulated data only</p>
              </div>
            )}
            <nav className="flex flex-col gap-1 px-3">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`nav-link ${activeNav === id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {id === 'alerts' && unresolvedCount > 0 && (
                    <span className="ml-auto text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5 font-bold">
                      {unresolvedCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="mt-auto px-4 pt-3 border-t border-[#1f3027]">
              <div className="flex flex-col gap-1">
                <ConnectionPill label="ESP32"   ok={connection.esp32}   full />
                <ConnectionPill label="Camera"  ok={connection.camera}  full />
                <ConnectionPill label="Backend" ok={connection.backend} full />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ConnectionPill({ label, ok, full = false }) {
  if (full) {
    return (
      <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${ok ? 'text-green-400' : 'text-red-400'}`}>
        {ok ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span>{label}</span>
        <span className={`ml-auto font-medium ${ok ? 'text-green-500' : 'text-red-500'}`}>
          {ok ? 'Online' : 'Offline'}
        </span>
      </div>
    )
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
      ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
    }`}>
      {ok ? <Wifi size={10} /> : <WifiOff size={10} />}
      {label}
    </span>
  )
}
