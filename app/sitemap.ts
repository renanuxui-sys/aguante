import type { MetadataRoute } from 'next'
import { carregarClubesAtivos } from '@/lib/clube-data'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const siteUrl = 'https://aguante.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const clubes = await carregarClubesAtivos().catch(() => [])
  const produtos = await carregarProdutosAtivos()

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
    ...produtos.map(produto => ({
      url: `${siteUrl}/produto/${produto.id}`,
      lastModified: produto.updated_at || now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]
}

async function carregarProdutosAtivos() {
  try {
    const supabase = criarSupabaseAdmin()
    const { data, error } = await supabase
      .from('produtos')
      .select('id,updated_at')
      .eq('ativo', true)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}
