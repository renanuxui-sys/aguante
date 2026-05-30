import { cache } from 'react'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'
import { aplicarFiltroFontesVisiveis, carregarNomesFontesOcultas } from '@/lib/fonte-data'
import { aplicarCupomAtivo, carregarLojasComCupomAtivo } from '@/lib/cupom-data'
import type { Produto } from '@/types'

export const carregarProdutoAtivo = cache(async (id: string) => {
  const supabase = criarSupabaseAdmin()
  const fontesOcultas = await carregarNomesFontesOcultas(supabase)
  const { data, error } = await aplicarFiltroFontesVisiveis(supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .eq('ativo', true), fontesOcultas)
    .maybeSingle<Produto>()

  if (error) throw error
  return data
})

export async function carregarProdutosRelacionados(produto: Produto) {
  const supabase = criarSupabaseAdmin()
  const fontesOcultas = await carregarNomesFontesOcultas(supabase)
  const lojasComCupom = await carregarLojasComCupomAtivo(() => supabase
    .from('store_coupons')
    .select('store_id,store_name,valid_from,valid_until')
    .eq('is_active', true))
  let query = aplicarFiltroFontesVisiveis(supabase
    .from('produtos')
    .select(PRODUCT_CARD_SELECT)
    .neq('id', produto.id)
    .eq('ativo', true)
    .limit(5), fontesOcultas)

  if (produto.clube) query = query.eq('clube', produto.clube)

  const { data, error } = await query.returns<Produto[]>()
  if (error) throw error
  return aplicarCupomAtivo(data || [], lojasComCupom)
}
