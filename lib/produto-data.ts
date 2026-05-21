import { cache } from 'react'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'
import type { Produto } from '@/types'

export const carregarProdutoAtivo = cache(async (id: string) => {
  const supabase = criarSupabaseAdmin()
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .eq('ativo', true)
    .maybeSingle<Produto>()

  if (error) throw error
  return data
})

export async function carregarProdutosRelacionados(produto: Produto) {
  const supabase = criarSupabaseAdmin()
  let query = supabase
    .from('produtos')
    .select(PRODUCT_CARD_SELECT)
    .neq('id', produto.id)
    .eq('ativo', true)
    .limit(5)

  if (produto.clube) query = query.eq('clube', produto.clube)

  const { data, error } = await query.returns<Produto[]>()
  if (error) throw error
  return data || []
}
