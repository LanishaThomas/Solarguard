import React from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatDateFull } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';

export default function RecentAlertsList({ alerts, onAcknowledge, onNavigate }) {
  const displayAlerts = alerts.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              System Alerts
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
            {alerts.filter((a) => !a.acknowledged).length} Active
          </span>
        </div>

        {displayAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
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
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : isCrit
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {isCrit ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {alert.title}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {alert.message}
                        </div>
                      </div>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="text-[10px] font-mono font-semibold text-blue-700 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded transition shrink-0 flex items-center gap-1"
                        title="Acknowledge alert"
                      >
                        <Check className="w-3 h-3" /> Ack
                      </button>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{formatDateFull(alert.timestamp)}</span>
                    <span className="uppercase text-slate-600 font-semibold">{alert.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200">
        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>View All Alerts &amp; Rule Logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

