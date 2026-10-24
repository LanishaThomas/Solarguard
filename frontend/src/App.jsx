import { AppProvider, useApp } from './context/AppContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PanelMonitoring from './pages/PanelMonitoring.jsx'
import CameraDetection from './pages/CameraDetection.jsx'
import CleaningControl from './pages/CleaningControl.jsx'
import AlertsHistory from './pages/AlertsHistory.jsx'
import Settings from './pages/Settings.jsx'

function AppRouter() {
  const { activeNav } = useApp()

  const pages = {
    dashboard: <Dashboard />,
    panels:    <PanelMonitoring />,
    camera:    <CameraDetection />,
    cleaning:  <CleaningControl />,
    alerts:    <AlertsHistory />,
    settings:  <Settings />,
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      <Navbar />
      <main>
        {pages[activeNav] ?? <Dashboard />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  )
}
