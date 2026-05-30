import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'
import { aplicarFiltroFontesVisiveis, carregarNomesFontesOcultas } from '@/lib/fonte-data'
import { aplicarCupomAtivo, carregarLojasComCupomAtivo } from '@/lib/cupom-data'

export async function GET(req: NextRequest) {
  try {
    const clube = new URL(req.url).searchParams.get('clube')?.trim()
    if (!clube || clube === 'nao_escolheu') {
      return NextResponse.json({ produtos: [] })
    }

    const supabase = criarSupabaseAdmin()
    const fontesOcultas = await carregarNomesFontesOcultas(supabase)
    const lojasComCupom = await carregarLojasComCupomAtivo(() => supabase
      .from('store_coupons')
      .select('store_id,store_name,valid_from,valid_until')
      .eq('is_active', true))
    const { data, error } = await aplicarFiltroFontesVisiveis(supabase
      .from('produtos')
      .select(PRODUCT_CARD_SELECT)
      .eq('ativo', true)
      .eq('clube', clube)
      .order('views', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(30), fontesOcultas)

    if (error) throw error

    return NextResponse.json({ produtos: aplicarCupomAtivo(data || [], lojasComCupom) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar produtos.' },
      { status: 500 }
    )
  }
}
