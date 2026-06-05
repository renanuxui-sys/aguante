import type { MetadataRoute } from 'next'
import { carregarClubesAtivos } from '@/lib/clube-data'
import { aplicarFiltroFontesVisiveis, carregarNomesFontesOcultas } from '@/lib/fonte-data'
import { carregarLojasAtivas } from '@/lib/loja-data'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const siteUrl = 'https://aguante.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const clubes = await carregarClubesAtivos().catch(() => [])
  const lojas = await carregarLojasAtivas().catch(() => [])
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
    {
      url: `${siteUrl}/cupons`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/ofertas-netshoes`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...clubes.map(clube => ({
      url: `${siteUrl}/clubes/${clube.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...lojas.map(loja => ({
      url: `${siteUrl}/lojas/${loja.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
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
    const fontesOcultas = await carregarNomesFontesOcultas(supabase)
    const { data, error } = await aplicarFiltroFontesVisiveis(supabase
      .from('produtos')
      .select('id,updated_at')
      .eq('ativo', true)
      .order('updated_at', { ascending: false }), fontesOcultas)

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}
