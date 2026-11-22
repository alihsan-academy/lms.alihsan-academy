import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Al IHSAN Learnings',
    short_name: 'Al IHSAN Learnings',
    description: 'Al-Ihsan Academy of Moral Education - Interactive Learning Management System',
    start_url: '/?source=pwa',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0D4A47',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['education'],
    shortcuts: [
      {
        name: 'Tutor Portal',
        short_name: 'Tutor',
        description: 'Educator and faculty portal',
        url: '/teacher/login',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Student Portal',
        short_name: 'Student',
        description: 'Student classes and learning space',
        url: '/student/login',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
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
