import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { oyasumiWriteFilePlugin } from './plugins/oyasumiWriteFile';
var testerRoot = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    // Percorsi relativi: ok su Altervista (root o sottocartella) senza riconfigurare l’URL.
    base: './',
    plugins: [react(), oyasumiWriteFilePlugin(testerRoot)],
    resolve: {
        alias: {
            '@domain': path.resolve(__dirname, '../../packages/domain/src'),
        },
    },
    server: {
        port: 3002,
        open: true,
    },
});
