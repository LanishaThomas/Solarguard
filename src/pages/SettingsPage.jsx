import React, { useState } from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  Sliders, 
  Cpu, 
  RotateCw, 
  CheckCircle2, 
  Save,
  Database,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    settings, 
    setSettings,
    modelStatus,
    backendUrl,
    mqttStatus,
    mqttLastError,
    sendMqttTestPulse,
    systemStatus
  } = useSolarGuard();

  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  const handleTestPulse = () => {
    const res = sendMqttTestPulse();
    setTestFeedback(res);
    setTimeout(() => setTestFeedback(null), 6000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
              System &amp; Actuator Configuration
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Configure telemetry rules, safety thresholds, and SG90 servo sweep parameters
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-600" /> Settings saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Sensor Thresholds & Anomaly Rules */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              Sensor Anomaly Rules &amp; Peer Comparison
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DS18B20 Temp Alert (°C)
              </label>
              <input
                type="number"
                min="30"
                max="85"
                value={localSettings.tempAlertThresholdC}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    tempAlertThresholdC: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 55°C</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peer Drop Ratio Threshold
              </label>
              <input
                type="number"
                step="0.05"
                min="0.4"
                max="0.9"
                value={localSettings.peerDropThreshold}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    peerDropThreshold: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                0.70 = Flag if &lt; 70% of peer median
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consecutive Alert Samples
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={localSettings.consecutiveAlertSamples}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    consecutiveAlertSamples: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Noise filter (5 consecutive drops)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Sunlight Baseline (W)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="1.0"
                value={localSettings.minSunlightThresholdW}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    minSunlightThresholdW: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Gates rule at dusk / dark (0.2W)
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: SG90 Wiper Parameters */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <RotateCw className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              SG90 Wiper Actuator Calibration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sweep Duration (ms)
              </label>
              <input
                type="number"
                step="100"
                min="800"
                max="5000"
                value={localSettings.wiperDurationMs}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    wiperDurationMs: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 1800 ms per sweep</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Cooldown (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={localSettings.wiperCooldownSec}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    wiperCooldownSec: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Protects SG90 servo motor from heat
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auto-Clean Confidence Threshold
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="0.99"
                value={localSettings.autoCleanMinConfidence}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    autoCleanMinConfidence: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Requires &gt;= 85% confidence to trigger auto-wipe
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: EMQX Cloud MQTT Broker & ESP32 Link */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
                  EMQX Cloud MQTT Broker &amp; ESP32 Link
                </h3>
                <p className="text-xs text-slate-500">
                  Connects the React web app directly to the ESP32 SG90 wiper &amp; DS18B20 sensor via EMQX Cloud
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                localSettings.mqttEnabled
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${localSettings.mqttEnabled ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`}></span>
                {localSettings.mqttEnabled ? 'EMQX Enabled' : 'EMQX Disabled'}
              </span>
            </div>
          </div>

          {/* Quick preset selector */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
            <span className="text-xs font-semibold text-slate-700">Quick Configuration:</span>
            <button
              type="button"
              onClick={() => {
                setLocalSettings({
                  ...localSettings,
                  mqttEnabled: true,
                  mqttBroker: 'v20f2113.ala.asia-southeast1.emqxsl.com',
                  mqttPort: 8084,
                  mqttPath: '/mqtt',
                  mqttUseTls: true,
                  mqttTopicPrefix: 'solarguard'
                });
              }}
              className="text-xs px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium transition"
            >
              ⚡ Load Solarguard EMQX Cluster (v20f2113)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EMQX Broker Host / Address
              </label>
              <input
                type="text"
                value={localSettings.mqttBroker || ''}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, mqttBroker: e.target.value.trim() })
                }
                placeholder="v20f2113.ala.asia-southeast1.emqxsl.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                EMQX Serverless Host: <code>v20f2113.ala.asia-southeast1.emqxsl.com</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WebSocket TLS Port (WSS)
              </label>
              <input
                type="number"
                value={localSettings.mqttPort || 8084}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, mqttPort: Number(e.target.value) })
                }
                placeholder="8084"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Port 8084 (EMQX WebSocket over TLS/SSL)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EMQX Client Username
              </label>
              <input
                type="text"
                value={localSettings.mqttUsername || ''}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, mqttUsername: e.target.value })
                }
                placeholder="Created in EMQX Access Control"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Configured in EMQX Console &gt; Access Control</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EMQX Client Password
              </label>
              <input
                type="password"
                value={localSettings.mqttPassword || ''}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, mqttPassword: e.target.value })
                }
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic Prefix
              </label>
              <input
                type="text"
                value={localSettings.mqttTopicPrefix || 'solarguard'}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, mqttTopicPrefix: e.target.value.trim() })
                }
                placeholder="solarguard"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: <code>solarguard</code></p>
            </div>
          </div>

          {/* Live MQTT Diagnostics & Connection Pulse */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  mqttStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                  mqttStatus === 'connecting' ? 'bg-amber-400 animate-ping' :
                  'bg-rose-500'
                }`}></span>
                <span className="font-heading font-semibold text-xs uppercase tracking-wider text-slate-200">
                  Live EMQX Diagnostics &amp; Handshake Console
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                WSS: <code>{localSettings.mqttBroker}:{localSettings.mqttPort}/mqtt</code>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[11px] uppercase">1. Web App ➔ EMQX Broker:</span>
                <span className={`font-bold ${
                  mqttStatus === 'connected' ? 'text-emerald-400' :
                  mqttStatus === 'connecting' ? 'text-amber-300' :
                  'text-rose-400'
                }`}>
                  {mqttStatus === 'connected' ? 'CONNECTED (TLS 8084)' :
                   mqttStatus === 'connecting' ? 'CONNECTING...' :
                   `DISCONNECTED ${mqttLastError ? `(${mqttLastError})` : ''}`}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[11px] uppercase">2. ESP32 Microcontroller:</span>
                <span className={`font-bold ${systemStatus.esp32.connected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {systemStatus.esp32.connected ? `ONLINE (${systemStatus.esp32.lastSeen || 'active'})` : 'STANDBY (No heartbeat yet)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-slate-400 leading-snug">
                Click the test pulse button to dispatch an immediate <code>WIPE</code> command to <code>solarguard/wiper/command</code> and verify communication.
              </p>
              <button
                type="button"
                onClick={handleTestPulse}
                className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" /> 🧪 Test Wiper Pulse (MQTT Ping)
              </button>
            </div>

            {testFeedback && (
              <div className={`p-2.5 rounded-lg text-xs font-mono border ${
                testFeedback.success 
                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300' 
                  : 'bg-rose-950/60 border-rose-600/50 text-rose-300'
              }`}>
                {testFeedback.message}
              </div>
            )}
          </div>

          {/* Pinout hardware mapping summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mt-2">
            <div className="font-heading font-semibold text-xs text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Current Breadboard Hardware Connections</span>
              <span className="text-[11px] font-mono text-blue-600">Firmware: solarguard_esp32_wiper.ino</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                <span className="block font-bold text-slate-900">3V3</span>
                <span className="text-[10px] text-slate-500">Sensor Rail</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                <span className="block font-bold text-slate-900">GND</span>
                <span className="text-[10px] text-slate-500">Common GND</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                <span className="block font-bold text-slate-900">GPIO 21</span>
                <span className="text-[10px] text-slate-500">Shared SDA</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                <span className="block font-bold text-slate-900">GPIO 22</span>
                <span className="text-[10px] text-slate-500">Shared SCL</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                <span className="block font-bold text-amber-600">GPIO 4</span>
                <span className="text-[10px] text-slate-500">DS18B20 Temp</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                <span className="block font-bold text-blue-600">GPIO 18</span>
                <span className="text-[10px] text-slate-500">SG90 Wiper</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-sm shadow-md transition"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
