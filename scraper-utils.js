/**
 * scraper-utils.js — Utilitários compartilhados entre todos os scrapers
 * 
 * Ciclo de vida de um produto:
 * 1. Antes do scraping: marca todos os produtos da fonte como ativo = false
 * 2. Durante o scraping: upsert seta ativo = true nos produtos encontrados
 * 3. Após o scraping: produtos não encontrados ficam ativo = false (sumiram do site de origem)
 * 
 * Isso preserva id, views, likes e histórico — o produto some do site mas não é deletado.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

export function criarSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Desativa todos os produtos de uma fonte antes do scraping.
 * Produtos encontrados durante o scraping serão reativados via upsert.
 */
export async function desativarProdutosDaFonte(supabase, fonteNome) {
  const { error, count } = await supabase
    .from('produtos')
    .update({ ativo: false })
    .eq('fonte_nome', fonteNome)
    .eq('ativo', true)

  if (error) {
    console.error(`  ⚠️  Erro ao desativar produtos de "${fonteNome}":`, error.message)
    return 0
  }

  console.log(`  🔄 ${count || 0} produtos de "${fonteNome}" marcados como inativos`)
  return count || 0
}

/**
 * Upsert com reativação automática.
 * Sempre inclui ativo: true para reativar produtos que voltaram a aparecer.
 */
export async function salvarProdutos(supabase, produtos) {
  if (produtos.length === 0) return 0

  // Garante que todos os produtos salvos ficam ativos
  const produtosAtivos = produtos.map(p => ({ ...p, ativo: true }))

  const { data, error } = await supabase
    .from('produtos')
    .upsert(produtosAtivos, { onConflict: 'link_original', ignoreDuplicates: false })
    .select('id')

  if (error) {
    console.error('  ❌ Erro ao salvar:', error.message)
    return 0
  }

  return data?.length || 0
}

/**
 * Relatório final — mostra quantos foram reativados, desativados e novos.
 */
export async function relatorioFinal(supabase, fonteNome, totalSalvos) {
  const { count: inativos } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true })
    .eq('fonte_nome', fonteNome)
    .eq('ativo', false)

  const { count: ativos } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true })
    .eq('fonte_nome', fonteNome)
    .eq('ativo', true)

  console.log(`\n📊 Relatório "${fonteNome}":`)
  console.log(`   ✅ Ativos (encontrados): ${ativos || 0}`)
  console.log(`   ⏸️  Inativos (não encontrados/vendidos): ${inativos || 0}`)
}

export function extrairAno(titulo) {
  if (!titulo) return null
  const match = titulo.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return match ? match[1] : null
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const CLUBES_MAP = [
  { clube: 'Flamengo',      termos: ['flamengo'] },
  { clube: 'Corinthians',   termos: ['corinthians'] },
  { clube: 'Palmeiras',     termos: ['palmeiras'] },
  { clube: 'São Paulo',     termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Grêmio',        termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', termos: ['internacional'] },
  { clube: 'Santos',        termos: ['santos'] },
  { clube: 'Atlético-MG',   termos: ['atlético mineiro', 'atletico mineiro', 'atlético-mg', 'atletico mg', 'galo'] },
  { clube: 'Botafogo',      termos: ['botafogo'] },
  { clube: 'Fluminense',    termos: ['fluminense'] },
  { clube: 'Vasco',         termos: ['vasco'] },
  { clube: 'Cruzeiro',      termos: ['cruzeiro'] },
  { clube: 'Athletico-PR',  termos: ['athletico', 'atletico pr', 'paranaense', 'furacão'] },
  { clube: 'Fortaleza',     termos: ['fortaleza'] },
  { clube: 'Bahia',         termos: ['bahia'] },
  { clube: 'Vitória',       termos: ['vitória', 'vitoria'] },
]

export function identificarClube(titulo) {
  const lower = (titulo || '').toLowerCase()
  for (const { clube, termos } of CLUBES_MAP) {
    if (termos.some(t => lower.includes(t))) return clube
  }
  return null
}
