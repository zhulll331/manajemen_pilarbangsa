import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://www.pilarbangsa.my.id'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Halaman statis
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/tentang`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/program-kerja`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kegiatan`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/arsip`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Halaman dinamis: Program Kerja per divisi
  const { data: prokers } = await supabase
    .from('programs')
    .select('id, updated_at')
    .eq('is_published', true)

  const prokerPages: MetadataRoute.Sitemap = (prokers || []).map((p) => ({
    url: `${BASE_URL}/program-kerja/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Halaman dinamis: Kegiatan Publik (hanya terbit dan arsip)
  const { data: events } = await supabase
    .from('public_events')
    .select('slug, updated_at')
    .in('publish_status', ['published', 'archived'])

  const eventPages: MetadataRoute.Sitemap = (events || []).map((ev) => ({
    url: `${BASE_URL}/kegiatan/${ev.slug}`,
    lastModified: ev.updated_at ? new Date(ev.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...prokerPages, ...eventPages]
}
