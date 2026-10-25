import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || env.BACKEND_URL || 'https://solarguard-backend.onrender.com'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(backendUrl),
    },
    server: {
      host: true, // Binds to 0.0.0.0 so phone can connect on local Wi-Fi
      port: 5173,
    },
  }
})
