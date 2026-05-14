import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'

export async function GET(req: NextRequest) {
  try {
    const clube = new URL(req.url).searchParams.get('clube')?.trim()
    if (!clube || clube === 'nao_escolheu') {
      return NextResponse.json({ produtos: [] })
    }

    const supabase = criarSupabaseAdmin()
    const { data, error } = await supabase
      .from('produtos')
      .select(PRODUCT_CARD_SELECT)
      .eq('ativo', true)
      .eq('clube', clube)
      .order('views', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    return NextResponse.json({ produtos: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar produtos.' },
      { status: 500 }
    )
  }
}
