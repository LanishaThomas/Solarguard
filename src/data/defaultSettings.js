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
  minSunlightThresholdW: 0.20,    // Min power to consider sunlight valid (avoids night/dusk flags)

  // Wiper parameters
  wiperDurationMs: 1800,
  wiperCooldownSec: 45,
  minSweepAngle: 10,
  maxSweepAngle: 170,
  autoCleaningEnabled: false,
  autoCleanMinConfidence: 0.85,

  // Hardware integration stubs
  esp32Endpoint: 'http://192.168.1.150:8000',
  useI2cMultiplexer: false,
  tcaChannelMap: { panel1: 0, panel2: 1, panel3: 2 },

  // MongoDB configuration stubs
  mongoUri: 'mongodb+srv://solarguard_app:••••••••••••@cluster0.mongodb.net/solarguard_db?retryWrites=true&w=majority',
  mongoDbName: 'solarguard_db',
  mongoSyncEnabled: false,
};
