import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // New deploy = the installed Home Screen app updates itself. No re-install needed.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: "Safi's Journal",
        short_name: 'Journal',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#faf8f5',
        theme_color: '#7A1538',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Save the whole app on the phone so it opens with zero internet.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // the editor bundle is big
        navigateFallbackDenylist: [/^\/api\//],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
          {
            // pictures you've already seen stay visible offline (audio isn't cached)
            urlPattern: ({ url, request }) =>
              url.hostname === 'res.cloudinary.com' && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'journal-images',
              expiration: { maxEntries: 200 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
