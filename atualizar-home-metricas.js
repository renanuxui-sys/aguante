/**
 * Atualiza métricas leves usadas pela home.
 *
 * A rotina diária de scraping roda este script no final para evitar que cada
 * visitante precise executar contagens em produtos.
 */

import { criarSupabase, atualizarHomeMetricas } from './scraper-utils.js'
import 'dotenv/config'

const supabase = criarSupabase()

async function main() {
  await atualizarHomeMetricas(supabase)
}

main().catch(error => {
  console.error('❌ Erro ao atualizar métricas da home:', error.message)
  process.exit(1)
})
