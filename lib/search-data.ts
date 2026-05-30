import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'
import { aplicarFiltroFontesVisiveis, carregarNomesFontesOcultas } from '@/lib/fonte-data'
import { aplicarCupomAtivo, carregarLojasComCupomAtivo } from '@/lib/cupom-data'

const POR_PAGINA = 20

function hashTexto(texto: string) {
  let hash = 0
  for (let i = 0; i < texto.length; i += 1) {
    hash = ((hash << 5) - hash + texto.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function embaralharEstavelPorDia<T extends { id?: string | number }>(itens: T[]) {
  const dia = new Date().toISOString().slice(0, 10)
  return [...itens].sort((a, b) => {
    const hashA = hashTexto(`${dia}:${a.id || ''}`)
    const hashB = hashTexto(`${dia}:${b.id || ''}`)
    return hashA - hashB
  })
}

export type SearchDataParams = {
  q?: string
  categoria?: string | null
  clube?: string
  fonte?: string
  decada?: string | null
  ordenar?: string | null
  de_jogo?: string | boolean | null
  ordem?: string | null
  pagina?: string | number | null
  novidades?: string | boolean | null
  raridades?: string | boolean | null
}

export async function carregarSearchData(params: SearchDataParams) {
  const supabase = criarSupabaseAdmin()
  const fontesOcultas = await carregarNomesFontesOcultas(supabase)
  const lojasComCupom = await carregarLojasComCupomAtivo(() => supabase
    .from('ofertas_afiliadas')
    .select('loja')
    .eq('ativo', true)
    .not('cupom_codigo', 'is', null))
  const q = params.q || ''
  const categoria = params.categoria || null
  const clubeExato = params.clube || ''
  const fonteExata = params.fonte || ''
  const decada = params.decada || null
  const ordenar = params.ordenar || null
  const deJogo = params.de_jogo === true || params.de_jogo === 'true'
  const ordem = params.ordem || 'mais recentes'
  const pagina = Math.max(1, Number(params.pagina || '1') || 1)
  const novidades = params.novidades === true || params.novidades === 'true'
  const raridades = params.raridades === true || params.raridades === 'true'

  let query = aplicarFiltroFontesVisiveis(supabase
    .from('produtos')
    .select(PRODUCT_CARD_SELECT, { count: 'exact' })
    .eq('ativo', true), fontesOcultas)

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
  if (fonteExata) query = query.eq('fonte_nome', fonteExata)

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

  if (raridades) query = query.gte('ano', '1970').lte('ano', '1989')

  if (novidades) {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error, count } = await query
      .gte('created_at', ontem)
      .order('created_at', { ascending: false })
      .range(0, 999)

    if (error) throw error

    const produtos = embaralharEstavelPorDia(data || [])
    const inicio = (pagina - 1) * POR_PAGINA

    return {
      produtos: aplicarCupomAtivo(produtos.slice(inicio, inicio + POR_PAGINA), lojasComCupom),
      total: count ?? produtos.length,
      temProxima: (count ?? produtos.length) > pagina * POR_PAGINA,
    }
  }

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
    produtos: aplicarCupomAtivo(produtos.slice(0, POR_PAGINA), lojasComCupom),
    total: count ?? 0,
    temProxima: produtos.length > POR_PAGINA,
  }
}
