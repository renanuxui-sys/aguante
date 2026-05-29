import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const POR_PAGINA_PADRAO = 50
const LIMITE_MAXIMO = 200
const PAGE_AGREGACAO = 1000

type CliqueSaida = {
  id: string
  produto_id: string | null
  produto_titulo: string | null
  loja_nome: string | null
  clicked_at: string
  origem_usuario: string | null
  pagina_origem: string | null
  clube: string | null
  categoria: string | null
  campanha: string | null
  session_id: string | null
  usuario_status: string | null
  cupom_revelado: boolean | null
  destino_original: string
  destino_com_utm: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

type FiltrosCliques = {
  busca: string
  loja: string
  campanha: string
  clube: string
  origem: string
  de: string
  ate: string
}

type QueryFiltravel = {
  or: (filters: string) => QueryFiltravel
  eq: (column: string, value: string) => QueryFiltravel
  gte: (column: string, value: string) => QueryFiltravel
  lte: (column: string, value: string) => QueryFiltravel
}

async function sessaoAdminValida() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

// Supabase builders keep changing concrete generic types across chained calls.
// Keeping this helper structural avoids tying the admin filters to those internals.
function aplicarFiltros<T>(query: T, filtros: FiltrosCliques): T {
  let filtrada = query as unknown as QueryFiltravel

  if (filtros.busca) {
    const busca = filtros.busca.replace(/[%(),]/g, ' ').trim()
    if (busca) {
      filtrada = filtrada.or(`produto_titulo.ilike.%${busca}%,loja_nome.ilike.%${busca}%,clube.ilike.%${busca}%,campanha.ilike.%${busca}%`)
    }
  }

  if (filtros.loja) filtrada = filtrada.eq('loja_nome', filtros.loja)
  if (filtros.campanha) filtrada = filtrada.eq('campanha', filtros.campanha)
  if (filtros.clube) filtrada = filtrada.eq('clube', filtros.clube)
  if (filtros.origem) filtrada = filtrada.eq('origem_usuario', filtros.origem)
  if (filtros.de) filtrada = filtrada.gte('clicked_at', `${filtros.de}T00:00:00.000Z`)
  if (filtros.ate) filtrada = filtrada.lte('clicked_at', `${filtros.ate}T23:59:59.999Z`)

  return filtrada as unknown as T
}

function somarRanking(ranking: Record<string, number>, chave: string | null | undefined) {
  if (!chave) return
  ranking[chave] = (ranking[chave] || 0) + 1
}

function ordenarRanking(ranking: Record<string, number>, limite = 10) {
  return Object.entries(ranking)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limite)
}

async function carregarResumo(filtros: FiltrosCliques) {
  const supabase = criarSupabaseAdmin()
  const porLoja: Record<string, number> = {}
  const porCampanha: Record<string, number> = {}
  const porOrigem: Record<string, number> = {}
  const porClube: Record<string, number> = {}
  let totalCupom = 0
  let totalLogados = 0
  let totalSemSessao = 0
  let total = 0
  let offset = 0
  const sessoes = new Set<string>()

  while (true) {
    const query = aplicarFiltros(
      supabase
        .from('cliques_saida')
        .select('loja_nome,campanha,origem_usuario,clube,cupom_revelado,usuario_status,session_id'),
      filtros,
    )
      .order('clicked_at', { ascending: false })
      .range(offset, offset + PAGE_AGREGACAO - 1)
      .returns<Array<Pick<CliqueSaida, 'loja_nome' | 'campanha' | 'origem_usuario' | 'clube' | 'cupom_revelado' | 'usuario_status' | 'session_id'>>>()

    const { data, error } = await query
    if (error) throw error
    if (!data?.length) break

    data.forEach(clique => {
      total += 1
      somarRanking(porLoja, clique.loja_nome)
      somarRanking(porCampanha, clique.campanha)
      somarRanking(porOrigem, clique.origem_usuario)
      somarRanking(porClube, clique.clube)
      if (clique.cupom_revelado) totalCupom += 1
      if (clique.usuario_status === 'logado') totalLogados += 1
      if (clique.session_id) sessoes.add(clique.session_id)
      else totalSemSessao += 1
    })

    if (data.length < PAGE_AGREGACAO) break
    offset += PAGE_AGREGACAO
  }

  return {
    total,
    totalCupom,
    totalLogados,
    totalSessoes: sessoes.size,
    totalSemSessao,
    porLoja: ordenarRanking(porLoja),
    porCampanha: ordenarRanking(porCampanha),
    porOrigem: ordenarRanking(porOrigem),
    porClube: ordenarRanking(porClube),
  }
}

export async function GET(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || POR_PAGINA_PADRAO), 1), LIMITE_MAXIMO)
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0)
    const filtros: FiltrosCliques = {
      busca: searchParams.get('busca')?.trim() || '',
      loja: searchParams.get('loja')?.trim() || '',
      campanha: searchParams.get('campanha')?.trim() || '',
      clube: searchParams.get('clube')?.trim() || '',
      origem: searchParams.get('origem')?.trim() || '',
      de: searchParams.get('de')?.trim() || '',
      ate: searchParams.get('ate')?.trim() || '',
    }

    const supabase = criarSupabaseAdmin()
    const query = aplicarFiltros(
      supabase
        .from('cliques_saida')
        .select('id,produto_id,produto_titulo,loja_nome,clicked_at,origem_usuario,pagina_origem,clube,categoria,campanha,session_id,usuario_status,cupom_revelado,destino_original,destino_com_utm,utm_source,utm_medium,utm_campaign,utm_content,utm_term', { count: 'exact' }),
      filtros,
    )
      .order('clicked_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const [{ data, count, error }, resumo] = await Promise.all([
      query.returns<CliqueSaida[]>(),
      carregarResumo(filtros),
    ])

    if (error) throw error
    return Response.json({ cliques: data || [], total: count || 0, resumo })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao carregar cliques.' }, { status: 500 })
  }
}
