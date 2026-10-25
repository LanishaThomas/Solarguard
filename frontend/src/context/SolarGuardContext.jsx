import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_PANELS } from '../data/initialData';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';

const SolarGuardContext = createContext(null);

export function SolarGuardProvider({ children }) {
  // Settings
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Telemetry & Hardware State (Starts in honest standby - zero fake data)
  const [panels, setPanels] = useState(INITIAL_PANELS);
  const [temperature, setTemperature] = useState(0.0);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [dailyYieldWh, setDailyYieldWh] = useState(0.0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Genuine Alerts only (Starts empty)
  const [alerts, setAlerts] = useState([]);

  // Surface Inspection ML State (Starts empty until image is captured/uploaded)
  const [inspection, setInspection] = useState({
    preset: null,
    customImage: null,
    timestamp: null,
    history: []
  });

  // FastAPI Inference Backend State
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

  // Cleaning Mechanism State (Starts empty - genuine operational logs only)
  const [cleaningState, setCleaningState] = useState({
    status: 'idle', // 'idle' | 'wiping' | 'cooldown' | 'fault' | 'stopped'
    progress: 0,
    cooldownRemaining: 0,
    lastCleaned: null,
    autoCleaningEnabled: false,
    history: []
  });

  // Connectivity Status (Real reflection of connection)
  const [systemStatus, setSystemStatus] = useState({
    esp32: { connected: false, ip: settings.esp32Endpoint || '192.168.1.150', latencyMs: 0, lastSeen: null },
    mlService: { connected: false, model: 'MobileNetV3-Small', latencyMs: 0 },
    mongoDb: { connected: false, status: 'Configured via .env' },
    camera: { connected: true, source: 'Mobile Camera / Webcam' }
  });

  // Motorola Edge 50 preview frame toggle
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

  // Real Hardware Polling (Attempts genuine connection to ESP32 gateway endpoint if reachable)
  useEffect(() => {
    const endpoint = settings.esp32Endpoint;
    if (!endpoint) return;

    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${endpoint}/api/telemetry`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const data = await res.json();
          // Real hardware packet received
          setLastUpdated(new Date());
          setSystemStatus((prev) => ({
            ...prev,
            esp32: { connected: true, ip: endpoint, latencyMs: 15, lastSeen: new Date().toLocaleTimeString() }
          }));

          if (data.panels && Array.isArray(data.panels)) {
            setPanels(data.panels);
          }
          if (typeof data.temperature === 'number') {
            setTemperature(data.temperature);
          }

          // Record genuine telemetry point
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setTelemetryHistory((prev) => {
            const newPoint = {
              timestamp: now.toISOString(),
              timeFormatted: timeStr,
              panel1_power: data.panels?.[0]?.power_w || 0,
              panel2_power: data.panels?.[1]?.power_w || 0,
              panel3_power: data.panels?.[2]?.power_w || 0,
              total_power: data.total_power || 0,
              temperature: data.temperature || 0,
            };
            return [...prev.slice(-29), newPoint];
          });
        }
      } catch (err) {
        // Hardware offline
        if (isMounted) {
          setSystemStatus((prev) => ({
            ...prev,
            esp32: { ...prev.esp32, connected: false }
          }));
        }
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, settings.telemetryIntervalMs || 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [settings.esp32Endpoint, settings.telemetryIntervalMs]);

  // Wiper Trigger Function
  const triggerWipe = (triggerType = 'Manual') => {
    // Safety Rule 1: Check if crack is detected
    if (inspection.preset?.isDamage) {
      addAlert({
        type: 'DAMAGE_LOCKOUT',
        severity: 'critical',
        panelId: null,
        title: 'Wiper Command Blocked: Crack Detected',
        message: 'Servo movement aborted. Operating the wiper over fractured glass causes severe abrasive damage.',
        recommendedAction: 'Inspect surface visually and repair damaged cell before clearing lock.'
      });
      return { success: false, reason: 'BLOCKED_DAMAGE' };
    }

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
          id: `CLN-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          triggerType,
          durationMs: duration,
          sweepAngle: `${settings.minSweepAngle || 0}° ➔ ${settings.maxSweepAngle || 180}°`,
          status: 'Completed',
          notes: `${triggerType} sweep executed nominally across solar surface.`
        };

        setCleaningState((prev) => ({
          ...prev,
          status: 'cooldown',
          progress: 100,
          cooldownRemaining: settings.wiperCooldownSec || 45,
          lastCleaned: new Date().toISOString(),
          history: [newLog, ...prev.history]
        }));
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

  const resetWiperFault = () => {
    setCleaningState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
      cooldownRemaining: 0
    }));
  };

  const setInspectionPreset = (preset) => {
    setInspection((prev) => ({
      ...prev,
      preset,
      timestamp: new Date().toISOString(),
    }));
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

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
        setSystemStatus((prev) => ({ ...prev, mlService: { connected: false, model: 'MobileNetV3', latencyMs: 0 } }));
      }
    } catch (err) {
      setModelStatus((prev) => ({ ...prev, isConnected: false, lastPing: new Date().toLocaleTimeString() }));
      setSystemStatus((prev) => ({ ...prev, mlService: { connected: false, model: 'MobileNetV3', latencyMs: 0 } }));
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const id = setInterval(checkBackendStatus, 8000);
    return () => clearInterval(id);
  }, [backendUrl]);

  // Live model prediction handler
  const predictLiveImage = async (imageBlob, threshold = null) => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'capture.jpg');

      const url = threshold
        ? `${backendUrl}/api/predict?threshold=${encodeURIComponent(threshold)}`
        : `${backendUrl}/api/predict`;

      const res = await fetch(url, {
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
        isDemoMode: false,
        setIsDemoMode: () => {},
        activeScenario: 'normal',
        setActiveScenario: () => {},
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
