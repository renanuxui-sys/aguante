/**
 * Atualiza métricas leves usadas pela home.
 *
 * A rotina diária de scraping roda este script no final para evitar que cada
 * visitante precise executar contagens em produtos.
 */

import { criarSupabase } from './scraper-utils.js'
import 'dotenv/config'

const supabase = criarSupabase()

async function contar(query) {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count || 0
}

async function main() {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [totalProdutos, novos24h] = await Promise.all([
    contar(supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true)),
    contar(supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true).gte('created_at', ontem)),
  ])

  const { error } = await supabase
    .from('home_metricas')
    .upsert({
      id: 'principal',
      total_produtos: totalProdutos,
      novos_24h: novos24h,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (error) throw new Error(error.message)

  console.log('✅ Métricas da home atualizadas')
  console.log(`   Camisas ativas: ${totalProdutos}`)
  console.log(`   Novos anúncios em 24h: ${novos24h}`)
}

main().catch(error => {
  console.error('❌ Erro ao atualizar métricas da home:', error.message)
  process.exit(1)
})
