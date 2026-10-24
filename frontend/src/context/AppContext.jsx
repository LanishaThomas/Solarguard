import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import {
  DEMO_PANELS,
  DEMO_TEMPERATURE,
  DEMO_INSPECTION,
  DEMO_WIPER,
  DEMO_CONNECTION,
  DEMO_ALERTS,
  DEFAULT_SETTINGS,
} from '../data/demoData.js'

/** ---------- initial state ---------- */
const initialState = {
  demoMode: true,
  panels: DEMO_PANELS,
  temperature: DEMO_TEMPERATURE,
  inspection: DEMO_INSPECTION,
  wiper: DEMO_WIPER,
  connection: DEMO_CONNECTION,
  alerts: DEMO_ALERTS,
  settings: DEFAULT_SETTINGS,
  activeNav: 'dashboard',
}

/** ---------- reducer ---------- */
function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAV':
      return { ...state, activeNav: action.payload }

    case 'TICK_DEMO': {
      // Simulate live data changes in demo mode
      const panels = state.panels.map(p => ({
        ...p,
        voltage: parseFloat((p.voltage + (Math.random() - 0.5) * 0.05).toFixed(2)),
        current: parseFloat((p.current + (Math.random() - 0.5) * 0.01).toFixed(3)),
        power: parseFloat(
          ((p.voltage + (Math.random() - 0.5) * 0.05) *
           (p.current + (Math.random() - 0.5) * 0.01)).toFixed(3)
        ),
      }))
      const temp = parseFloat(
        (state.temperature.current + (Math.random() - 0.5) * 0.4).toFixed(1)
      )
      return {
        ...state,
        panels,
        temperature: {
          ...state.temperature,
          current: temp,
          status: temp > state.settings.tempAlertCelsius ? 'warning' : 'normal',
        },
      }
    }

    case 'TRIGGER_WIPE':
      return {
        ...state,
        wiper: { ...state.wiper, status: 'wiping' },
        alerts: [
          {
            id: `a${Date.now()}`,
            type: 'info',
            title: 'Wiper activated',
            message: 'Manual wipe cycle started.',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
          ...state.alerts,
        ],
      }

    case 'WIPE_COMPLETE':
      return {
        ...state,
        wiper: {
          ...state.wiper,
          status: 'cooldown',
          lastWipe: new Date().toISOString(),
          cooldownSec: state.settings.cleaningCooldownMin * 60,
        },
      }

    case 'WIPE_IDLE':
      return { ...state, wiper: { ...state.wiper, status: 'idle', cooldownSec: 0 } }

    case 'TOGGLE_AUTO_CLEAN':
      return {
        ...state,
        wiper: { ...state.wiper, autoMode: !state.wiper.autoMode },
      }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload ? { ...a, resolved: true } : a
        ),
      }

    case 'CLEAR_RESOLVED':
      return { ...state, alerts: state.alerts.filter(a => !a.resolved) }

    default:
      return state
  }
}

/** ---------- context ---------- */
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Simulate live tick in demo mode
  useEffect(() => {
    if (!state.demoMode) return
    const id = setInterval(() => dispatch({ type: 'TICK_DEMO' }), 3000)
    return () => clearInterval(id)
  }, [state.demoMode])

  // Simulate wipe completion
  useEffect(() => {
    if (state.wiper.status !== 'wiping') return
    const id = setTimeout(() => dispatch({ type: 'WIPE_COMPLETE' }), 2500)
    return () => clearTimeout(id)
  }, [state.wiper.status])

  // Simulate cooldown ending
  useEffect(() => {
    if (state.wiper.status !== 'cooldown') return
    const id = setTimeout(() => dispatch({ type: 'WIPE_IDLE' }), 8000)
    return () => clearTimeout(id)
  }, [state.wiper.status])

  const setNav = useCallback(page => dispatch({ type: 'SET_NAV', payload: page }), [])
  const triggerWipe = useCallback(() => dispatch({ type: 'TRIGGER_WIPE' }), [])
  const toggleAutoClean = useCallback(() => dispatch({ type: 'TOGGLE_AUTO_CLEAN' }), [])
  const updateSettings = useCallback(s => dispatch({ type: 'UPDATE_SETTINGS', payload: s }), [])
  const dismissAlert = useCallback(id => dispatch({ type: 'DISMISS_ALERT', payload: id }), [])
  const clearResolved = useCallback(() => dispatch({ type: 'CLEAR_RESOLVED' }), [])

  return (
    <AppContext.Provider value={{
      ...state,
      setNav,
      triggerWipe,
      toggleAutoClean,
      updateSettings,
      dismissAlert,
      clearResolved,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
