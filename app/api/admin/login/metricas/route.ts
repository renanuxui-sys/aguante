import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { produto_id, tipo } = await req.json()

  if (!produto_id || !tipo) {
    return NextResponse.json({ erro: 'produto_id e tipo são obrigatórios' }, { status: 400 })
  }

  if (tipo === 'views') {
    const { error } = await supabase.rpc('incrementar_views', { produto_id })
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  } else if (tipo === 'cliques') {
    const { error } = await supabase.rpc('incrementar_cliques', { produto_id })
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ erro: 'tipo inválido' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}