import React, { useState } from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCheck, 
  Download, 
  Trash2, 
  Filter,
  Check,
  Search
} from 'lucide-react';
import { formatDateFull } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

export default function AlertsHistoryPage() {
  const { alerts, acknowledgeAlert, clearAcknowledgedAlerts } = useSolarGuard();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unack' | 'critical' | 'warning' | 'info'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType === 'unack' && alert.acknowledged) return false;
    if (filterType === 'critical' && alert.severity !== 'critical') return false;
    if (filterType === 'warning' && alert.severity !== 'warning') return false;
    if (filterType === 'info' && alert.severity !== 'info') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = alert.title?.toLowerCase().includes(q);
      const matchMsg = alert.message?.toLowerCase().includes(q);
      const matchType = alert.type?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchType;
    }
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `solarguard_alerts_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            Safety Alerts &amp; Rule Violations History
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time evaluation engine tracking output drops, thermal surges, debris, and damage lockouts
          </p>
        </div>

        {/* Global Alert Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export JSON
          </button>

          <button
            onClick={clearAcknowledgedAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" /> Clear Acknowledged
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Alerts', count: alerts.length },
            { id: 'unack', label: 'Unacknowledged', count: alerts.filter((a) => !a.acknowledged).length },
            { id: 'critical', label: 'Critical', count: alerts.filter((a) => a.severity === 'critical').length },
            { id: 'warning', label: 'Warnings', count: alerts.filter((a) => a.severity === 'warning').length },
            { id: 'info', label: 'Info', count: alerts.filter((a) => a.severity === 'info').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-emerald-600 text-white shadow-glow-green'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or panel..."
            className="w-full bg-[#0b1710] border border-emerald-500/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center text-zinc-500 text-xs">
            No alerts match the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'critical';
            const isWarn = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`glass-panel rounded-2xl p-4 sm:p-5 border transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  alert.acknowledged
                    ? 'border-zinc-800/80 bg-zinc-950/40 opacity-70'
                    : isCrit
                    ? 'border-rose-500/40 bg-rose-950/20 shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]'
                    : 'border-amber-500/40 bg-amber-950/15'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-1">
                    {isCrit ? (
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                      </div>
                    ) : isWarn ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Info className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-semibold text-base text-zinc-100">
                        {alert.title}
                      </span>
                      <StatusBadge status={alert.severity} text={alert.severity.toUpperCase()} size="xs" />
                      {alert.panelId && (
                        <span className="text-[10px] font-mono bg-black/60 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
                          Panel {alert.panelId}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.recommendedAction && (
                      <div className="text-xs text-emerald-400/90 pt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-300">Recommended Action:</span>
                        <span>{alert.recommendedAction}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 pt-2">
                      <span>Event: {alert.id}</span>
                      <span>•</span>
                      <span>Recorded: {formatDateFull(alert.timestamp)}</span>
                      <span>•</span>
                      <span className="uppercase text-zinc-400">{alert.type}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                  {alert.acknowledged ? (
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
