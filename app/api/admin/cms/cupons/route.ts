import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { cuponsTesteAtivos } from '@/lib/coupon-config'

const PAGE_AGREGACAO = 1000

type MetricasCupom = Record<string, { reveals: number; copies: number; clicks: number; exitRate: number }>

type CouponEventRow = {
  coupon_id: string | null
  event_type: string
  coupon_code: string | null
  store_name: string | null
  product_id: string | null
  campaign: string | null
  club: string | null
}

type CliqueCupomRow = {
  coupon_id: string | null
  coupon_code: string | null
  produto_id: string | null
  produto_titulo: string | null
  loja_nome: string | null
  clube: string | null
  campanha: string | null
}

async function sessaoAdminValida() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

function texto(valor: unknown) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function dataOuNull(valor: unknown) {
  const limpo = texto(valor)
  return limpo ? new Date(`${limpo}T00:00:00.000-03:00`).toISOString() : null
}

function dataFimOuNull(valor: unknown) {
  const limpo = texto(valor)
  return limpo ? new Date(`${limpo}T23:59:59.999-03:00`).toISOString() : null
}

function nomeRanking(valor: string | null | undefined, fallback = 'Sem informação') {
  return texto(valor) || fallback
}

function taxa(parte: number, total: number) {
  if (total <= 0) return 0
  return Math.round((parte / total) * 1000) / 10
}

function somarRanking(ranking: Record<string, number>, chave: string | null | undefined) {
  const nome = nomeRanking(chave)
  ranking[nome] = (ranking[nome] || 0) + 1
}

function ordenarRanking(ranking: Record<string, number>, limite = 8) {
  return Object.entries(ranking)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limite)
}

function somarRankingDetalhado(
  ranking: Record<string, { nome: string; detalhe?: string; total: number }>,
  chave: string | null | undefined,
  nome: string | null | undefined,
  detalhe?: string | null,
) {
  const id = nomeRanking(chave || nome)
  if (!ranking[id]) ranking[id] = { nome: nomeRanking(nome || chave), detalhe: texto(detalhe) || undefined, total: 0 }
  ranking[id].total += 1
}

function ordenarRankingDetalhado(ranking: Record<string, { nome: string; detalhe?: string; total: number }>, limite = 8) {
  return Object.values(ranking)
    .sort((a, b) => b.total - a.total)
    .slice(0, limite)
}

