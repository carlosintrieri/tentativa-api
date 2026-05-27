import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
    open: true,
    watch: {
      usePolling: true, // força detecção de mudanças no Windows
    },
  },

  optimizeDeps: {
    force: true, // força reconstrução de dependências (evita cache travado)
  },

  clearScreen: false,

  build: {
    sourcemap: true, // ajuda MUITO a ver mudanças reais no devtools
  },
})