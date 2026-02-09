import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // API Proxy Configuration (optional)
  // Uncomment and configure this section if you need to proxy API requests during development
  // This helps avoid CORS issues when your API is on a different domain
  /*
  server: {
    proxy: {
      // Proxy all requests starting with /log-auth, /device-inventory, /log-collector
      // to your actual API server
      '/log-auth': {
        target: 'https://your-api-server.com', // Replace with your API server URL
        changeOrigin: true,
        secure: false,
      },
      '/device-inventory': {
        target: 'https://your-api-server.com', // Replace with your API server URL
        changeOrigin: true,
        secure: false,
      },
      '/log-collector': {
        target: 'https://your-api-server.com', // Replace with your API server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
  */
})