import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
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
