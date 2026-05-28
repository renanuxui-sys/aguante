import { cache } from 'react'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { cuponsTesteAtivos } from '@/lib/coupon-config'
import type { Produto, StoreCoupon } from '@/types'

function textoComparavel(valor: string | null | undefined) {
  return (valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function cupomVigente(cupom: StoreCoupon, agora: Date) {
  const inicioOk = !cupom.valid_from || new Date(cupom.valid_from) <= agora
  const fimOk = !cupom.valid_until || new Date(cupom.valid_until) >= agora
  return cupom.is_active && inicioOk && fimOk
}

export const carregarCupomAtivoProduto = cache(async (produto: Produto) => {
  if (!cuponsTesteAtivos()) return null

  const supabase = criarSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_coupons')
    .select('*')
    .eq('is_active', true)
    .order('valid_until', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<StoreCoupon[]>()

  if (error) {
    console.warn('Não foi possível carregar cupom:', error.message)
    return null
  }

  const agora = new Date()
  const nomeProduto = textoComparavel(produto.fonte_nome)

  return (data || []).find(cupom => {
    const mesmaLojaPorId = Boolean(produto.fonte_id && cupom.store_id === produto.fonte_id)
    const mesmaLojaPorNome = textoComparavel(cupom.store_name) === nomeProduto
    return (mesmaLojaPorId || mesmaLojaPorNome) && cupomVigente(cupom, agora)
  }) || null
})
