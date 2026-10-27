/**
 * SolarGuard Utility Functions
 * Calculation helpers according to SolarGuard IoT specifications
 */

/**
 * Calculates median of an array of numbers
 */
export function calculateMedian(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Evaluates panel health and peer deviation
 * Rule: flag panel when power is below threshold (e.g. 70%) of median of all 3 panels
 * Only evaluate if median power is above min sunlight threshold (e.g. 0.2W)
 */
export function evaluatePanelHealth(panel, allPanels, settings = {}) {
  // Sensitive to mobile phone flashlight / small solar panels (default 2 mW / 0.002 W)
  const minSunlightW = settings.minSunlightW != null ? settings.minSunlightW : 0.002;
  const dropRatio = settings.peerDropThreshold || 0.7; // Below 70% of median (i.e. >30% drop)

  const powers = allPanels.map((p) => p.power_w || 0);
  const voltages = allPanels.map((p) => p.voltage_v || 0);
  const medianPower = calculateMedian(powers);
  const maxVoltage = Math.max(...voltages, 0);

  if (panel.status === 'offline') {
    return {
      status: 'offline',
      severity: 'critical',
      message: 'INA219 sensor communication timed out',
      deviationPercent: 0,
      medianPower,
    };
  }

  // If ESP32 firmware already identified underperformance
  if (panel.flag === 'UNDERPERFORMING' || panel.status === 'warning') {
    const dev = panel.deviation_pct != null ? panel.deviation_pct : -50;
    return {
      status: 'warning',
      severity: 'warning',
      message: `Output is ${Math.abs(Math.round(dev))}% below peer baseline`,
      deviationPercent: Math.round(dev),
      medianPower,
    };
  }

  // If dusk or dark (no significant power and no significant voltage)
  if (medianPower < minSunlightW && maxVoltage < 0.40) {
    return {
      status: 'low_ambient_light',
      severity: 'info',
      message: 'Ambient sunlight in standby (< 2 mW)',
      deviationPercent: 0,
      medianPower,
    };
  }

  // If illuminated under open-circuit (current = 0, but voltage present from flashlight)
  if (medianPower < minSunlightW && maxVoltage >= 0.40) {
    if (panel.voltage_v < maxVoltage * 0.5) {
      const dropPct = Math.round(((maxVoltage - panel.voltage_v) / maxVoltage) * 100);
      return {
        status: 'warning',
        severity: 'warning',
        message: `Voltage is ${dropPct}% below illuminated panel (${maxVoltage.toFixed(2)}V)`,
        deviationPercent: -dropPct,
        medianPower,
      };
    }
  }

  const deviation = medianPower > 0 
    ? ((panel.power_w - medianPower) / medianPower) * 100 
    : 0;

  if (panel.power_w < medianPower * dropRatio) {
    const dropPercent = Math.abs(Math.round(deviation));
    return {
      status: 'warning',
      severity: dropPercent > 50 ? 'critical' : 'warning',
      message: `Output is ${dropPercent}% below peer-panel median (${medianPower.toFixed(2)}W)`,
      deviationPercent: Math.round(deviation),
      medianPower,
    };
  }

  return {
    status: 'optimal',
    severity: 'success',
    message: 'Operating normally within peer tolerances',
    deviationPercent: Math.round(deviation),
    medianPower,
  };
}

/**
 * Evaluates DS18B20 temperature
 */
export function evaluateTemperature(tempC, maxThreshold = 55) {
  if (tempC == null || isNaN(tempC)) {
    return { status: 'fault', severity: 'critical', message: 'DS18B20 sensor disconnected' };
  }
  if (tempC >= maxThreshold + 10) {
    return { status: 'critical', severity: 'critical', message: `Critical thermal surge (${tempC.toFixed(1)}°C) exceeds safe limits` };
  }
  if (tempC >= maxThreshold) {
    return { status: 'warning', severity: 'warning', message: `Panel temperature (${tempC.toFixed(1)}°C) exceeds ${maxThreshold}°C threshold` };
  }
  return { status: 'normal', severity: 'success', message: 'Operating in nominal thermal range' };
}
