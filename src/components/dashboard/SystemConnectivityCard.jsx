import React from 'react';
import { Wifi, Cpu, Camera, BrainCircuit, Database, CheckCircle2, XCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SystemConnectivityCard({ systemStatus, isDemoMode }) {
  const nodes = [
    {
      id: 'esp32',
      name: 'ESP32 Gateway',
      desc: isDemoMode ? 'Simulated Local Link' : 'REST Polling (192.168.1.150)',
      icon: Cpu,
      online: systemStatus.esp32.connected,
      meta: isDemoMode ? '18ms latency' : 'Awaiting Connection'
    },
    {
      id: 'sensors',
      name: 'Sensors (INA219 x3, DS18B20)',
      desc: 'I2C Bus + 1-Wire Digital',
      icon: Wifi,
      online: systemStatus.esp32.connected,
      meta: '4 channels active'
    },
    {
      id: 'camera',
      name: 'Camera & Vision',
      desc: systemStatus.camera.source,
      icon: Camera,
      online: systemStatus.camera.connected,
      meta: 'Ready for capture'
    },
    {
      id: 'ml',
      name: 'ML Surface Classifier',
      desc: systemStatus.mlService.model,
      icon: BrainCircuit,
      online: systemStatus.mlService.connected,
      meta: '45ms inference'
    },
    {
      id: 'mongodb',
      name: 'MongoDB Database',
      desc: 'Database: solarguard_db',
      icon: Database,
      online: systemStatus.mongoDb.connected,
      meta: 'Atlas ready'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-400" /> System Connectivity
        </h3>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
          5 Subsystems
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              className={`p-3 rounded-xl border flex items-center gap-3 sm:flex-col sm:items-start transition ${
                node.online
                  ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/20'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  node.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-semibold text-zinc-200 truncate">
                    {node.name}
                  </div>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      node.online ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {node.desc}
                </div>
                <div className="text-[9px] font-mono text-emerald-400/80 mt-1">
                  {node.meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
