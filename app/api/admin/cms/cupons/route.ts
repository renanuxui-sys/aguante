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

function normalizarLoja(valor: string | null | undefined) {
  return (valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function lojasParecidas(a: string | null | undefined, b: string | null | undefined) {
  const lojaA = normalizarLoja(a)
  const lojaB = normalizarLoja(b)
  if (!lojaA || !lojaB) return false
  return lojaA === lojaB || lojaA.includes(lojaB) || lojaB.includes(lojaA)
}

async function carregarAlcance(cupons: Array<{ id: string; store_id: string | null; store_name: string }>) {
  if (cupons.length === 0) return {}

  const { data, error } = await criarSupabaseAdmin()
    .from('produtos')
    .select('id,fonte_id,fonte_nome')
    .eq('ativo', true)
    .limit(20000)
    .returns<Array<{ id: string; fonte_id: string | null; fonte_nome: string | null }>>()

  if (error) throw error

  return cupons.reduce<Record<string, number>>((acc, cupom) => {
    acc[cupom.id] = (data || []).filter(produto => {
      const mesmoId = Boolean(cupom.store_id && produto.fonte_id === cupom.store_id)
      const mesmoNome = lojasParecidas(cupom.store_name, produto.fonte_nome)
      return mesmoId || mesmoNome
    }).length
    return acc
  }, {})
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
        .select('id,nome')
        .order('nome', { ascending: true }),
    ])

    if (error) throw error
    if (lojasError) throw lojasError

    const cuponsLista = cupons || []
    const [metricas, alcance] = await Promise.all([
      carregarMetricas(cuponsLista.map(cupom => cupom.id)),
      carregarAlcance(cuponsLista.map(cupom => ({
        id: cupom.id,
        store_id: cupom.store_id,
        store_name: cupom.store_name,
      }))),
    ])

    return Response.json({ cupons: cuponsLista, lojas: lojas || [], metricas, alcance })
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
