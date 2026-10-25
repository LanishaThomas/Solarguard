import React, { useState } from 'react';
import { SolarGuardProvider, useSolarGuard } from './context/SolarGuardContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import MobileNav from './components/common/MobileNav';
import DevicePreviewModal from './components/common/DevicePreviewModal';

import DashboardPage from './pages/DashboardPage';
import PanelMonitoringPage from './pages/PanelMonitoringPage';
import CameraDetectionPage from './pages/CameraDetectionPage';
import CleaningControlPage from './pages/CleaningControlPage';
import AlertsHistoryPage from './pages/AlertsHistoryPage';
import SettingsPage from './pages/SettingsPage';

function SolarGuardContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPanelId, setSelectedPanelId] = useState(1);
  const { mobilePreviewMode, setMobilePreviewMode } = useSolarGuard();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            setActiveTab={setActiveTab}
            setSelectedPanelId={setSelectedPanelId}
          />
        );
      case 'panels':
        return <PanelMonitoringPage selectedPanelId={selectedPanelId} />;
      case 'camera':
        return <CameraDetectionPage />;
      case 'cleaning':
        return <CleaningControlPage />;
      case 'alerts':
        return <AlertsHistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            setActiveTab={setActiveTab}
            setSelectedPanelId={setSelectedPanelId}
          />
        );
    }
  };

  const appUI = (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-amber-300 selection:text-slate-950">
      {/* Main Global Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto items-start">
        {/* Desktop Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3 edge50:p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-full overflow-x-hidden min-w-0">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar (Tailored for Motorola Edge 50) */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );

  return (
    <DevicePreviewModal
      isOpen={mobilePreviewMode}
      onClose={() => setMobilePreviewMode(false)}
    >
      {appUI}
    </DevicePreviewModal>
  );
}

export default function App() {
  return (
    <SolarGuardProvider>
      <SolarGuardContent />
    </SolarGuardProvider>
  );
}
