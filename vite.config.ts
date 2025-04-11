// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '10.16.4.28', // Listen on all network interfaces
        port: 50053,     // Port for the React app
    },
});