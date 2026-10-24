import React from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatDateFull } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';

export default function RecentAlertsList({ alerts, onAcknowledge, onNavigate }) {
  const displayAlerts = alerts.slice(0, 3);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100">
              System Alerts
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
            {alerts.filter((a) => !a.acknowledged).length} Active
          </span>
        </div>

        {displayAlerts.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs">
            No active alerts. All panel systems nominal.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayAlerts.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border transition ${
                    alert.acknowledged
                      ? 'bg-black/20 border-zinc-800/80 opacity-60'
                      : isCrit
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {isCrit ? (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {alert.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          {alert.message}
                        </div>
                      </div>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-1 rounded transition shrink-0 flex items-center gap-1"
                        title="Acknowledge alert"
                      >
                        <Check className="w-3 h-3" /> Ack
                      </button>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{formatDateFull(alert.timestamp)}</span>
                    <span className="uppercase text-zinc-400">{alert.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-500/10">
        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-between text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>View All Alerts &amp; Rule Logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
