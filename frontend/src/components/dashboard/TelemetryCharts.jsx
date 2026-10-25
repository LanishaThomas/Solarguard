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
  const [activeChart, setActiveChart] = useState('power'); // 'power' | 'temperature'

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
      {/* Header with Chart Type Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              Live &amp; Historical Telemetry
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Real-time streaming trends from INA219 shunts and DS18B20 probe
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveChart('power')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeChart === 'power'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Power (W)</span>
          </button>

          <button
            onClick={() => setActiveChart('temperature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeChart === 'temperature'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="timeFormatted"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                unit="W"
                domain={[0, 'dataMax + 0.5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Line
                type="monotone"
                dataKey="panel1_power"
                name="Panel 1"
                stroke="#0284c7"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="panel2_power"
                name="Panel 2"
                stroke="#f59e0b"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="panel3_power"
                name="Panel 3"
                stroke="#6366f1"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="timeFormatted"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                unit="°C"
                domain={[20, 75]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(val) => [`${Number(val).toFixed(1)} °C`, 'Temperature']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine
                y={maxTempThreshold}
                label={{
                  value: `Threshold (${maxTempThreshold}°C)`,
                  fill: '#e11d48',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
                stroke="#e11d48"
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Panel Surface Temp (DS18B20)"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Hardware sampling interval: 2500ms</span>
        <span className="text-blue-600 font-medium">Interactive Tooltip Enabled</span>
      </div>
    </div>
  );
}

