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

  const powers = allPanels.map((p) => p.power_w);
  const medianPower = calculateMedian(powers);

  if (panel.status === 'offline') {
    return {
      status: 'offline',
      severity: 'critical',
      message: 'INA219 sensor communication timed out',
      deviationPercent: 0,
      medianPower,
    };
  }

  // If dusk or heavy clouds
  if (medianPower < minSunlightW) {
    return {
      status: 'low_ambient_light',
      severity: 'info',
      message: 'Ambient sunlight below comparison baseline (< 0.2W)',
      deviationPercent: 0,
      medianPower,
    };
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
