import { cache } from 'react'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { gerarSlugLoja } from '@/lib/loja-utils'

export type LojaPagina = {
  id: string
  nome: string
  url: string
  slug: string
}

export const carregarLojasAtivas = cache(async () => {
  const supabase = criarSupabaseAdmin()
  const { data, error } = await supabase
    .from('fontes')
    .select('id,nome,url')
    .eq('ativa', true)
    .order('nome', { ascending: true })

  if (error) throw error

  return ((data || []) as Omit<LojaPagina, 'slug'>[]).map(loja => ({
    ...loja,
    slug: gerarSlugLoja(loja.nome),
  }))
})

export async function carregarLojaPorSlug(slug: string) {
  const lojas = await carregarLojasAtivas()
  return lojas.find(loja => loja.slug === slug) || null
}
