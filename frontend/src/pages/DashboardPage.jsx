import React from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import TotalPowerCard from '../components/dashboard/TotalPowerCard';
import TemperatureCard from '../components/dashboard/TemperatureCard';
import QuickWiperCard from '../components/dashboard/QuickWiperCard';
import SurfaceInspectionSnippet from '../components/dashboard/SurfaceInspectionSnippet';
import PanelCard from '../components/dashboard/PanelCard';
import TelemetryCharts from '../components/dashboard/TelemetryCharts';
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
  } = useSolarGuard();

  const handleSelectPanel = (panelId) => {
    if (setSelectedPanelId) setSelectedPanelId(panelId);
    setActiveTab('panels');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
              System Operations Dashboard
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time telemetry from 3x INA219 channels, DS18B20 temperature sensor, and MobileNetV3 AI vision
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
            Gateway: ESP32-INA219
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Independent Panel Telemetry (3x INA219 Sensors)
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline font-mono">
            Rule: Flag if &lt; 70% of peer-panel median
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

      {/* Row 4: Recent Alerts */}
      <RecentAlertsList
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
        onNavigate={() => setActiveTab('alerts')}
      />
    </div>
  );
}
