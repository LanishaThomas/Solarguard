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
    backendUrl
  } = useSolarGuard();

  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

      {/* Backend & Database Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-heading font-semibold text-base text-slate-900">
              Backend &amp; Database Architecture
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Secure Backend Code
          </span>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed">
          MongoDB is securely connected directly inside the backend code. Database credentials and connection strings are stored privately in <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">.env</span> (<code className="text-blue-700">MONGODB_URI</code>) and are never exposed to browser clients.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Inference Backend</div>
              <div className="font-mono text-slate-900 font-bold text-xs mt-0.5 truncate">{backendUrl}</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              modelStatus.isConnected ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {modelStatus.isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
            <div>
              <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider font-mono">MongoDB Storage</div>
              <div className="font-mono text-slate-800 font-bold text-xs mt-0.5">Configured via .env</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
              MONGODB_URI
            </span>
          </div>
        </div>
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

        {/* Section 3: Hardware Gateway Settings */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              Hardware Gateway Endpoint
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ESP32 REST Gateway Endpoint
              </label>
              <input
                type="text"
                value={localSettings.esp32Endpoint}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, esp32Endpoint: e.target.value })
                }
                placeholder="http://192.168.1.150"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                IP address of the physical ESP32 micro-controller on your Wi-Fi
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telemetry Polling Interval
              </label>
              <select
                value={localSettings.telemetryIntervalMs}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    telemetryIntervalMs: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              >
                <option value={1000}>1000 ms (Fast 1Hz)</option>
                <option value={2500}>2500 ms (Standard)</option>
                <option value={5000}>5000 ms (Conserve bandwidth)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Rate of real sensor query requests</p>
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
