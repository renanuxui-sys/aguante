import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

type TipoMetrica = 'views' | 'cliques' | 'likes'

const CAMPOS_METRICA: Record<TipoMetrica, 'views' | 'cliques_anuncio' | 'likes'> = {
  views: 'views',
  cliques: 'cliques_anuncio',
  likes: 'likes',
}

function tipoValido(tipo: unknown): tipo is TipoMetrica {
  return typeof tipo === 'string' && tipo in CAMPOS_METRICA
}

function criarClienteMetricas() {
  try {
    return { supabase: criarSupabaseAdmin(), usandoServiceRole: true }
  } catch (error) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) throw error
    console.warn('SUPABASE_SERVICE_ROLE_KEY ausente; /api/metricas usando anon key como fallback.')
    return {
      supabase: createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }),
      usandoServiceRole: false,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { produto_id, tipo, delta } = await req.json()

    if (typeof produto_id !== 'string' || !tipoValido(tipo)) {
      return NextResponse.json({ erro: 'produto_id e tipo válido são obrigatórios' }, { status: 400 })
    }

    const { supabase, usandoServiceRole } = criarClienteMetricas()
    const campo = CAMPOS_METRICA[tipo]
    const { data: produto, error: buscaError } = await supabase
      .from('produtos')
      .select('views,cliques_anuncio,likes')
      .eq('id', produto_id)
      .single()

    if (buscaError) return NextResponse.json({ erro: buscaError.message }, { status: 500 })

    const totalAtual = Number(produto?.[campo] || 0)
    const incremento = tipo === 'likes' ? Number(delta || 0) : 1
    const proximoTotal = tipo === 'likes'
      ? Math.max(0, totalAtual + incremento)
      : totalAtual + 1

    const { error: updateError } = await supabase
      .from('produtos')
      .update({ [campo]: proximoTotal, updated_at: new Date().toISOString() })
      .eq('id', produto_id)

    if (updateError) return NextResponse.json({ erro: updateError.message }, { status: 500 })

    return NextResponse.json({ ok: true, [campo]: proximoTotal, usandoServiceRole })
  } catch (error) {
    return NextResponse.json(
      { erro: error instanceof Error ? error.message : 'Erro inesperado' },
      { status: 500 },
    )
  }
}
