import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['dagre'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      // Define um alias '@' para apontar para a sua pasta src.
      // Isso permite importações como `import geminiService from '@/services/geminiService'`
      "@": path.resolve(__dirname, "./src"),
    },
  },
})