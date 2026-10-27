/**
 * Default settings and threshold configurations for SolarGuard
 */

export const DEFAULT_SETTINGS = {
  // Mode configuration
  isDemoMode: true,
  simulationScenario: 'shaded_panel_2', // normal, shaded_panel_2, thermal_alert, surface_crack, sensor_fault
  telemetryIntervalMs: 2500,

  // Thresholds according to SolarGuard_IoT_Project.md
  tempAlertThresholdC: 55,        // DS18B20 Alert limit in °C
  peerDropThreshold: 0.70,        // Flag when power is below 70% of peer-panel median (30% drop)
  consecutiveAlertSamples: 5,     // Require 5 consecutive readings before triggering alert
  minSunlightThresholdW: 0.002,   // 2 mW threshold sensitive to mobile phone flashlight / small panels

  // Wiper parameters
  wiperDurationMs: 1800,
  wiperCooldownSec: 5,
  minSweepAngle: 10,
  maxSweepAngle: 170,
  autoCleaningEnabled: true,
  autoCleanMinConfidence: 0.85,

  // Hardware integration stubs
  esp32Endpoint: 'http://192.168.1.150:8000',
  useI2cMultiplexer: false,
  tcaChannelMap: { panel1: 0, panel2: 1, panel3: 2 },

  // EMQX Cloud MQTT Configuration (loaded from .env or configured by user in Settings)
  mqttEnabled: true,
  mqttBroker: (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_BROKER || import.meta.env?.VITE_MQTT_BROKER)) || 'v20f2113.ala.asia-southeast1.emqxsl.com',
  mqttPort: Number((typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_PORT || import.meta.env?.VITE_MQTT_PORT)) || 8084),
  mqttPath: (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_PATH || import.meta.env?.VITE_MQTT_PATH)) || '/mqtt',
  mqttUseTls: (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_USE_TLS || import.meta.env?.VITE_MQTT_USE_TLS)) !== 'false',
  mqttUsername: (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_USERNAME || import.meta.env?.VITE_MQTT_USERNAME)) || 'solarguard',
  mqttPassword: (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_PASSWORD || import.meta.env?.VITE_MQTT_PASSWORD)) || 'Lanisha@7606',
  mqttTopicPrefix: (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EMQX_TOPIC_PREFIX || import.meta.env?.VITE_MQTT_TOPIC_PREFIX)) || 'solarguard',

  // MongoDB configuration (loaded from .env or configured by user in Settings)
  mongoUri: '',
  mongoDbName: 'solarguard_db',
  mongoSyncEnabled: false,
};
