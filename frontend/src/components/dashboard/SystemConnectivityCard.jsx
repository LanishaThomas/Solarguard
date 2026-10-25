import React from 'react';
import { Wifi, Cpu, Camera, BrainCircuit, Database, CheckCircle2, XCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SystemConnectivityCard({ systemStatus }) {
  const nodes = [
    {
      id: 'esp32',
      name: 'ESP32 Gateway',
      desc: 'REST Polling (192.168.1.150)',
      icon: Cpu,
      online: systemStatus.esp32.connected,
      meta: systemStatus.esp32.connected ? 'Active Stream' : 'Awaiting Connection'
    },
    {
      id: 'sensors',
      name: 'Sensors (INA219 x3, DS18B20)',
      desc: 'I2C Bus + 1-Wire Digital',
      icon: Wifi,
      online: systemStatus.esp32.connected,
      meta: '4 channels'
    },
    {
      id: 'camera',
      name: 'Camera & Vision',
      desc: systemStatus.camera.source || 'Optical Stream',
      icon: Camera,
      online: systemStatus.camera.connected,
      meta: 'Ready for capture'
    },
    {
      id: 'ml',
      name: 'ML Surface Classifier',
      desc: systemStatus.mlService.model || 'MobileNetV3',
      icon: BrainCircuit,
      online: systemStatus.mlService.connected,
      meta: 'Inference Ready'
    },
    {
      id: 'mongodb',
      name: 'MongoDB Database',
      desc: 'Atlas solarguard_db',
      icon: Database,
      online: systemStatus.mongoDb.connected,
      meta: 'Cloud Storage'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-600" /> System Connectivity
        </h3>
        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
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
                  ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  node.online ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {node.name}
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      node.online ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  {node.desc}
                </div>
                <div className="text-[10px] font-mono text-blue-700 font-bold mt-1">
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

