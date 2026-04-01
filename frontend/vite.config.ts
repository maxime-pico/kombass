import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-version',
      transformIndexHtml(html) {
        return html.replace('__APP_VERSION__', pkg.version)
      },
    },
  ],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
})
