
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  define: {
    'global': 'globalThis',
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.platform': JSON.stringify('win32'),
    'process.version': JSON.stringify('v16.14.0'),
    'process.versions': JSON.stringify({
      node: '16.14.0'
    }),
    'process': {
      env: {},
      platform: 'win32',
      version: 'v16.14.0',
      versions: {
        node: '16.14.0'
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
