import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AL IHSAN Academy LMS',
    short_name: 'Al-Ihsan LMS',
    description: 'Al-Ihsan Academy of Moral Education - Interactive Learning Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D4A47',
    theme_color: '#0D4A47',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['education'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-apple-touch.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
