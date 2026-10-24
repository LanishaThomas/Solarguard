import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Activity, Zap, Thermometer, Layers } from 'lucide-react';

export default function TelemetryCharts({ history, maxTempThreshold = 55 }) {
  const [activeChart, setActiveChart] = useState('power'); // 'power' | 'temperature' | 'combined'

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
      {/* Header with Chart Type Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
              Live &amp; Historical Telemetry
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time streaming trends from INA219 shunts and DS18B20 probe
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center rounded-xl bg-zinc-900/80 p-1 border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveChart('power')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeChart === 'power'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Power (W)</span>
          </button>

          <button
            onClick={() => setActiveChart('temperature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeChart === 'temperature'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp (°C)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {activeChart === 'power' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16291e" vertical={false} />
              <XAxis
                dataKey="timeFormatted"
                stroke="#52525b"
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                stroke="#52525b"
                tick={{ fontSize: 10 }}
                tickLine={false}
                unit="W"
                domain={[0, 'dataMax + 0.5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1a11',
                  borderColor: 'rgba(52, 211, 153, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val, name) => [`${Number(val).toFixed(3)} W`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="total_power"
                name="Total Power"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Line
                type="monotone"
                dataKey="panel1_power"
                name="Panel 1 (INA219 #1)"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="panel2_power"
                name="Panel 2 (INA219 #2)"
                stroke="#fbbf24"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="panel3_power"
                name="Panel 3 (INA219 #3)"
                stroke="#a78bfa"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16291e" vertical={false} />
              <XAxis
                dataKey="timeFormatted"
                stroke="#52525b"
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                stroke="#52525b"
                tick={{ fontSize: 10 }}
                tickLine={false}
                unit="°C"
                domain={[20, 75]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1a11',
                  borderColor: 'rgba(52, 211, 153, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${Number(val).toFixed(1)} °C`, 'Temperature']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine
                y={maxTempThreshold}
                label={{
                  value: `Threshold (${maxTempThreshold}°C)`,
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
                stroke="#f43f5e"
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Panel Surface Temp (DS18B20)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#34d399' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>Sampling interval: 2500ms</span>
        <span className="text-emerald-400/80">Interactive Tooltip Enabled</span>
      </div>
    </div>
  );
}
