import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { oyasumiWriteFilePlugin } from './plugins/oyasumiWriteFile'

const testerRoot = path.dirname(fileURLToPath(import.meta.url))
const domainSrc = path.resolve(testerRoot, '../../packages/domain/src')
const clientSrc = path.resolve(testerRoot, '../client/src')

export default defineConfig({
  // Percorsi relativi: ok su Altervista (root o sottocartella) senza riconfigurare l’URL.
  base: './',
  plugins: [react(), oyasumiWriteFilePlugin(testerRoot)],
  resolve: {
    alias: [
      { find: '@domain', replacement: domainSrc },
      { find: /^@\//, replacement: `${clientSrc}/` },
    ],
  },
  server: {
    port: 3002,
    open: false,
    fs: {
      allow: [testerRoot, clientSrc, domainSrc, path.resolve(testerRoot, '../client')],
    },
  },
})
