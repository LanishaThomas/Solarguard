import React from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';

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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
            I²C Hardware Bus &amp; INA219 Shunt Diagnostics
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 font-semibold">
          ESP32 Wire.h (400 kHz Fast Mode)
        </span>
      </div>

      <p className="text-xs text-slate-600 mb-4 font-medium">
        As specified in Section 5.1 of project documentation, three INA219 breakout modules cannot share the same default address (0x40). In our hardware configuration, modules use hardware solder jumpers <strong>A0 and A1</strong> (or TCA9548A I²C Multiplexer) to achieve independent channel addressing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {i2cChannels.map((ch) => (
          <div
            key={ch.id}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 font-heading">{ch.name}</span>
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs font-bold">
                {ch.address}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600 text-xs">
              <div className="flex justify-between">
                <span>Assigned:</span>
                <span className="text-slate-900 font-semibold">{ch.target}</span>
              </div>
              <div className="flex justify-between">
                <span>Shunt Resistor:</span>
                <span className="text-blue-700 font-bold">{ch.shuntResistor}</span>
              </div>
              <div className="flex justify-between">
                <span>Bus Max:</span>
                <span className="text-slate-800">{ch.busVoltageMax}</span>
              </div>
              <div className="flex justify-between">
                <span>Pins:</span>
                <span className="text-slate-800 font-sans text-[11px]">{ch.wiring}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-blue-700 font-semibold flex items-center gap-1 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> I2C Bus Active
              </span>
              <span className="text-slate-500 font-mono">ACK 0x00</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
