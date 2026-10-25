/**
 * SolarGuard Baseline Hardware Specifications
 * Zero fake/mock telemetry data. Starts in standby awaiting genuine ESP32 packets and MobileNetV3 inspection.
 */

export const INITIAL_PANELS = [
  {
    id: 1,
    name: 'Panel 1 (Alpha)',
    channel: 'INA219 #1',
    i2c_address: '0x40',
    voltage_v: 0.0,
    current_a: 0.0,
    power_w: 0.0,
    status: 'standby',
    efficiency_pct: 0,
    trend: 'stable',
    temperature_c: 0.0
  },
  {
    id: 2,
    name: 'Panel 2 (Beta)',
    channel: 'INA219 #2',
    i2c_address: '0x41',
    voltage_v: 0.0,
    current_a: 0.0,
    power_w: 0.0,
    status: 'standby',
    efficiency_pct: 0,
    trend: 'stable',
    temperature_c: 0.0
  },
  {
    id: 3,
    name: 'Panel 3 (Gamma)',
    channel: 'INA219 #3',
    i2c_address: '0x44',
    voltage_v: 0.0,
    current_a: 0.0,
    power_w: 0.0,
    status: 'standby',
    efficiency_pct: 0,
    trend: 'stable',
    temperature_c: 0.0
  }
];

// Starts empty — populated strictly by incoming ESP32 / INA219 readings
export function generateInitialHistory() {
  return [];
}

// Starts empty — populated strictly when actual system anomalies occur
export const INITIAL_ALERTS = [];

// Starts empty — populated strictly when actual servo wipe sweeps are triggered
export const INITIAL_CLEANING_LOGS = [];

export const INSPECTION_PRESETS = [];
