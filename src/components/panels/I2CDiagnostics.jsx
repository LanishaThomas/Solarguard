import React from 'react';
import { Cpu, HardDrive, CheckCircle2, AlertCircle, Terminal, Layers } from 'lucide-react';

export default function I2CDiagnostics({ settings }) {
  const i2cChannels = [
    {
      id: 1,
      name: 'INA219 Channel 1',
      address: '0x40',
      shuntResistor: '0.100 Ω (R100)',
      target: 'Panel 1 (Alpha)',
      busVoltageMax: '26.0 V',
      currentRange: '±3.2 A',
      status: 'ACK Received (0x40)',
      wiring: 'SDA GPIO 21 • SCL GPIO 22'
    },
    {
      id: 2,
      name: 'INA219 Channel 2',
      address: '0x41',
      shuntResistor: '0.100 Ω (R100)',
      target: 'Panel 2 (Beta)',
      busVoltageMax: '26.0 V',
      currentRange: '±3.2 A',
      status: 'ACK Received (0x41 - A0 Bridged)',
      wiring: 'SDA GPIO 21 • SCL GPIO 22'
    },
    {
      id: 3,
      name: 'INA219 Channel 3',
      address: '0x44',
      shuntResistor: '0.100 Ω (R100)',
      target: 'Panel 3 (Gamma)',
      busVoltageMax: '26.0 V',
      currentRange: '±3.2 A',
      status: 'ACK Received (0x44 - A1 Bridged)',
      wiring: 'SDA GPIO 21 • SCL GPIO 22'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
            I²C Hardware Bus &amp; INA219 Shunt Diagnostics
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
          ESP32 Wire.h (400 kHz Fast Mode)
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-4">
        As specified in Section 5.1 of project documentation, three INA219 breakout modules cannot share the same default address (0x40). In our hardware configuration, modules use hardware solder jumpers <strong>A0 and A1</strong> (or TCA9548A I²C Multiplexer) to achieve independent channel addressing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {i2cChannels.map((ch) => (
          <div
            key={ch.id}
            className="p-3.5 rounded-xl bg-[#0b1710] border border-emerald-500/15 space-y-2 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
              <span className="font-bold text-zinc-200 font-heading">{ch.name}</span>
              <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                {ch.address}
              </span>
            </div>

            <div className="space-y-1 text-zinc-400 text-[11px]">
              <div className="flex justify-between">
                <span>Assigned:</span>
                <span className="text-zinc-200">{ch.target}</span>
              </div>
              <div className="flex justify-between">
                <span>Shunt Resistor:</span>
                <span className="text-emerald-400">{ch.shuntResistor}</span>
              </div>
              <div className="flex justify-between">
                <span>Bus Max:</span>
                <span className="text-zinc-300">{ch.busVoltageMax}</span>
              </div>
              <div className="flex justify-between">
                <span>Pins:</span>
                <span className="text-zinc-300">{ch.wiring}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px]">
              <span className="text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> I2C Bus Active
              </span>
              <span className="text-zinc-500">ACK 0x00</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