function hostUrl(url: string | null | undefined) {
  if (!url) return ''

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

async function carregarEventosCupons(couponIds: string[]) {
  if (couponIds.length === 0) return []

  const supabase = criarSupabaseAdmin()
  const eventos: CouponEventRow[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('coupon_events')
      .select('coupon_id,event_type,coupon_code,store_name,product_id,campaign,club')
      .in('coupon_id', couponIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_AGREGACAO - 1)
      .returns<CouponEventRow[]>()

    if (error) throw error
    if (!data?.length) break

    eventos.push(...data)
    if (data.length < PAGE_AGREGACAO) break
    offset += PAGE_AGREGACAO
  }

  return eventos
}

async function carregarCliquesComCupom() {
  const supabase = criarSupabaseAdmin()
  const cliques: CliqueCupomRow[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('cliques_saida')
      .select('coupon_id,coupon_code,produto_id,produto_titulo,loja_nome,clube,campanha')
      .eq('cupom_revelado', true)
      .order('clicked_at', { ascending: false })
      .range(offset, offset + PAGE_AGREGACAO - 1)
      .returns<CliqueCupomRow[]>()

    if (error) throw error
    if (!data?.length) break

    cliques.push(...data)
    if (data.length < PAGE_AGREGACAO) break
    offset += PAGE_AGREGACAO
  }

  return cliques
}

async function carregarPainelCupons(cupons: Array<{ id: string; code: string; store_name: string; campaign: string | null }>) {
  const metricas = cupons.reduce<MetricasCupom>((acc, cupom) => {
    acc[cupom.id] = { reveals: 0, copies: 0, clicks: 0, exitRate: 0 }
    return acc
  }, {})

  const [eventos, cliques] = await Promise.all([
    carregarEventosCupons(cupons.map(cupom => cupom.id)),
    carregarCliquesComCupom(),
  ])

  const cuponsPorId = new Map(cupons.map(cupom => [cupom.id, cupom]))
  const lojasReveladas: Record<string, number> = {}
  const clubesInteresse: Record<string, number> = {}
  const cuponsCopiados: Record<string, { nome: string; detalhe?: string; total: number }> = {}
  const produtosSaida: Record<string, { nome: string; detalhe?: string; total: number }> = {}
  const campanhas: Record<string, { nome: string; reveals: number; copies: number; clicks: number; taxa: number }> = {}

  function campanhaInfo(nome: string | null | undefined) {
    const chave = nomeRanking(nome, 'Sem campanha')
    if (!campanhas[chave]) campanhas[chave] = { nome: chave, reveals: 0, copies: 0, clicks: 0, taxa: 0 }
    return campanhas[chave]
  }

  eventos.forEach(evento => {
    const cupom = evento.coupon_id ? cuponsPorId.get(evento.coupon_id) : null
    const campanha = campanhaInfo(evento.campaign || cupom?.campaign)

    if (evento.coupon_id && metricas[evento.coupon_id]) {
      if (evento.event_type === 'coupon_reveal') metricas[evento.coupon_id].reveals += 1
      if (evento.event_type === 'coupon_copy') metricas[evento.coupon_id].copies += 1
    }

    if (evento.event_type === 'coupon_reveal') {
      campanha.reveals += 1
      somarRanking(lojasReveladas, evento.store_name || cupom?.store_name)
      somarRanking(clubesInteresse, evento.club)
    }

    if (evento.event_type === 'coupon_copy') {
      campanha.copies += 1
      somarRankingDetalhado(
        cuponsCopiados,
        evento.coupon_id || evento.coupon_code,
        evento.coupon_code || cupom?.code,
        evento.store_name || cupom?.store_name,
      )
    }
  })

  cliques.forEach(clique => {
    const cupom = clique.coupon_id ? cuponsPorId.get(clique.coupon_id) : null
    if (clique.coupon_id && metricas[clique.coupon_id]) metricas[clique.coupon_id].clicks += 1
    campanhaInfo(clique.campanha || cupom?.campaign).clicks += 1
    somarRankingDetalhado(
      produtosSaida,
      clique.produto_id || clique.produto_titulo,
      clique.produto_titulo || clique.produto_id,
      clique.loja_nome || clique.clube,
    )
  })

  Object.values(metricas).forEach(item => {
    item.exitRate = taxa(item.clicks, item.reveals)
  })

  Object.values(campanhas).forEach(campanha => {
    campanha.taxa = taxa(campanha.clicks, campanha.reveals)
  })

  const revelados = eventos.filter(evento => evento.event_type === 'coupon_reveal').length
  const copiados = eventos.filter(evento => evento.event_type === 'coupon_copy').length
  const cliquesAposCupom = cliques.length

  return {
    metricas,
    painel: {
      resumo: {
        cuponsRevelados: revelados,
        cuponsCopiados: copiados,
        cliquesAposCupom,
        leadsCaptados: 0,
        taxaCliqueAposCupom: taxa(cliquesAposCupom, revelados),
      },
      rankings: {
        lojasReveladas: ordenarRanking(lojasReveladas),
        cuponsCopiados: ordenarRankingDetalhado(cuponsCopiados),
        clubesInteresse: ordenarRanking(clubesInteresse),
        produtosSaida: ordenarRankingDetalhado(produtosSaida),
        campanhas: Object.values(campanhas)
          .sort((a, b) => b.clicks - a.clicks || b.taxa - a.taxa || b.reveals - a.reveals)
          .slice(0, 8),
      },
    },
  }
}

async function carregarAlcance(cupons: Array<{ id: string; store_id: string | null; store_name: string; store_url?: string | null }>) {
  if (cupons.length === 0) return { alcance: {}, exemplos: {} }

  const supabase = criarSupabaseAdmin()

  const inicial: {
    alcance: Record<string, number>
    exemplos: Record<string, Array<{ id: string; titulo: string | null; fonte_nome: string | null }>>
  } = { alcance: {}, exemplos: {} }

  const resultados = await Promise.all(cupons.map(async cupom => {
    const host = hostUrl(cupom.store_url)
    const filtros = [
      cupom.store_id ? `fonte_id.eq.${cupom.store_id}` : '',
      cupom.store_name ? `fonte_nome.ilike.%${cupom.store_name}%` : '',
      host ? `fonte_url.ilike.%${host}%` : '',
      host ? `link_original.ilike.%${host}%` : '',
    ].filter(Boolean)

    if (filtros.length === 0) return { id: cupom.id, total: 0, exemplos: [] }

    const filtroLoja = filtros.join(',')

    const [{ count, error: countError }, { data, error: exemplosError }] = await Promise.all([
      supabase
        .from('produtos')
        .select('id', { count: 'exact', head: true })
        .eq('ativo', true)
        .or(filtroLoja),
      supabase
        .from('produtos')
        .select('id,titulo,fonte_nome,link_original')
        .eq('ativo', true)
        .or(filtroLoja)
        .order('updated_at', { ascending: false })
        .limit(5)
        .returns<Array<{ id: string; titulo: string | null; fonte_nome: string | null }>>(),
    ])

    if (countError) throw countError
    if (exemplosError) throw exemplosError

    return {
      id: cupom.id,
      total: count || 0,
      exemplos: data || [],
    }
  }))

  return resultados.reduce((acc, resultado) => {
    acc.alcance[resultado.id] = resultado.total
    acc.exemplos[resultado.id] = resultado.exemplos
    return acc
  }, inicial)
}

export async function GET() {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (!cuponsTesteAtivos()) return Response.json({ error: 'Cupons de teste desabilitados.' }, { status: 404 })

  try {
    const supabase = criarSupabaseAdmin()
    const [{ data: cupons, error }, { data: lojas, error: lojasError }] = await Promise.all([
      supabase
        .from('store_coupons')
        .select('*')
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('fontes')
        .select('id,nome,url')
        .order('nome', { ascending: true }),
    ])

    if (error) throw error
    if (lojasError) throw lojasError

    const cuponsLista = cupons || []
    const lojasPorId = new Map((lojas || []).map(loja => [loja.id, loja]))
    const [painelInfo, alcanceInfo] = await Promise.all([
      carregarPainelCupons(cuponsLista),
      carregarAlcance(cuponsLista.map(cupom => ({
        id: cupom.id,
        store_id: cupom.store_id,
        store_name: cupom.store_name,
        store_url: cupom.store_id ? lojasPorId.get(cupom.store_id)?.url : null,
      }))),
    ])

    return Response.json({
      cupons: cuponsLista,
      lojas: lojas || [],
      metricas: painelInfo.metricas,
      painel: painelInfo.painel,
      alcance: alcanceInfo.alcance,
      exemplos: alcanceInfo.exemplos,
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao carregar cupons.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (!cuponsTesteAtivos()) return Response.json({ error: 'Cupons de teste desabilitados.' }, { status: 404 })

  try {
    const body = await request.json()
    const storeName = texto(body.store_name)
    const code = texto(body.code).toUpperCase()
    const discountLabel = texto(body.discount_label)
    if (!storeName || !code || !discountLabel) {
      return Response.json({ error: 'Loja, cupom e benefício são obrigatórios.' }, { status: 400 })
    }

    const { data, error } = await criarSupabaseAdmin()
      .from('store_coupons')
      .insert({
        store_id: texto(body.store_id) || null,
        store_name: storeName,
        code,
        discount_label: discountLabel,
        description: texto(body.description) || null,
        rules: texto(body.rules) || null,
        valid_from: dataOuNull(body.valid_from),
        valid_until: dataFimOuNull(body.valid_until),
        is_active: body.is_active !== false,
        campaign: texto(body.campaign) || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return Response.json({ cupom: data }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao criar cupom.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (!cuponsTesteAtivos()) return Response.json({ error: 'Cupons de teste desabilitados.' }, { status: 404 })

  try {
    const body = await request.json()
    const id = texto(body.id)
    if (!id) return Response.json({ error: 'Cupom não informado.' }, { status: 400 })

    const atualizacao: Record<string, unknown> = {}
    if (typeof body.is_active === 'boolean') atualizacao.is_active = body.is_active
    atualizacao.updated_at = new Date().toISOString()

    const { data, error } = await criarSupabaseAdmin()
      .from('store_coupons')
      .update(atualizacao)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return Response.json({ cupom: data })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar cupom.' }, { status: 500 })
  }
}
