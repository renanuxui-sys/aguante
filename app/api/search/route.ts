import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'

const POR_PAGINA = 20

export async function GET(req: NextRequest) {
  try {
    const supabase = criarSupabaseAdmin()
    const params = new URL(req.url).searchParams
    const q = params.get('q') || ''
    const categoria = params.get('categoria')
    const clubeExato = params.get('clube') || ''
    const decada = params.get('decada')
    const ordenar = params.get('ordenar')
    const deJogo = params.get('de_jogo') === 'true'
    const ordem = params.get('ordem') || 'mais recente'
    const pagina = Math.max(1, Number(params.get('pagina') || '1') || 1)

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
      if (nomes.length === 0) return NextResponse.json({ produtos: [], total: 0 })
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

    const { data, count, error } = await query.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1)
    if (error) throw error

    return NextResponse.json({ produtos: data || [], total: count || 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar produtos.' },
      { status: 500 }
    )
  }
}
