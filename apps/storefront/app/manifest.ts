import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nova Lite Solution',
    short_name: 'Novalite',
    description: 'Energy-efficient LED bulbs, inverter bulbs and tube lights.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F26B1D',
    icons: [
      { src: '/icons/store-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/store-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/store-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
