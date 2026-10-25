import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Binds to 0.0.0.0 so phone can connect on local Wi-Fi
    port: 5173,
  },
})
