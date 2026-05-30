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
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function slugComparavel(valor: string | null | undefined) {
  return textoComparavel(valor).replace(/\s+/g, '-')
}

function nomesParecidos(a: string | null | undefined, b: string | null | undefined) {
  const textoA = textoComparavel(a)
  const textoB = textoComparavel(b)
  const slugA = slugComparavel(a)
  const slugB = slugComparavel(b)

  if (!textoA || !textoB) return false
  if (textoA === textoB || slugA === slugB) return true
  return textoA.includes(textoB) || textoB.includes(textoA) || slugA.includes(slugB) || slugB.includes(slugA)
}

function hostUrl(url: string | null | undefined) {
  if (!url) return ''

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function cupomVigente(cupom: StoreCoupon, agora: Date) {
  const inicioOk = !cupom.valid_from || new Date(cupom.valid_from) <= agora
  const fimOk = !cupom.valid_until || new Date(cupom.valid_until) >= agora
  return cupom.is_active && inicioOk && fimOk
}

async function resolverFonteProduto(produto: Produto) {
  if (produto.fonte_id) return { id: produto.fonte_id, nome: produto.fonte_nome, url: produto.fonte_url }

  const supabase = criarSupabaseAdmin()
  const candidatos = [
    produto.fonte_url ? `url.eq.${produto.fonte_url}` : '',
    produto.fonte_nome ? `nome.eq.${produto.fonte_nome}` : '',
  ].filter(Boolean)

  if (candidatos.length === 0) return null

  const { data, error } = await supabase
    .from('fontes')
    .select('id,nome,url')
    .or(candidatos.join(','))
    .limit(1)
    .maybeSingle<{ id: string; nome: string; url: string }>()

  if (error) {
    console.warn('Não foi possível resolver loja do produto para cupom:', error.message)
    return null
  }

  if (data) return data

  const hostProduto = hostUrl(produto.fonte_url || produto.link_original)
  if (!hostProduto && !produto.fonte_nome) return null

  const { data: fontes, error: fontesError } = await supabase
    .from('fontes')
    .select('id,nome,url')
    .limit(1000)
    .returns<Array<{ id: string; nome: string; url: string }>>()

  if (fontesError) {
    console.warn('Não foi possível resolver loja do produto para cupom:', fontesError.message)
    return null
  }

  return (fontes || []).find(fonte => {
    const mesmoNome = nomesParecidos(fonte.nome, produto.fonte_nome)
    const hostFonte = hostUrl(fonte.url)
    const mesmoHost = Boolean(hostFonte && hostProduto && hostFonte === hostProduto)
    return mesmoNome || mesmoHost
  }) || null
}

export const carregarCupomAtivoProduto = cache(async (produto: Produto) => {
  if (!cuponsTesteAtivos()) return null

  const supabase = criarSupabaseAdmin()
  const [fonteResolvida, { data, error }] = await Promise.all([
    resolverFonteProduto(produto),
    supabase
      .from('store_coupons')
      .select('*')
      .eq('is_active', true)
      .order('valid_until', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200)
      .returns<StoreCoupon[]>(),
  ])

  if (error) {
    console.warn('Não foi possível carregar cupom:', error.message)
    return null
  }

  const agora = new Date()
  const fonteIds = new Set([produto.fonte_id, fonteResolvida?.id].filter(Boolean))
  const nomesLojaProduto = [produto.fonte_nome, fonteResolvida?.nome].filter(Boolean)

  return (data || []).find(cupom => {
    const mesmaLojaPorId = Boolean(cupom.store_id && fonteIds.has(cupom.store_id))
    const mesmaLojaPorNome = nomesLojaProduto.some(nome => nomesParecidos(cupom.store_name, nome))
    return (mesmaLojaPorId || mesmaLojaPorNome) && cupomVigente(cupom, agora)
  }) || null
})
