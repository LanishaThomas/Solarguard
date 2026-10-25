import React, { useState } from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  Zap, 
  Activity, 
  Sliders, 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  Gauge, 
  Sun,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { formatVoltage, formatCurrent, formatPower, formatTemperature } from '../utils/formatters';
import { evaluatePanelHealth } from '../utils/calculations';
import StatusBadge from '../components/common/StatusBadge';
import PeerComparisonWidget from '../components/panels/PeerComparisonWidget';
import I2CDiagnostics from '../components/panels/I2CDiagnostics';

export default function PanelMonitoringPage({ selectedPanelId = 1 }) {
  const { 
    panels, 
    telemetryHistory, 
    settings 
  } = useSolarGuard();

  const [activePanelId, setActivePanelId] = useState(selectedPanelId || 1);
  const currentPanel = panels.find((p) => p.id === activePanelId) || panels[0];
  const health = evaluatePanelHealth(currentPanel, panels, settings);

  // Calculate shunt voltage in mV (V_shunt = I * R_shunt, with R_shunt = 0.1 ohm)
  const shuntMv = (currentPanel.current_a * 0.1 * 1000).toFixed(2);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Panel Electrical Telemetry &amp; Shunt Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            High-precision voltage and current sensing per panel using dedicated INA219 modules
          </p>
        </div>

        {/* Panel Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start">
          {panels.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanelId(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition ${
                activePanelId === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Panel {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Panel Deep-Dive Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-heading font-bold text-lg">
              P{currentPanel.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900">
                  {currentPanel.name}
                </h3>
                <StatusBadge status={health.status} text={health.status.toUpperCase()} size="xs" />
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium">
                {currentPanel.channel} • I2C Address: <span className="text-blue-700 font-bold">{currentPanel.i2c_address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-semibold">
              Shunt Resistor: 0.100 Ω (R100)
            </span>
          </div>
        </div>

        {/* 4 Sensor Metric Cards for this panel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Bus Voltage</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-700 mt-1">
              {formatVoltage(currentPanel.voltage_v)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 font-medium">Nominal: 5.5V open-circuit</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Load Current</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrent(currentPanel.current_a)}
            </div>
            <div className="text-[10px] text-blue-700 font-mono mt-1 font-semibold">Shunt drop: {shuntMv} mV</div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-blue-50 border border-amber-200">
            <div className="text-[10px] text-slate-600 uppercase font-mono font-bold">Calculated Power</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatPower(currentPanel.power_w)}
            </div>
            <div className="text-[10px] text-amber-700 font-mono mt-1 font-bold">P = V × I</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Thermal Backing</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1">
              {formatTemperature(currentPanel.temperature_c)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 font-medium">DS18B20 1-Wire Probe</div>
          </div>
        </div>

        {/* Selected Panel History Chart */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" /> Output Trend — {currentPanel.name}
            </span>
            <span className="text-xs font-mono text-slate-500 font-medium">Real-Time Data</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="timeFormatted" stroke="#64748b" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val) => [`${Number(val).toFixed(3)} W`, `${currentPanel.name} Power`]}
                />
                <Line
                  type="monotone"
                  dataKey={`panel${currentPanel.id}_power`}
                  name={currentPanel.name}
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peer Comparison Widget */}
      <PeerComparisonWidget panels={panels} settings={settings} />

      {/* I2C Diagnostics and Wiring */}
      <I2CDiagnostics settings={settings} />
    </div>
  );
}
