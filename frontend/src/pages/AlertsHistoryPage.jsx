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
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Safety Alerts &amp; Rule Violations History
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time evaluation engine tracking output drops, thermal surges, debris, and damage lockouts
          </p>
        </div>

        {/* Global Alert Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" /> Export JSON
          </button>

          <button
            onClick={clearAcknowledgedAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" /> Clear Acknowledged
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10 font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or panel..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200 shadow-sm font-medium">
            No alerts match the selected criteria. System nominal.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'critical';
            const isWarn = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm hover:shadow-md ${
                  alert.acknowledged
                    ? 'border-slate-200 bg-slate-50 opacity-70'
                    : isCrit
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-amber-200 bg-amber-50/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-1">
                    {isCrit ? (
                      <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                      </div>
                    ) : isWarn ? (
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                        <Info className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-semibold text-base text-slate-900">
                        {alert.title}
                      </span>
                      <StatusBadge status={alert.severity} text={alert.severity.toUpperCase()} size="xs" />
                      {alert.panelId && (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                          Panel {alert.panelId}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {alert.message}
                    </p>

                    {alert.recommendedAction && (
                      <div className="text-xs text-blue-700 pt-1 flex items-center gap-1.5 font-medium">
                        <span className="font-semibold text-slate-900">Recommended Action:</span>
                        <span>{alert.recommendedAction}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 pt-2 font-medium">
                      <span>Event: {alert.id}</span>
                      <span>•</span>
                      <span>Recorded: {formatDateFull(alert.timestamp)}</span>
                      <span>•</span>
                      <span className="uppercase text-slate-700 font-semibold">{alert.type}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  {alert.acknowledged ? (
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5 text-blue-600" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5"
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
