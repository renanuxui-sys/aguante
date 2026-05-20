import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { gerarSlugClube } from '@/lib/clube-utils'

export type ClubePagina = {
  id: string
  nome: string
  slug: string
  categoria: string | null
  escudo_url: string | null
}

export async function carregarClubesAtivos() {
  const supabase = criarSupabaseAdmin()
  const { data, error } = await supabase
    .from('clubes')
    .select('id,nome,slug,categoria,escudo_url')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error

  return ((data || []) as ClubePagina[]).map(clube => ({
    ...clube,
    slug: clube.slug || gerarSlugClube(clube.nome),
  }))
}

export async function carregarClubePorSlug(slug: string) {
  const clubes = await carregarClubesAtivos()
  return clubes.find(clube => clube.slug === slug || gerarSlugClube(clube.nome) === slug) || null
}
