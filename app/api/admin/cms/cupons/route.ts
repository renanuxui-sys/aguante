import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { cuponsTesteAtivos } from '@/lib/coupon-config'

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

async function carregarMetricas(couponIds: string[]) {
  if (couponIds.length === 0) return {}

  const { data, error } = await criarSupabaseAdmin()
    .from('coupon_events')
    .select('coupon_id,event_type')
    .in('coupon_id', couponIds)

  if (error) throw error

  return (data || []).reduce<Record<string, { reveals: number; copies: number }>>((acc, evento) => {
    if (!evento.coupon_id) return acc
    if (!acc[evento.coupon_id]) acc[evento.coupon_id] = { reveals: 0, copies: 0 }
    if (evento.event_type === 'coupon_reveal') acc[evento.coupon_id].reveals += 1
    if (evento.event_type === 'coupon_copy') acc[evento.coupon_id].copies += 1
    return acc
  }, {})
}

function hostUrl(url: string | null | undefined) {
  if (!url) return ''

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
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
    const [metricas, alcanceInfo] = await Promise.all([
      carregarMetricas(cuponsLista.map(cupom => cupom.id)),
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
      metricas,
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
