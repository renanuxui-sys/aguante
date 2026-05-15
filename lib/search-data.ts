import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'

const POR_PAGINA = 20

export type SearchDataParams = {
  q?: string
  categoria?: string | null
  clube?: string
  decada?: string | null
  ordenar?: string | null
  de_jogo?: string | boolean | null
  ordem?: string | null
  pagina?: string | number | null
}

export async function carregarSearchData(params: SearchDataParams) {
  const supabase = criarSupabaseAdmin()
  const q = params.q || ''
  const categoria = params.categoria || null
  const clubeExato = params.clube || ''
  const decada = params.decada || null
  const ordenar = params.ordenar || null
  const deJogo = params.de_jogo === true || params.de_jogo === 'true'
  const ordem = params.ordem || 'mais recentes'
  const pagina = Math.max(1, Number(params.pagina || '1') || 1)

  let query = supabase
    .from('produtos')
    .select(PRODUCT_CARD_SELECT, { count: 'exact' })
    .eq('ativo', true)

  if (categoria) {
    const { data: clubesCategoria, error } = await supabase
      .from('clubes')
      .select('nome')
      .eq('ativo', true)
      .eq('categoria', categoria)

    if (error) throw error

    const nomes = (clubesCategoria || []).map(clube => clube.nome).filter(Boolean)
    if (nomes.length === 0) return { produtos: [], total: 0, temProxima: false }
    query = query.in('clube', nomes)
  }

  if (clubeExato) query = query.eq('clube', clubeExato)

  if (q) {
    const termos = q.trim().split(/\s+/).filter(Boolean)
    termos.forEach(termo => {
      query = query.or(`titulo.ilike.%${termo}%,clube.ilike.%${termo}%,ano.ilike.%${termo}%`)
    })
  }

  if (decada) {
    const ini = decada.length === 2 ? `19${decada}` : decada
    const inicio = parseInt(ini, 10)
    const fim = inicio + 9
    query = query.gte('ano', String(inicio)).lte('ano', String(fim))
  }

  if (deJogo) query = query.eq('de_jogo', true)

  if (ordenar === 'mais-vistos' || ordem === 'mais vistos') {
    query = query.order('views', { ascending: false, nullsFirst: false })
  } else if (ordem === 'menor preço') {
    query = query.order('preco', { ascending: true, nullsFirst: false })
  } else if (ordem === 'maior preço') {
    query = query.order('preco', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const inicio = (pagina - 1) * POR_PAGINA
  const { data, error, count } = await query.range(inicio, inicio + POR_PAGINA)
  if (error) throw error

  const produtos = data || []

  return {
    produtos: produtos.slice(0, POR_PAGINA),
    total: count ?? 0,
    temProxima: produtos.length > POR_PAGINA,
  }
}
