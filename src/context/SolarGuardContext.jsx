import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_PANELS, generateInitialHistory, INITIAL_ALERTS, INITIAL_CLEANING_LOGS, INSPECTION_PRESETS } from '../data/initialData';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { calculateMedian, evaluatePanelHealth, evaluateTemperature } from '../utils/calculations';

const SolarGuardContext = createContext(null);

export function SolarGuardProvider({ children }) {
  // Settings
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [activeScenario, setActiveScenario] = useState('shaded_panel_2');

  // Telemetry & Hardware State
  const [panels, setPanels] = useState(INITIAL_PANELS);
  const [temperature, setTemperature] = useState(41.8);
  const [telemetryHistory, setTelemetryHistory] = useState(generateInitialHistory());
  const [dailyYieldWh, setDailyYieldWh] = useState(14.85); // Wh accumulated today
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Alerts
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  // Surface Inspection ML State
  const [inspection, setInspection] = useState({
    preset: INSPECTION_PRESETS[0], // Leaves by default
    customImage: null,
    timestamp: new Date().toISOString(),
    history: [
      { id: 'INSP-1', ...INSPECTION_PRESETS[0], timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'INSP-2', ...INSPECTION_PRESETS[1], timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]
  });

  // FastAPI Inference Backend State (Supports Vercel env, localStorage, and LAN IP for mobile testing)
  const getInitialBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solarguard_backend_url');
      if (saved) return saved.trim().replace(/\/+$/, '');

      const host = window.location.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('vercel.app')) {
        return `http://${host}:8000`;
      }
    }
    return 'http://127.0.0.1:8000';
  };

  const [backendUrl, setBackendUrlState] = useState(getInitialBackendUrl);

  const setBackendUrl = (url) => {
    const cleanUrl = url ? url.trim().replace(/\/+$/, '') : 'http://127.0.0.1:8000';
    setBackendUrlState(cleanUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('solarguard_backend_url', cleanUrl);
    }
  };

  const [modelStatus, setModelStatus] = useState({
    isConnected: false,
    isLoaded: false,
    modelName: 'SolarGuard MobileNetV3-Small',
    classes: ['crack', 'dust', 'bird_droppings', 'snow', 'clean'],
    device: 'cpu',
    checkpointPath: '',
    error: null,
    lastPing: null,
  });


  // Cleaning Mechanism State
  const [cleaningState, setCleaningState] = useState({
    status: 'idle', // 'idle' | 'wiping' | 'cooldown' | 'fault' | 'stopped'
    progress: 0,
    cooldownRemaining: 0,
    lastCleaned: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    autoCleaningEnabled: false,
    history: INITIAL_CLEANING_LOGS
  });

  // Connectivity Status
  const [systemStatus, setSystemStatus] = useState({
    esp32: { connected: true, ip: '192.168.1.150', latencyMs: 18, lastSeen: new Date().toISOString() },
    mlService: { connected: true, model: 'MobileNetV3-Solar', latencyMs: 45 },
    mongoDb: { connected: true, status: 'Ready for Storage Sync', pingMs: 24 },
    camera: { connected: true, source: 'Integrated Webcam / Mobile Stream' }
  });

  // Motorola Edge 50 preview frame toggle (for testing/evaluating mobile view)
  const [mobilePreviewMode, setMobilePreviewMode] = useState(false);

  // Total Power Calculation
  const totalPower = panels.reduce((sum, p) => sum + (p.status !== 'offline' ? p.power_w : 0), 0);

  // Timer Ref for Wipe Animation & Cooldown
  const wipeIntervalRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  // Helper to append alerts avoiding duplicates
  const addAlert = (newAlert) => {
    setAlerts((prev) => [
      {
        id: `ALT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        ...newAlert
      },
      ...prev
    ]);
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (cleaningState.status === 'cooldown' && cleaningState.cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCleaningState((prev) => {
          if (prev.cooldownRemaining <= 1) {
            clearInterval(cooldownIntervalRef.current);
            return { ...prev, status: 'idle', cooldownRemaining: 0 };
          }
          return { ...prev, cooldownRemaining: prev.cooldownRemaining - 1 };
        });
      }, 1000);

      return () => clearInterval(cooldownIntervalRef.current);
    }
  }, [cleaningState.status, cleaningState.cooldownRemaining]);

  // Telemetry Simulation loop (Only active when isDemoMode is TRUE)
  useEffect(() => {
    if (!isDemoMode) {
      // In Real hardware mode, if no backend server is answering, show hardware disconnected
      setSystemStatus((prev) => ({
        ...prev,
        esp32: { ...prev.esp32, connected: false },
        mongoDb: { ...prev.mongoDb, connected: false }
      }));
      return;
    }

    setSystemStatus((prev) => ({
      ...prev,
      esp32: { ...prev.esp32, connected: true },
      mongoDb: { ...prev.mongoDb, connected: true }
    }));

    const interval = setInterval(() => {
      setLastUpdated(new Date());

      setPanels((prevPanels) => {
        return prevPanels.map((p) => {
          // Add small jitter
          const jitterV = (Math.random() * 0.04 - 0.02);
          const jitterA = (Math.random() * 0.006 - 0.003);

          let baseV = 5.4;
          let baseA = 0.185;
          let status = 'optimal';

          if (activeScenario === 'normal') {
            baseV = 5.4 + jitterV;
            baseA = 0.185 + jitterA;
          } else if (activeScenario === 'shaded_panel_2') {
            if (p.id === 2) {
              baseV = 4.82 + jitterV;
              baseA = 0.086 + jitterA;
              status = 'warning';
            } else {
              baseV = 5.4 + jitterV;
              baseA = 0.185 + jitterA;
            }
          } else if (activeScenario === 'thermal_alert') {
            baseV = 5.1 + jitterV;
            baseA = 0.17 + jitterA;
          } else if (activeScenario === 'surface_crack') {
            if (p.id === 2) {
              baseV = 4.2 + jitterV;
              baseA = 0.05 + jitterA;
              status = 'critical';
            }
          } else if (activeScenario === 'sensor_fault') {
            if (p.id === 3) {
              return { ...p, status: 'offline', voltage_v: 0, current_a: 0, power_w: 0 };
            }
          }

          const voltage = Math.max(0, +(baseV).toFixed(2));
          const current = Math.max(0, +(baseA).toFixed(3));
          const power = +(voltage * current).toFixed(3);

          return {
            ...p,
            voltage_v: voltage,
            current_a: current,
            power_w: power,
            status,
          };
        });
      });

      // Update temperature
      setTemperature((prevTemp) => {
        if (activeScenario === 'thermal_alert') {
          return +(Math.min(64.5, prevTemp + 0.3)).toFixed(1);
        }
        // slight drift around 41-43°C
        return +(41.5 + Math.sin(Date.now() / 15000) * 1.5 + (Math.random() * 0.2 - 0.1)).toFixed(1);
      });

      // Add point to history periodically
      setTelemetryHistory((prev) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const last = prev[prev.length - 1] || {};

        const newPoint = {
          timestamp: now.toISOString(),
          timeFormatted: timeStr,
          panel1_power: panels[0]?.power_w || 1.0,
          panel2_power: panels[1]?.power_w || 0.42,
          panel3_power: panels[2]?.power_w || 0.98,
          total_power: +(totalPower).toFixed(3),
          temperature: temperature,
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });

      // Accumulate daily yield Wh
      setDailyYieldWh((prev) => +(prev + (totalPower * (settings.telemetryIntervalMs / 3600000))).toFixed(3));

    }, settings.telemetryIntervalMs);

    return () => clearInterval(interval);
  }, [isDemoMode, activeScenario, settings.telemetryIntervalMs, totalPower, panels, temperature]);

  // Wiper Trigger Function with Safety Rules
  const triggerWipe = (triggerType = 'Manual') => {
    // Safety Rule 1: Check if crack is detected
    if (inspection.preset?.isDamage) {
      addAlert({
        type: 'DAMAGE_LOCKOUT',
        severity: 'critical',
        panelId: 2,
        title: 'Wiper Command Blocked: Crack Detected',
        message: 'Servo movement aborted. Operating the wiper over fractured glass causes severe abrasive damage.',
        recommendedAction: 'Inspect surface visually and repair damaged cell before clearing lock.'
      });
      return { success: false, reason: 'BLOCKED_DAMAGE' };
    }

    // Safety Rule 2: Check if currently wiping or in cooldown
    if (cleaningState.status === 'wiping') {
      return { success: false, reason: 'ALREADY_WIPING' };
    }

    if (cleaningState.status === 'cooldown') {
      addAlert({
        type: 'COOLDOWN_ACTIVE',
        severity: 'warning',
        panelId: null,
        title: 'Wiper Cooldown Enforced',
        message: `Wiper is resting to avoid SG90 servo overheating (${cleaningState.cooldownRemaining}s remaining).`,
        recommendedAction: 'Wait for cooldown period to finish.'
      });
      return { success: false, reason: 'COOLDOWN_ACTIVE' };
    }

    // Begin wipe sequence
    setCleaningState((prev) => ({
      ...prev,
      status: 'wiping',
      progress: 0
    }));

    const duration = settings.wiperDurationMs || 1800;
    const intervalMs = 50;
    const steps = duration / intervalMs;
    let stepCount = 0;

    wipeIntervalRef.current = setInterval(() => {
      stepCount++;
      const currentProgress = Math.min(100, Math.round((stepCount / steps) * 100));

      setCleaningState((prev) => ({
        ...prev,
        progress: currentProgress
      }));

      if (stepCount >= steps) {
        clearInterval(wipeIntervalRef.current);

        const newLog = {
          id: `CLN-${Date.now().toString().slice(-3)}`,
          timestamp: new Date().toISOString(),
          triggerType,
          durationMs: duration,
          sweepAngle: `${settings.minSweepAngle}° ➔ ${settings.maxSweepAngle}°`,
          status: 'Completed',
          notes: `${triggerType} sweep executed nominally across all 3 panels.`
        };

        setCleaningState((prev) => ({
          ...prev,
          status: 'cooldown',
          progress: 100,
          cooldownRemaining: settings.wiperCooldownSec || 45,
          lastCleaned: new Date().toISOString(),
          history: [newLog, ...prev.history]
        }));

        // If the surface had cleanable debris, simulate that the panel is now cleaned!
        if (inspection.preset?.isCleanable) {
          setInspection((prev) => ({
            ...prev,
            preset: INSPECTION_PRESETS.find((p) => p.className === 'clean') || INSPECTION_PRESETS[1],
            timestamp: new Date().toISOString(),
          }));

          // If Panel 2 was shaded by debris, restore its output in simulation
          if (activeScenario === 'shaded_panel_2') {
            setActiveScenario('normal');
          }

          addAlert({
            type: 'CLEANING_COMPLETED',
            severity: 'info',
            panelId: 2,
            title: 'Panel Surface Cleaned',
            message: 'Wiper successfully cleared surface obstruction. Output recovering to nominal baseline.',
            recommendedAction: 'Monitor panel recovery curve'
          });
        }
      }
    }, intervalMs);

    return { success: true };
  };

  // Emergency stop function
  const emergencyStop = () => {
    if (wipeIntervalRef.current) clearInterval(wipeIntervalRef.current);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    setCleaningState((prev) => ({
      ...prev,
      status: 'stopped',
      progress: 0,
      cooldownRemaining: 0
    }));

    addAlert({
      type: 'EMERGENCY_STOP',
      severity: 'critical',
      panelId: null,
      title: 'Emergency Wiper Stop Engaged',
      message: 'Physical cut-off / app emergency stop triggered. Wiper servo power cut.',
      recommendedAction: 'Check mechanical guide rail before resetting'
    });
  };

  // Reset emergency stop
  const resetWiperFault = () => {
    setCleaningState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
      cooldownRemaining: 0
    }));
  };

  // Change inspection preset
  const setInspectionPreset = (presetId) => {
    const selected = INSPECTION_PRESETS.find((p) => p.id === presetId) || INSPECTION_PRESETS[0];
    setInspection((prev) => ({
      ...prev,
      preset: selected,
      timestamp: new Date().toISOString(),
      history: [
        { id: `INSP-${Date.now().toString().slice(-4)}`, ...selected, timestamp: new Date().toISOString() },
        ...prev.history
      ]
    }));

    // If crack preset chosen, trigger safety alert
    if (selected.isDamage) {
      addAlert({
        type: 'DAMAGE_WARNING',
        severity: 'critical',
        panelId: 2,
        title: 'Surface Crack / Breakage Identified',
        message: 'Visual ML inspection classified surface as "crack_or_breakage" with ' + Math.round(selected.confidence * 100) + '% confidence. Automatic wiping locked.',
        recommendedAction: 'Inspect physically and repair damaged panel'
      });
    } else if (selected.isCleanable && cleaningState.autoCleaningEnabled) {
      // Auto cleaning triggered!
      setTimeout(() => {
        triggerWipe('Auto (CV)');
      }, 1000);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  // Clear acknowledged alerts
  const clearAcknowledgedAlerts = () => {
    setAlerts((prev) => prev.filter((a) => !a.acknowledged));
  };

  // Backend health & model check
  const checkBackendStatus = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/model/info`);
      if (res.ok) {
        const data = await res.json();
        setModelStatus({
          isConnected: true,
          isLoaded: data.is_loaded,
          modelName: data.model_name,
          classes: data.supported_classes,
          device: data.device,
          checkpointPath: data.loaded_checkpoint_path || data.configured_checkpoint_path,
          error: data.load_error,
          lastPing: new Date().toLocaleTimeString(),
        });
        setSystemStatus((prev) => ({
          ...prev,
          mlService: { connected: true, model: data.model_name, latencyMs: 12 },
        }));
      } else {
        setModelStatus((prev) => ({ ...prev, isConnected: false, lastPing: new Date().toLocaleTimeString() }));
      }
    } catch (err) {
      setModelStatus((prev) => ({ ...prev, isConnected: false, lastPing: new Date().toLocaleTimeString() }));
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const id = setInterval(checkBackendStatus, 8000);
    return () => clearInterval(id);
  }, [backendUrl]);

  // Live model prediction handler
  const predictLiveImage = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'capture.jpg');

      const res = await fetch(`${backendUrl}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail?.message || `Inference server returned ${res.status}`);
      }

      const data = await res.json();

      const livePreset = {
        id: `INSP-${Date.now().toString().slice(-4)}`,
        title: data.display_name,
        className: data.primary_condition,
        confidence: data.confidence,
        classProbabilities: data.class_probabilities,
        isCleanable: data.is_cleanable,
        isDamage: data.is_damage_detected,
        wiperAction: data.wiper_action,
        recommendedAction: data.safety_message,
        timestamp: data.timestamp,
        svgType: data.primary_condition,
        isGenuineModelPrediction: true,
      };

      setInspection((prev) => ({
        ...prev,
        preset: livePreset,
        timestamp: data.timestamp,
        history: [livePreset, ...prev.history.slice(0, 19)],
      }));

      // Damage safety lockout
      if (data.is_damage_detected) {
        addAlert({
          type: 'DAMAGE_LOCKOUT',
          severity: 'critical',
          panelId: null,
          title: 'MobileNetV3 Flagged Surface Crack',
          message: data.safety_message,
          recommendedAction: 'Automatic wiping is locked to protect panel glass. Manual inspection required.',
        });
      } else if (data.is_cleanable && cleaningState.autoCleaningEnabled && cleaningState.status === 'idle') {
        setTimeout(() => triggerWipe('Auto (CV - Live Model)'), 800);
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to run live model inference:', err);
      return { success: false, error: err.message };
    }
  };

  // Toggle auto cleaning
  const toggleAutoCleaning = () => {
    setCleaningState((prev) => {
      const next = !prev.autoCleaningEnabled;
      // If turned on and current surface is cleanable, trigger cleaning
      if (next && inspection.preset?.isCleanable && prev.status === 'idle') {
        setTimeout(() => triggerWipe('Auto (CV)'), 500);
      }
      return { ...prev, autoCleaningEnabled: next };
    });
  };

  return (
    <SolarGuardContext.Provider
      value={{
        settings,
        setSettings,
        isDemoMode,
        setIsDemoMode,
        activeScenario,
        setActiveScenario,
        panels,
        temperature,
        totalPower,
        dailyYieldWh,
        telemetryHistory,
        lastUpdated,
        alerts,
        acknowledgeAlert,
        clearAcknowledgedAlerts,
        addAlert,
        inspection,
        setInspectionPreset,
        setInspection,
        cleaningState,
        triggerWipe,
        emergencyStop,
        resetWiperFault,
        toggleAutoCleaning,
        systemStatus,
        setSystemStatus,
        mobilePreviewMode,
        setMobilePreviewMode,
        backendUrl,
        setBackendUrl,
        modelStatus,
        checkBackendStatus,
        predictLiveImage,
      }}
    >
      {children}
    </SolarGuardContext.Provider>
  );

}

export function useSolarGuard() {
  const context = useContext(SolarGuardContext);
  if (!context) {
    throw new Error('useSolarGuard must be used within a SolarGuardProvider');
  }
  return context;
}
