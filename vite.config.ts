import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        'process.env.API_KEY': JSON.stringify("AIzaSyAF4P7ayVvtn_my5RDTDEApGdFAQOJWxvU"),
        'process.env.GEMINI_API_KEY': JSON.stringify("AIzaSyAF4P7ayVvtn_my5RDTDEApGdFAQOJWxvU")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
