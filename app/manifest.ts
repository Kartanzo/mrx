import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MRX Locações',
    short_name: 'MRX',
    description: 'Sistema de gestão MRX Locações',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0c14',
    theme_color: '#0a0c14',
    icons: [
      {
        src: '/logo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
    ],
  }
}
