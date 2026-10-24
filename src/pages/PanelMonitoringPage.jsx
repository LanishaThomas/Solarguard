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
    settings, 
    activeScenario, 
    setActiveScenario 
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
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            Panel Electrical Telemetry &amp; Shunt Analytics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            High-precision voltage and current sensing per panel using dedicated INA219 modules
          </p>
        </div>

        {/* Panel Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start">
          {panels.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanelId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition ${
                activePanelId === p.id
                  ? 'bg-emerald-600 text-white shadow-glow-green'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              Panel {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Panel Deep-Dive Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border-emerald-500/25 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-heading font-bold text-lg">
              P{currentPanel.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg sm:text-xl text-zinc-100">
                  {currentPanel.name}
                </h3>
                <StatusBadge status={health.status} text={health.status.toUpperCase()} size="xs" />
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                {currentPanel.channel} • I2C Address: <span className="text-emerald-400">{currentPanel.i2c_address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
              Shunt Resistor: 0.100 Ω
            </span>
          </div>
        </div>

        {/* 4 Sensor Metric Cards for this panel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-[#0b160f] border border-emerald-500/15">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Bus Voltage</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 mt-1">
              {formatVoltage(currentPanel.voltage_v)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Nominal: 5.5V open-circuit</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b160f] border border-emerald-500/15">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Load Current</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 mt-1">
              {formatCurrent(currentPanel.current_a)}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Shunt drop: {shuntMv} mV</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b160f] border border-emerald-500/15">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Calculated Power</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 mt-1">
              {formatPower(currentPanel.power_w)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">P = V × I</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b160f] border border-emerald-500/15">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Thermal Backing</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatTemperature(currentPanel.temperature_c)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Probe attached</div>
          </div>
        </div>

        {/* Selected Panel History Chart */}
        <div className="bg-black/40 rounded-xl p-3 border border-emerald-500/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Recent Output Trend — {currentPanel.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">[Simulated Time-Series]</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#14261b" vertical={false} />
                <XAxis dataKey="timeFormatted" stroke="#52525b" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis stroke="#52525b" tick={{ fontSize: 9 }} tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1a11',
                    borderColor: 'rgba(52, 211, 153, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`${Number(val).toFixed(3)} W`, `${currentPanel.name} Power`]}
                />
                <Line
                  type="monotone"
                  dataKey={`panel${currentPanel.id}_power`}
                  name={currentPanel.name}
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#34d399' }}
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
