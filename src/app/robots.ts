import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Blokir halaman dashboard dari indexing Google (hanya untuk pengurus internal)
        disallow: ['/dashboard/', '/login', '/api/'],
      },
    ],
    sitemap: 'https://pilarbangsa.my.id/sitemap.xml',
  }
}
