import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_PANELS } from '../data/initialData';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import solarGuardMqtt from '../services/mqttClient';

const SolarGuardContext = createContext(null);

export function SolarGuardProvider({ children }) {
  // Settings with LocalStorage Persistence
  const [settings, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem('solarguard_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        // Auto-upgrade stale broker or empty credentials
        if (!merged.mqttUsername || !merged.mqttPassword || merged.mqttBroker?.includes('hivemq')) {
          merged.mqttBroker = DEFAULT_SETTINGS.mqttBroker;
          merged.mqttPort = DEFAULT_SETTINGS.mqttPort;
          merged.mqttUsername = DEFAULT_SETTINGS.mqttUsername || 'solarguard';
          merged.mqttPassword = DEFAULT_SETTINGS.mqttPassword || 'Lanisha@7606';
        }
        return merged;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  const setSettings = (newSettings) => {
    setSettingsState((prev) => {
      const updated = typeof newSettings === 'function' ? newSettings(prev) : { ...prev, ...newSettings };
      try {
        localStorage.setItem('solarguard_settings', JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  // EMQX MQTT Connection Status
  const [mqttStatus, setMqttStatus] = useState('disconnected');
  const [mqttLastError, setMqttLastError] = useState(null);

  // Live MQTT Traffic Monitor (Giving & Taking Data)
  const [mqttTraffic, setMqttTraffic] = useState([]);
  const [mqttStats, setMqttStats] = useState({
    txCount: 0,
    rxCount: 0,
    lastTx: null,
    lastRx: null,
    isTxBlinking: false,
    isRxBlinking: false,
  });

  const clearMqttTraffic = () => setMqttTraffic([]);

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
      if (host && (host.includes('vercel.app') || !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('192.168.'))) {
        return 'https://solarguard-backend.onrender.com';
      }
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
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
    autoCleaningEnabled: true,
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

  // EMQX MQTT Connection & Real-Time ESP32 Synchronization
  useEffect(() => {
    if (!settings.mqttEnabled) {
      solarGuardMqtt.disconnect();
      setMqttStatus('disconnected');
      return;
    }

    solarGuardMqtt.connect({
      broker: settings.mqttBroker || DEFAULT_SETTINGS.mqttBroker,
      port: settings.mqttPort || DEFAULT_SETTINGS.mqttPort,
      useTls: settings.mqttUseTls !== false,
      path: settings.mqttPath || '/mqtt',
      username: (settings.mqttUsername && settings.mqttUsername.trim().length > 0) ? settings.mqttUsername : 'solarguard',
      password: (settings.mqttPassword && settings.mqttPassword.trim().length > 0) ? settings.mqttPassword : 'Lanisha@7606',
      topicPrefix: settings.mqttTopicPrefix || 'solarguard'
    });

    const unsubscribe = solarGuardMqtt.subscribeListener((event, data) => {
      if (event === 'status') {
        setMqttStatus(data.status);
        if (data.status === 'connected') {
          setMqttLastError(null);
          console.log('[App] Connected to EMQX Cloud MQTT broker');
        } else if (data.status === 'error') {
          setMqttLastError(data.error || 'Connection refused or authentication failed');
          setSystemStatus((prev) => ({
            ...prev,
            esp32: { ...prev.esp32, connected: false }
          }));
        } else if (data.status === 'disconnected' || data.status === 'offline') {
          setSystemStatus((prev) => ({
            ...prev,
            esp32: { ...prev.esp32, connected: false }
          }));
        }
      } else if (event === 'tx') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setMqttStats((prev) => ({
          ...prev,
          txCount: prev.txCount + 1,
          lastTx: timeStr,
          isTxBlinking: true
        }));
        setTimeout(() => setMqttStats((p) => ({ ...p, isTxBlinking: false })), 400);

        setMqttTraffic((prev) => [
          {
            id: `TX-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
            dir: 'TX',
            topic: data.topic,
            payload: data.payload,
            raw: data.raw,
            success: data.success,
            error: data.error,
            time: timeStr
          },
          ...prev.slice(0, 49)
        ]);
      } else if (event === 'rx') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setMqttStats((prev) => ({
          ...prev,
          rxCount: prev.rxCount + 1,
          lastRx: timeStr,
          isRxBlinking: true
        }));
        setTimeout(() => setMqttStats((p) => ({ ...p, isRxBlinking: false })), 400);

        setMqttTraffic((prev) => [
          {
            id: `RX-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
            dir: 'RX',
            topic: data.topic,
            payload: data.payload,
            raw: data.raw,
            success: true,
            time: timeStr
          },
          ...prev.slice(0, 49)
        ]);
      } else if (event === 'message') {
        const { topic, payload } = data;
        const prefix = settings.mqttTopicPrefix || 'solarguard';

        // 1. ESP32 Heartbeat / Device status
        if (topic === `${prefix}/status`) {
          setSystemStatus((prev) => ({
            ...prev,
            esp32: {
              connected: payload.online !== false,
              ip: payload.ip || settings.mqttBroker,
              latencyMs: 15,
              lastSeen: new Date().toLocaleTimeString(),
              via: 'EMQX'
            }
          }));
        }

        // 2. DS18B20 Telemetry
        if (topic === `${prefix}/telemetry`) {
          setLastUpdated(new Date());
          setSystemStatus((prev) => ({
            ...prev,
            esp32: {
              connected: true,
              ip: payload.ip || prev.esp32.ip || 'ESP32 (EMQX)',
              latencyMs: 15,
              lastSeen: new Date().toLocaleTimeString(),
              via: 'EMQX'
            }
          }));

          const tempNum = typeof payload.temperature === 'number'
            ? payload.temperature
            : parseFloat(payload.temperature);

          if (!isNaN(tempNum)) {
            const tempVal = parseFloat(tempNum.toFixed(1));
            setTemperature(tempVal);

            // Record genuine telemetry point
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setTelemetryHistory((prev) => {
              const newPoint = {
                timestamp: now.toISOString(),
                timeFormatted: timeStr,
                panel1_power: 0,
                panel2_power: 0,
                panel3_power: 0,
                total_power: 0,
                temperature: tempVal,
              };
              return [...prev.slice(-29), newPoint];
            });

            // Temperature threshold check
            if (tempVal >= settings.tempAlertThresholdC) {
              addAlert({
                type: 'HIGH_TEMPERATURE',
                severity: 'warning',
                panelId: null,
                title: `High Surface Temperature: ${tempVal}°C`,
                message: `DS18B20 sensor on GPIO 4 reported ${tempVal}°C, which exceeds the configured warning threshold (${settings.tempAlertThresholdC}°C).`,
                recommendedAction: 'Inspect thermal conditions to prevent cell stress.'
              });
            }
          }
        }

        // 3. Wiper Status from ESP32
        if (topic === `${prefix}/wiper/status`) {
          const rawState = (payload.state || payload.status || 'idle').toLowerCase();
          const progress = typeof payload.progress === 'number' ? payload.progress : 0;
          const cooldownSec = typeof payload.cooldown_remaining_sec === 'number'
            ? payload.cooldown_remaining_sec
            : settings.wiperCooldownSec || 45;

          setCleaningState((prev) => {
            const isTransitionToCooldown = prev.status === 'wiping' && (rawState === 'cooldown' || rawState === 'idle');
            let updatedHistory = prev.history;

            if (isTransitionToCooldown) {
              const newLog = {
                id: `CLN-${Date.now().toString().slice(-4)}`,
                timestamp: new Date().toISOString(),
                triggerType: payload.trigger || 'EMQX Wiper Sweep',
                durationMs: payload.duration_ms || settings.wiperDurationMs || 1800,
                sweepAngle: `${settings.minSweepAngle || 10}° ➔ ${settings.maxSweepAngle || 170}°`,
                status: 'Completed',
                notes: 'Physical SG90 sweep completed on ESP32 via EMQX.'
              };
              updatedHistory = [newLog, ...prev.history];
            }

            return {
              ...prev,
              status: rawState,
              progress: rawState === 'wiping' ? progress : (rawState === 'cooldown' ? 100 : 0),
              cooldownRemaining: rawState === 'cooldown' ? cooldownSec : (rawState === 'idle' ? 0 : prev.cooldownRemaining),
              lastCleaned: isTransitionToCooldown ? new Date().toISOString() : prev.lastCleaned,
              history: updatedHistory
            };
          });
        }
      }
    });

    return () => {
      unsubscribe();
      solarGuardMqtt.disconnect();
    };
  }, [
    settings.mqttEnabled,
    settings.mqttBroker,
    settings.mqttPort,
    settings.mqttUseTls,
    settings.mqttPath,
    settings.mqttUsername,
    settings.mqttPassword,
    settings.mqttTopicPrefix,
    settings.tempAlertThresholdC,
    settings.wiperCooldownSec,
    settings.wiperDurationMs,
    settings.minSweepAngle,
    settings.maxSweepAngle
  ]);

  // Fallback Hardware Polling (Used only if MQTT is disabled and REST endpoint is set)
  useEffect(() => {
    if (settings.mqttEnabled) return;
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
      } catch {
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
  }, [settings.mqttEnabled, settings.esp32Endpoint, settings.telemetryIntervalMs]);

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

    const duration = settings.wiperDurationMs || 1800;

    // Dispatch command to ESP32 over EMQX MQTT if enabled
    if (settings.mqttEnabled) {
      const dispatched = solarGuardMqtt.sendWiperCommand('WIPE', duration);
      if (!dispatched) {
        addAlert({
          type: 'MQTT_DELIVERY_FAILED',
          severity: 'warning',
          panelId: null,
          title: 'MQTT Command Queued',
          message: 'Connecting to EMQX cloud broker...',
          recommendedAction: 'Check EMQX status in settings.'
        });
      }
    }

    // Begin wipe sequence
    setCleaningState((prev) => ({
      ...prev,
      status: 'wiping',
      progress: 0
    }));

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
          sweepAngle: `${settings.minSweepAngle || 10}° ➔ ${settings.maxSweepAngle || 170}°`,
          status: 'Completed',
          notes: `${triggerType} sweep executed across solar surface.`
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

    if (settings.mqttEnabled) {
      solarGuardMqtt.sendEmergencyStop();
    }

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
    if (settings.mqttEnabled) {
      solarGuardMqtt.sendResetFault();
    }

    setCleaningState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
      cooldownRemaining: 0
    }));
  };

  // Direct MQTT Ping / Wiper Test Pulse
  const sendMqttTestPulse = () => {
    const duration = settings.wiperDurationMs || 1800;
    const sent = solarGuardMqtt.sendWiperCommand('WIPE', duration);
    if (sent) {
      addAlert({
        type: 'MQTT_TEST_SENT',
        severity: 'info',
        panelId: null,
        title: 'EMQX Wiper Command Sent',
        message: 'Published {"command": "WIPE"} to solarguard/wiper/command.',
        recommendedAction: 'Watch SG90 servo arm or Serial monitor.'
      });
      return { success: true, message: 'Command sent to EMQX!' };
    }
    return { success: false, message: 'MQTT client not connected.' };
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

  // Optical surface defect prediction handler (MobileNetV3 Neural Network)
  const predictLiveImage = async (imageBlob, threshold = null) => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'capture.jpg');

      const params = new URLSearchParams();
      if (threshold !== null && threshold !== undefined) {
        params.append('threshold', threshold);
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const url = `${backendUrl}/api/predict${queryStr}`;

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
        modelArchitecture: data.model_architecture,
        engineUsed: data.engine_used,
        engineType: data.engine_type,
        device: data.device,
        inferenceTimeMs: data.inference_time_ms,
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
        setIsDemoMode: () => { },
        activeScenario: 'normal',
        setActiveScenario: () => { },
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
        mqttStatus,
        solarGuardMqtt,
        sendMqttTestPulse,
        mqttTraffic,
        mqttStats,
        clearMqttTraffic,
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
