import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Ouve em todas as interfaces de rede, necessário para o proxy do Cloud Workstation
    port: 5173, // Força o uso da porta 5173
    strictPort: true, // Falha se a porta já estiver em uso, em vez de tentar outra
    open: true, // Abre o navegador automaticamente na URL correta ao iniciar.
  },
})