import { cache } from 'react'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { cuponsTesteAtivos } from '@/lib/coupon-config'
import type { Produto, StoreCoupon } from '@/types'

export const carregarCupomAtivoProduto = cache(async (produto: Produto) => {
  if (!cuponsTesteAtivos()) return null

  const hoje = new Date().toISOString()
  const supabase = criarSupabaseAdmin()
  let query = supabase
    .from('store_coupons')
    .select('*')
    .eq('is_active', true)
    .or(`valid_from.is.null,valid_from.lte.${hoje}`)
    .or(`valid_until.is.null,valid_until.gte.${hoje}`)
    .order('valid_until', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (produto.fonte_id) {
    query = query.or(`store_id.eq.${produto.fonte_id},store_name.eq.${produto.fonte_nome}`)
  } else {
    query = query.eq('store_name', produto.fonte_nome)
  }

  const { data, error } = await query.maybeSingle<StoreCoupon>()
  if (error) {
    console.warn('Não foi possível carregar cupom:', error.message)
    return null
  }

  return data
})
