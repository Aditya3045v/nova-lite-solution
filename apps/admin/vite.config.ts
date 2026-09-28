import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const APP = {
  id: 'admin',
  name: 'Novalite Admin',
  short: 'Novalite Admin',
  description: 'Run the Novalite business: catalogue, vendors, orders, targets, incentives and analytics.',
  theme: '#0B1020',
};

export default defineConfig({
  publicDir: fileURLToPath(new URL('../../packages/assets/public', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [`icons/${APP.id}-32.png`, `icons/${APP.id}-apple-180.png`, 'brand/*.svg'],
      manifest: {
        id: `/${APP.id}`,
        name: APP.name,
        short_name: APP.short,
        description: APP.description,
        theme_color: APP.theme,
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: `/icons/${APP.id}-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `/icons/${APP.id}-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `/icons/${APP.id}-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Orders', url: '/orders', icons: [{ src: `/icons/${APP.id}-192.png`, sizes: '192x192' }] },
          { name: 'Products', url: '/products', icons: [{ src: `/icons/${APP.id}-192.png`, sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'novalite-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'novalite-media',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: { chunkSizeWarningLimit: 1500, sourcemap: false },
});
