import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Sous-dossier si l'app est publiée sur GitHub Pages (ex. /nos-courses/)
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png}'] },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Nos courses',
        short_name: 'Courses',
        description: 'La liste de courses partagée de la famille',
        lang: 'fr',
        theme_color: '#0E5F5E',
        background_color: '#EFF7F6',
        display: 'standalone',
        start_url: './',
        scope: './',
        shortcuts: [
          { name: 'Ajouter à la voix', short_name: 'Voix', url: './?voix=1', icons: [{ src: 'icon-192.png', sizes: '192x192' }] }
        ],
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});
