import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { cuponsTesteAtivos } from '@/lib/coupon-config'

type EventType = 'coupon_reveal' | 'coupon_copy'

function eventTypeValido(valor: unknown): valor is EventType {
  return valor === 'coupon_reveal' || valor === 'coupon_copy'
}

function limitarTexto(valor: unknown, limite = 500) {
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  return limpo ? limpo.slice(0, limite) : null
}

export async function POST(req: NextRequest) {
  if (!cuponsTesteAtivos()) {
    return NextResponse.json({ error: 'Cupons desabilitados.' }, { status: 404 })
  }

  try {
    const body = await req.json()
    if (!eventTypeValido(body.event_type) || typeof body.coupon_id !== 'string') {
      return NextResponse.json({ error: 'Evento ou cupom inválido.' }, { status: 400 })
    }

    const { error } = await criarSupabaseAdmin()
      .from('coupon_events')
      .insert({
        event_type: body.event_type,
        coupon_id: body.coupon_id,
        coupon_code: limitarTexto(body.coupon_code, 120),
        product_id: limitarTexto(body.product_id, 120),
        store_id: limitarTexto(body.store_id, 120),
        store_name: limitarTexto(body.store_name, 200),
        user_id: null,
        session_id: limitarTexto(body.session_id, 200),
        source: limitarTexto(body.source, 200),
        campaign: limitarTexto(body.campaign, 200),
        club: limitarTexto(body.club, 200),
        page_path: limitarTexto(body.page_path, 500),
        user_agent: limitarTexto(req.headers.get('user-agent'), 1000),
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro inesperado.' },
      { status: 500 },
    )
  }
}
