import type { MetadataRoute } from 'next'
import { carregarClubesAtivos } from '@/lib/clube-data'

const siteUrl = 'https://aguante.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const clubes = await carregarClubesAtivos().catch(() => [])

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/sobre`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contato`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...clubes.map(clube => ({
      url: `${siteUrl}/clubes/${clube.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]
}
