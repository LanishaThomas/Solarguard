import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Trash2, 
  Send, 
  Radio, 
  Maximize2, 
  Minimize2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSolarGuard } from '../../context/SolarGuardContext';

export default function MqttLiveConsole({ title = 'Live MQTT Traffic Monitor', defaultExpanded = true, compact = false }) {
  const { 
    mqttTraffic, 
    mqttStats, 
    clearMqttTraffic, 
    sendMqttTestPulse, 
    mqttStatus,
    settings 
  } = useSolarGuard();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'TX' | 'RX'

  const filteredTraffic = mqttTraffic.filter((item) => {
    if (filter === 'ALL') return true;
    return item.dir === filter;
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans text-slate-100 transition-all">
      {/* Top Header & Status Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs sm:text-sm text-white tracking-wide">
                {title}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                mqttStatus === 'connected' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {mqttStatus === 'connected' ? 'EMQX ONLINE' : mqttStatus.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Broker: <span className="text-slate-300 font-semibold">{settings.mqttBroker || 'EMQX Cloud'}</span>
            </div>
          </div>
        </div>

        {/* LED Traffic Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* TX LED (App -> ESP32) */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            mqttStats.isTxBlinking 
              ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
              : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${mqttStats.isTxBlinking ? 'bg-amber-400 animate-ping' : 'bg-amber-500/60'}`} />
            <span className="text-[11px] font-mono font-bold">TX</span>
            <span className="text-[10px] font-mono text-slate-400">({mqttStats.txCount})</span>
          </div>

          {/* RX LED (ESP32 -> App) */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            mqttStats.isRxBlinking 
              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
              : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${mqttStats.isRxBlinking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500/60'}`} />
            <span className="text-[11px] font-mono font-bold">RX</span>
            <span className="text-[10px] font-mono text-slate-400">({mqttStats.rxCount})</span>
          </div>

          {/* Quick Wiper Test Pulse Button */}
          <button
            type="button"
            onClick={sendMqttTestPulse}
            title="Publish a WIPE test command over MQTT right now"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Send Pulse</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Packet Stream Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Subheader: Filter & Clear Controls */}
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-mono mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                  filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({mqttTraffic.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('TX')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition ${
                  filter === 'TX' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3 h-3" /> TX Sent
              </button>
              <button
                type="button"
                onClick={() => setFilter('RX')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition ${
                  filter === 'RX' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3 h-3" /> RX Received
              </button>
            </div>

            {mqttTraffic.length > 0 && (
              <button
                type="button"
                onClick={clearMqttTraffic}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 font-mono transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Packet Stream Console Box */}
          <div className={`overflow-y-auto space-y-2 font-mono text-xs pr-1 scrollbar-thin ${
            compact ? 'max-h-48' : 'max-h-64'
          }`}>
            {filteredTraffic.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                <Activity className="w-6 h-6 mx-auto mb-2 text-slate-600 animate-pulse" />
                <p className="font-semibold text-slate-400">Awaiting MQTT traffic...</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click <span className="text-blue-400 font-semibold cursor-pointer underline" onClick={sendMqttTestPulse}>Send Pulse</span> or trigger clean to see outgoing (TX) and incoming (RX) packets.
                </p>
              </div>
            ) : (
              filteredTraffic.map((item) => {
                const isTx = item.dir === 'TX';
                const formattedPayload = typeof item.payload === 'object' 
                  ? JSON.stringify(item.payload, null, 1).replace(/\n/g, ' ') 
                  : String(item.raw || item.payload);

                return (
                  <div 
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isTx
                        ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                        : 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          isTx 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isTx ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                          {isTx ? 'GIVING (TX)' : 'TAKING (RX)'}
                        </span>
                        <span className="text-slate-300 font-semibold text-[11px]">
                          {item.topic}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.time}
                      </span>
                    </div>

                    <div className="bg-slate-950/90 rounded-lg p-2 border border-slate-800/80 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                      {formattedPayload}
                    </div>

                    {item.error && (
                      <div className="mt-1 text-[10px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Error: {item.error}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
