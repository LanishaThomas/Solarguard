/**
 * Initial mock data and simulated readings for SolarGuard
 * All data is strictly labelled as simulated prototyping telemetry
 */

export const INITIAL_PANELS = [
  {
    id: 1,
    name: 'Panel 1 (Alpha)',
    channel: 'INA219 #1',
    i2c_address: '0x40',
    voltage_v: 5.45,
    current_a: 0.188,
    power_w: 1.025,
    status: 'optimal',
    efficiency_pct: 96,
    trend: 'stable',
    temperature_c: 41.2
  },
  {
    id: 2,
    name: 'Panel 2 (Beta - Shaded)',
    channel: 'INA219 #2',
    i2c_address: '0x41',
    voltage_v: 4.82,
    current_a: 0.088,
    power_w: 0.424,
    status: 'warning',
    efficiency_pct: 58,
    trend: 'decreasing',
    temperature_c: 42.8
  },
  {
    id: 3,
    name: 'Panel 3 (Gamma)',
    channel: 'INA219 #3',
    i2c_address: '0x44',
    voltage_v: 5.39,
    current_a: 0.182,
    power_w: 0.981,
    status: 'optimal',
    efficiency_pct: 94,
    trend: 'stable',
    temperature_c: 41.9
  }
];

// Generate 20 historical readings representing recent operational timeline
export function generateInitialHistory() {
  const points = [];
  const now = new Date();
  
  for (let i = 19; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Panel 1 stable around 1.0W
    const p1 = +(0.98 + Math.sin(i * 0.4) * 0.05 + (Math.random() * 0.04 - 0.02)).toFixed(3);
    // Panel 2 drops around 10 minutes ago simulating debris/leaf
    const p2Drop = i < 12 ? 0.42 : 0.95;
    const p2 = +(p2Drop + Math.sin(i * 0.3) * 0.04 + (Math.random() * 0.03 - 0.015)).toFixed(3);
    // Panel 3 stable around 0.96W
    const p3 = +(0.96 + Math.cos(i * 0.4) * 0.05 + (Math.random() * 0.04 - 0.02)).toFixed(3);
    
    const total = +(p1 + p2 + p3).toFixed(3);
    const temp = +(40.5 + (20 - i) * 0.15 + (Math.random() * 0.4 - 0.2)).toFixed(1);

    points.push({
      timestamp: time.toISOString(),
      timeFormatted: timeStr,
      panel1_power: p1,
      panel2_power: p2,
      panel3_power: p3,
      total_power: total,
      temperature: temp,
    });
  }
  return points;
}

export const INITIAL_ALERTS = [
  {
    id: 'ALT-1092',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    type: 'LOW_OUTPUT',
    severity: 'warning',
    panelId: 2,
    title: 'Panel 2 Output Below Peer Median',
    message: 'Panel 2 generated 0.424W (57% below peer median 0.981W) for 5 consecutive samples.',
    acknowledged: false,
    recommendedAction: 'Inspect panel surface with camera or trigger wiper'
  },
  {
    id: 'ALT-1088',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    type: 'SURFACE_OBSTRUCTION',
    severity: 'warning',
    panelId: 2,
    title: 'Surface Obstruction Suspected',
    message: 'Camera ML model detected "leaves_or_foreign_object" with 92.4% confidence score.',
    acknowledged: true,
    recommendedAction: 'Trigger manual or automatic wiper sweep'
  },
  {
    id: 'ALT-1075',
    timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
    type: 'HARDWARE_STATUS',
    severity: 'info',
    panelId: null,
    title: 'ESP32 Telemetry Link Restored',
    message: 'Heartbeat received over local Wi-Fi. 3x INA219 sensors initialized.',
    acknowledged: true,
    recommendedAction: 'None'
  }
];

export const INITIAL_CLEANING_LOGS = [
  {
    id: 'CLN-801',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    triggerType: 'Manual',
    durationMs: 1800,
    sweepAngle: '15° ➔ 165°',
    status: 'Completed',
    notes: 'Pre-noon scheduled sweep. Wiper ran with zero servo stall.'
  },
  {
    id: 'CLN-800',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    triggerType: 'Auto (CV)',
    durationMs: 1800,
    sweepAngle: '15° ➔ 165°',
    status: 'Completed',
    notes: 'Triggered automatically after dust detection threshold exceeded.'
  }
];

// Presets for surface inspection demonstration
export const INSPECTION_PRESETS = [
  {
    id: 'leaves',
    title: 'Leaves / Foreign Object',
    className: 'leaves_or_foreign_object',
    confidence: 0.92,
    isCleanable: true,
    isDamage: false,
    color: '#f59e0b',
    description: 'Dry leaf debris obstructing upper-left cell quadrant of Panel 2.',
    recommendedAction: 'Wiper cleaning recommended',
    svgType: 'leaf'
  },
  {
    id: 'clean',
    title: 'Clean Surface',
    className: 'clean',
    confidence: 0.97,
    isCleanable: false,
    isDamage: false,
    color: '#10b981',
    description: 'Panel surface is clear with uniform solar cell reflectivity.',
    recommendedAction: 'No action required',
    svgType: 'clean'
  },
  {
    id: 'dust',
    title: 'Fine Dust Layer',
    className: 'dust',
    confidence: 0.88,
    isCleanable: true,
    isDamage: false,
    color: '#eab308',
    description: 'Uniform particulate film reducing transmittance by ~15%.',
    recommendedAction: 'Wiper cleaning recommended',
    svgType: 'dust'
  },
  {
    id: 'bird_droppings',
    title: 'Bird Droppings',
    className: 'bird_droppings',
    confidence: 0.94,
    isCleanable: true,
    isDamage: false,
    color: '#ef4444',
    description: 'Opaque localized soiling causing hot-spot risk.',
    recommendedAction: 'Wiper sweep suggested',
    svgType: 'droppings'
  },
  {
    id: 'crack',
    title: 'Crack / Glass Breakage',
    className: 'crack_or_breakage',
    confidence: 0.91,
    isCleanable: false,
    isDamage: true,
    color: '#dc2626',
    description: 'Surface fracture detected. DO NOT WIPE to prevent mechanical abrasion or water ingress.',
    recommendedAction: 'LOCK WIPER - Alert technician for physical repair',
    svgType: 'crack'
  }
];
