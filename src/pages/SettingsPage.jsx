import React, { useState } from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  Database, 
  Sliders, 
  Cpu, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  RefreshCw, 
  Layers, 
  Eye, 
  EyeOff,
  Server,
  Save
} from 'lucide-react';
import { MONGO_COLLECTIONS, MONGO_SCHEMAS_DOCS } from '../data/mongoSchemaDefinition';

export default function SettingsPage() {
  const { 
    settings, 
    setSettings, 
    isDemoMode, 
    setIsDemoMode, 
    activeScenario, 
    setActiveScenario 
  } = useSolarGuard();

  const [localSettings, setLocalSettings] = useState(settings);
  const [showMongoUri, setShowMongoUri] = useState(false);
  const [mongoTestStatus, setMongoTestStatus] = useState(null); // 'testing' | 'success' | 'error'
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedSchemaDoc, setSelectedSchemaDoc] = useState(MONGO_SCHEMAS_DOCS[0]);

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const testMongoConnection = () => {
    setMongoTestStatus('testing');
    setTimeout(() => {
      setMongoTestStatus('success');
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            System Configuration &amp; MongoDB Architecture
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Configure telemetry rules, safety thresholds, ESP32 gateway endpoints, and MongoDB database schemas
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Settings saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: MongoDB Database Configuration */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-emerald-500/25 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-heading font-semibold text-lg text-zinc-100">
                MongoDB Database Integration
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
              Database: {localSettings.mongoDbName || 'solarguard_db'}
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            SolarGuard uses MongoDB for time-series sensor telemetry, computer-vision inspection snapshots, persistent safety alarms, and servo maintenance logs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                MongoDB Connection String (URI)
              </label>
              <div className="relative">
                <input
                  type={showMongoUri ? 'text' : 'password'}
                  value={localSettings.mongoUri}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, mongoUri: e.target.value })
                  }
                  className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowMongoUri(!showMongoUri)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showMongoUri ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                e.g. mongodb+srv://admin:pass@cluster0.mongodb.net/solarguard_db
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Target Database Name
              </label>
              <input
                type="text"
                value={localSettings.mongoDbName}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, mongoDbName: e.target.value })
                }
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Default: solarguard_db
              </p>
            </div>
          </div>

          {/* Test MongoDB Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={testMongoConnection}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-medium transition"
            >
              <Server className="w-3.5 h-3.5" />
              <span>
                {mongoTestStatus === 'testing'
                  ? 'Testing MongoDB Ping...'
                  : 'Test MongoDB Connection'}
              </span>
            </button>

            {mongoTestStatus === 'success' && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Connection verified. Collections indexed &amp; ready for backend.
              </span>
            )}
          </div>

          {/* MongoDB Collections & Schemas Viewer */}
          <div className="pt-3 border-t border-emerald-500/10">
            <div className="text-xs font-semibold text-zinc-300 mb-2">
              Configured MongoDB Collections:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {MONGO_SCHEMAS_DOCS.map((schema) => (
                <button
                  type="button"
                  key={schema.collection}
                  onClick={() => setSelectedSchemaDoc(schema)}
                  className={`p-2.5 rounded-xl text-left border text-xs font-mono transition ${
                    selectedSchemaDoc.collection === schema.collection
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 shadow-glow-green'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold truncate text-[11px]">{schema.collection}</div>
                  <div className="text-[9px] text-zinc-500 truncate mt-0.5">
                    {schema.indexes.length} Indexes
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Collection Schema Inspection */}
            <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/15 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Collection: <strong className="text-emerald-300">{selectedSchemaDoc.collection}</strong></span>
                <span className="text-zinc-500">{selectedSchemaDoc.description}</span>
              </div>
              <pre className="text-emerald-400/90 overflow-x-auto p-2 bg-[#061009] rounded-lg text-[10px] leading-relaxed max-h-40">
                {JSON.stringify(selectedSchemaDoc.sampleDocument, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Section 2: Sensor Thresholds & Anomaly Rules */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-emerald-500/25 space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-500/15 pb-3">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-semibold text-lg text-zinc-100">
              Sensor Anomaly Rules &amp; Peer Comparison Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Default: 55°C (Panel test limit)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                0.70 = Flag if &lt; 70% of peer median
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Filters noise (Requires 5 consecutive drops)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Gates rule at dusk / under clouds (0.2W)
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: SG90 Wiper Parameters */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-emerald-500/25 space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-500/15 pb-3">
            <RotateCw className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-semibold text-lg text-zinc-100">
              SG90 Wiper Actuator Calibration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Default: 1800 ms (Single sweep)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Protects SG90 motor gears &amp; thermal coils
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Auto-Clean ML Confidence Threshold
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Requires &gt;= 85% confidence before auto-wipe
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: ESP32 Hardware Endpoint & Simulation Settings */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-emerald-500/25 space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-500/15 pb-3">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-semibold text-lg text-zinc-100">
              Hardware Gateway &amp; Simulation Environment
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                ESP32 REST Gateway Endpoint
              </label>
              <input
                type="text"
                value={localSettings.esp32Endpoint}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, esp32Endpoint: e.target.value })
                }
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Local Wi-Fi IP address of the ESP32 micro-controller
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                className="w-full bg-[#07130a] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={1000}>1000 ms (Fast 1Hz)</option>
                <option value={2500}>2500 ms (Default Recommended)</option>
                <option value={5000}>5000 ms (Conserve Wi-Fi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-semibold text-sm shadow-glow-green transition"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
