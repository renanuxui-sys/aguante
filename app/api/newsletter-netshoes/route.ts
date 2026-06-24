import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

type NewsletterBody = {
  email?: unknown
  clubes?: unknown
  todosClubes?: unknown
}

function normalizarEmail(email: unknown) {
  return String(email || '').trim().toLowerCase()
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizarClubes(clubes: unknown) {
  if (!Array.isArray(clubes)) return []

  return Array.from(new Set(
    clubes
      .map(clube => String(clube || '').trim())
      .filter(Boolean)
  )).slice(0, 32)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as NewsletterBody
    const email = normalizarEmail(body.email)
    const todosClubes = body.todosClubes !== false
    const clubes = todosClubes ? [] : normalizarClubes(body.clubes)

    if (!emailValido(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }

    if (!todosClubes && clubes.length === 0) {
      return NextResponse.json({ error: 'Escolha pelo menos um clube ou marque todos.' }, { status: 400 })
    }

    const supabase = criarSupabaseAdmin()
    const { data: existente, error: buscaError } = await supabase
      .from('newsletter_netshoes')
      .select('id,unsubscribe_token')
      .eq('email', email)
      .maybeSingle()

    if (buscaError) throw buscaError

    const payload = {
      email,
      clubes_interesse: clubes,
      todos_clubes: todosClubes,
      ativo: true,
      origem: 'ofertas-netshoes',
      unsubscribe_token: existente?.unsubscribe_token || randomBytes(24).toString('hex'),
      updated_at: new Date().toISOString(),
    }

    const query = existente?.id
      ? supabase.from('newsletter_netshoes').update(payload).eq('id', existente.id)
      : supabase.from('newsletter_netshoes').insert(payload)

    const { error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao cadastrar newsletter Netshoes:', error)
    return NextResponse.json({ error: 'Não foi possível cadastrar o alerta agora.' }, { status: 500 })
  }
}
