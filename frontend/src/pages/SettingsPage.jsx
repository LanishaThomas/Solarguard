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
    mqttStatus,
    mqttLastError,
    sendMqttTestPulse,
    systemStatus,
    saveNotificationSettingsToDb,
    sendTestNotificationEmail
  } = useSolarGuard();

  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [mongoSaved, setMongoSaved] = useState(false);
  const [showAdvancedEmail, setShowAdvancedEmail] = useState(false);

  const handleTestPulse = () => {
    const res = sendMqttTestPulse();
    setTestFeedback(res);
    setTimeout(() => setTestFeedback(null), 6000);
  };

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
              <div className={`p-3 rounded-lg text-xs font-mono border animate-fade-in ${
                emailStatus.success 
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

          {/* Collapsible Free Email Provider Options */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <button
              type="button"
              onClick={() => setShowAdvancedEmail(!showAdvancedEmail)}
              className="flex items-center justify-between w-full text-left font-heading font-semibold text-xs text-slate-800 hover:text-blue-600 transition"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" /> Free Email Provider Setup (Resend, Brevo, or Gmail SMTP)
              </span>
              <span className="text-slate-400 text-xs font-mono">{showAdvancedEmail ? '▲ Hide' : '▼ Expand Options'}</span>
            </button>

            {showAdvancedEmail && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-4 text-xs">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  SolarGuard uses free email delivery APIs. You can either enter a free <strong>Resend API Key</strong> (100 free emails/day at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">resend.com</a> with no credit card required) or free <strong>Gmail App Password</strong>. If left blank, alerts are safely logged and stored directly in MongoDB.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                      <span>Resend Free API Key (<code className="text-slate-500">re_...</code>)</span>
                      {settings.resendConfigured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active ({settings.resendApiKeyMasked})
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder={settings.resendConfigured ? `Connected (${settings.resendApiKeyMasked})` : "re_123456789..."}
                      value={localSettings.resendApiKey || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, resendApiKey: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Recommended &bull; 100 emails/day free &bull; 🔒 Stored safely in <code>.env</code> & MongoDB
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Brevo Free API Key (<code className="text-slate-500">xkeysib-...</code>)
                    </label>
                    <input
                      type="password"
                      placeholder="xkeysib-..."
                      value={localSettings.brevoApiKey || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, brevoApiKey: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">300 emails/day free</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-2">Or Use Free Gmail SMTP Relay:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">SMTP Host &amp; Port</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com:587"
                        value={`${localSettings.smtpHost || 'smtp.gmail.com'}:${localSettings.smtpPort || 587}`}
                        disabled
                        className="w-full bg-slate-200/80 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Gmail Address (User)</label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={localSettings.smtpUser || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, smtpUser: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Google App Password (16 chars)</label>
                      <input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={localSettings.smtpPass || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, smtpPass: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
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
                  mqttUsername: 'solarguard',
                  mqttPassword: 'Lanisha@7606',
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
