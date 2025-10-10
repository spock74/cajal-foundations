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
    hmr: {
      // Configuração explícita para HMR em ambientes com proxy (Cloud Workstations, Gitpod, etc.)
      // O cliente (navegador) usará o host da URL atual para a conexão WebSocket.
      // A porta 443 é a porta padrão para conexões HTTPS (wss).
      protocol: 'wss',
      host: `${process.env.HOSTNAME}`,
      clientPort: 443
    },
    // Cria um proxy para cada emulador do Firebase. Isso permite que o frontend
    // se comunique com eles através do servidor Vite, resolvendo problemas de CORS e 'localhost'
    // em ambientes como o Cloud Workstations. O navegador fala com o Vite, e o Vite fala com os emuladores.
    proxy: {
      // Proxy para o Emulador de Autenticação (REST API)
      // Intercepta as chamadas para a API de identidade do Google.
      '^/identitytoolkit.googleapis.com/.*': {
        target: 'http://127.0.0.1:9191',
        changeOrigin: true,
      },
      // Proxy para o Emulador do Firestore (gRPC-web API)
      // Intercepta as chamadas para a API do Firestore.
      '^/google.firestore.v1.Firestore/.*': {
        target: 'http://127.0.0.1:8181',
        changeOrigin: true,
      },
      // Proxy para o Emulador de Functions.
      // Intercepta chamadas para qualquer função no emulador.
      // O padrão `^/[^/]+/[^/]+/functions/.*` captura caminhos como `/<project-id>/<region>/<function-name>`.
      '^/[^/]+/[^/]+/functions/.*': {
        target: 'http://127.0.0.1:5152',
        changeOrigin: true,
      },
      // Proxy para o Emulador de Storage (REST API)
      '^/v0/b/.*': {
        target: 'http://127.0.0.1:9292',
        changeOrigin: true,
      }
    },
  },
})