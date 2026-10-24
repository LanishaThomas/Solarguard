import React from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import TotalPowerCard from '../components/dashboard/TotalPowerCard';
import TemperatureCard from '../components/dashboard/TemperatureCard';
import QuickWiperCard from '../components/dashboard/QuickWiperCard';
import SurfaceInspectionSnippet from '../components/dashboard/SurfaceInspectionSnippet';
import PanelCard from '../components/dashboard/PanelCard';
import TelemetryCharts from '../components/dashboard/TelemetryCharts';
import SystemConnectivityCard from '../components/dashboard/SystemConnectivityCard';
import RecentAlertsList from '../components/dashboard/RecentAlertsList';

export default function DashboardPage({ setActiveTab, setSelectedPanelId }) {
  const {
    panels,
    temperature,
    totalPower,
    dailyYieldWh,
    telemetryHistory,
    settings,
    cleaningState,
    triggerWipe,
    emergencyStop,
    toggleAutoCleaning,
    inspection,
    alerts,
    acknowledgeAlert,
    systemStatus,
    isDemoMode,
  } = useSolarGuard();

  const handleSelectPanel = (panelId) => {
    if (setSelectedPanelId) setSelectedPanelId(panelId);
    setActiveTab('panels');
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            System Operations Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time telemetry from 3x INA219 sensors, DS18B20 probe, AI vision, and SG90 auto-wiper
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
            Node: ESP32-INA219-PROTOTYPE
          </span>
        </div>
      </div>

      {/* Row 1: KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalPowerCard
          totalPower={totalPower}
          dailyYieldWh={dailyYieldWh}
          panels={panels}
        />
        <TemperatureCard
          temperature={temperature}
          maxThreshold={settings.tempAlertThresholdC}
        />
        <QuickWiperCard
          cleaningState={cleaningState}
          triggerWipe={triggerWipe}
          emergencyStop={emergencyStop}
          toggleAutoCleaning={toggleAutoCleaning}
          onNavigate={() => setActiveTab('cleaning')}
        />
        <SurfaceInspectionSnippet
          inspection={inspection}
          onNavigate={() => setActiveTab('camera')}
        />
      </div>

      {/* Row 2: The Three Solar Panels (INA219 Channels 1, 2, 3) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-lg text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Independent Panel Telemetry (3x INA219)
          </h3>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Rule: Flag if &lt; 70% of peer-panel median for 5 samples
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {panels.map((panel) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              allPanels={panels}
              settings={settings}
              onSelect={() => handleSelectPanel(panel.id)}
            />
          ))}
        </div>
      </div>

      {/* Row 3: Live Historical Telemetry Charts */}
      <TelemetryCharts
        history={telemetryHistory}
        maxTempThreshold={settings.tempAlertThresholdC}
      />

      {/* Row 4: Connectivity & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SystemConnectivityCard
            systemStatus={systemStatus}
            isDemoMode={isDemoMode}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentAlertsList
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onNavigate={() => setActiveTab('alerts')}
          />
        </div>
      </div>
    </div>
  );
}
