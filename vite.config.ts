// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '192.168.1.101', // Listen on all network interfaces
        port: 50053,     // Port for the React app
    },
});