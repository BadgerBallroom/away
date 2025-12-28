import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        react(),
        eslint(),
        svgr(), // Needed because we use SVGs as components
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'assets/logo-*.svg'],
            manifest: {
                short_name: "BBDT Away",
                name: "Badger Ballroom Away Coordinator",
                icons: [
                    {
                        src: "favicon.ico",
                        sizes: "64x64 32x32 24x24 16x16",
                        type: "image/x-icon"
                    },
                    {
                        src: "logo192.png",
                        type: "image/png",
                        sizes: "192x192"
                    },
                    {
                        src: "logo512.png",
                        type: "image/png",
                        sizes: "512x512"
                    }
                ],
                start_url: ".",
                display: "standalone",
                theme_color: "#c5050c",
                background_color: "#ffffff"
            }
        }),
    ],
    server: {
        port: 3000,
        open: true,
    },
    test: {
        globals: true, // Allows usage of `describe`, `it`, and `expect` without importing them
        environment: 'happy-dom',
        setupFiles: './src/setupTests.ts',
        css: true,
    },
});
