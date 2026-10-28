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
  ShieldAlert,
  Mail,
  Send
} from 'lucide-react';

export default function SettingsPage() {
  const {
    settings,
    setSettings,
    modelStatus,
    backendUrl,
    saveNotificationSettingsToDb,
    sendTestNotificationEmail
  } = useSolarGuard();

  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [mongoSaved, setMongoSaved] = useState(false);

  const handleTestEmail = async () => {
    if (!localSettings.notificationEmail || !localSettings.notificationEmail.includes('@')) {
      setEmailStatus({
        loading: false,
        success: false,
        message: 'Please enter a valid email address first.'
      });
      return;
    }

    setEmailStatus({ loading: true, message: 'Dispatching test notification email...' });
    if (saveNotificationSettingsToDb) {
      await saveNotificationSettingsToDb({
        notification_email: localSettings.notificationEmail,
        resend_api_key: localSettings.resendApiKey || null,
        brevo_api_key: localSettings.brevoApiKey || null,
        smtp_host: localSettings.smtpHost || null,
        smtp_port: Number(localSettings.smtpPort) || 587,
        smtp_user: localSettings.smtpUser || null,
        smtp_pass: localSettings.smtpPass || null,
      });
    }

    if (sendTestNotificationEmail) {
      const res = await sendTestNotificationEmail(localSettings.notificationEmail);
      if (res && res.success) {
        setEmailStatus({
          loading: false,
          success: true,
          message: res.message || `Test email dispatched to ${localSettings.notificationEmail}! Check your inbox.`
        });
      } else {
        setEmailStatus({
          loading: false,
          success: false,
          message: res?.message || res?.error || 'Failed to dispatch email.'
        });
      }
    }
    setTimeout(() => setEmailStatus(null), 8000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSettings(localSettings);
    setSavedSuccess(true);

    // Persist email settings to MongoDB
    if (localSettings.notificationEmail && saveNotificationSettingsToDb) {
      try {
        const res = await saveNotificationSettingsToDb({
          notification_email: localSettings.notificationEmail,
          resend_api_key: localSettings.resendApiKey || null,
          brevo_api_key: localSettings.brevoApiKey || null,
          smtp_host: localSettings.smtpHost || null,
          smtp_port: Number(localSettings.smtpPort) || 587,
          smtp_user: localSettings.smtpUser || null,
          smtp_pass: localSettings.smtpPass || null,
        });
        if (res && res.stored_in_db) {
          setMongoSaved(true);
          setTimeout(() => setMongoSaved(false), 3500);
        }
      } catch (err) {
        console.error('Failed to sync settings to MongoDB:', err);
      }
    }
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
                min="0"
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

        {/* Section 2: Critical Alert Email Notifications (MongoDB-Backed) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  Critical Alert Email Notifications
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    MongoDB Synced
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Automated email alerts are stored in MongoDB and pushed <strong>strictly and exclusively</strong> for 3 critical conditions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                <Database className="w-3.5 h-3.5 text-blue-600" /> db.system_settings
              </span>
            </div>
          </div>

          {/* Exclusive 3 Trigger Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🚨</span>
                <div>
                  <h4 className="font-heading font-bold text-xs text-rose-950 uppercase tracking-wide">
                    1. Cracks Found
                  </h4>
                  <p className="text-[11px] text-rose-800/90 mt-1 leading-snug">
                    Triggered when AI vision identifies structural panel micro-cracks or shattered photovoltaic cells.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded mt-2.5 inline-block self-start">
                Wiper Lockout Engaged
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <h4 className="font-heading font-bold text-xs text-amber-950 uppercase tracking-wide">
                    2. Power Problems
                  </h4>
                  <p className="text-[11px] text-amber-800/90 mt-1 leading-snug">
                    Triggered when INA219 sensors detect generation dropping significantly below peer baseline (&gt;35% drop).
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded mt-2.5 inline-block self-start">
                Peer Anomaly Detection
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex flex-col justify-between">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🌡️</span>
                <div>
                  <h4 className="font-heading font-bold text-xs text-orange-950 uppercase tracking-wide">
                    3. Temp &gt; 55°C Limit
                  </h4>
                  <p className="text-[11px] text-orange-800/90 mt-1 leading-snug">
                    Triggered when DS18B20 digital probe measures surface heat exceeding safe operating threshold (55°C).
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded mt-2.5 inline-block self-start">
                Thermal Surge Hazard
              </span>
            </div>
          </div>

          {/* Email Input Field & Test Dispatcher */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Alert Recipient Email Address</span>
                  <span className="text-[11px] text-slate-500 font-normal">Stored in MongoDB database</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={localSettings.notificationEmail || ''}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        notificationEmail: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-sm"
                  />
                  {localSettings.notificationEmail && localSettings.notificationEmail.includes('@') && (
                    <span className="absolute right-3 top-2.5 text-emerald-600 text-xs flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Valid
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={emailStatus?.loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> {emailStatus?.loading ? 'Sending Test...' : '🧪 Send Test Alert Email'}
              </button>
            </div>

            {emailStatus && (
              <div className={`p-3 rounded-lg text-xs font-mono border animate-fade-in ${emailStatus.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {emailStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                  {emailStatus.message}
                </div>
              </div>
            )}

            {mongoSaved && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Notification email updated and stored in MongoDB cluster (<code>solarguard_db.system_settings</code>).
              </div>
            )}
          </div>

        </div>

        {/* Section 3: SG90 Wiper Parameters */}
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
