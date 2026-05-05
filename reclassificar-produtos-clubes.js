/**
 * Reclassifica produtos usando os clubes cadastrados no Supabase.
 *
 * Roda nos produtos sem clube:
 * node reclassificar-produtos-clubes.js
 *
 * Reprocessa todos os produtos:
 * node reclassificar-produtos-clubes.js --todos
 */

import { criarSupabase, carregarClubesMap, identificarClube } from './scraper-utils.js'
import 'dotenv/config'

const supabase = criarSupabase()
const PAGE = 1000

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    todos: args.includes('--todos'),
    dryRun: args.includes('--dry-run'),
  }
}

async function carregarProdutos({ todos }) {
  const produtos = []
  let offset = 0

  while (true) {
    let query = supabase
      .from('produtos')
      .select('id, titulo, clube')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)

    if (!todos) {
      query = query.or('clube.is.null,clube.eq.')
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    if (!data?.length) break

    produtos.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  return produtos
}

async function main() {
  const options = parseArgs()
  const clubesMap = await carregarClubesMap(supabase)
  const produtos = await carregarProdutos(options)
  let atualizados = 0
  let semClube = 0

  console.log(`🔎 Produtos analisados: ${produtos.length}`)
  console.log(`⚽ Clubes carregados: ${clubesMap.length}`)
  if (options.dryRun) console.log('Modo teste: nada será salvo no banco.')

  for (const produto of produtos) {
    const clube = identificarClube(produto.titulo, clubesMap)
    if (!clube) {
      semClube++
      continue
    }

    if (produto.clube === clube) continue

    if (!options.dryRun) {
      const { error } = await supabase
        .from('produtos')
        .update({ clube })
        .eq('id', produto.id)

      if (error) {
        console.warn(`  ⚠️  ${produto.id}: ${error.message}`)
        continue
      }
    }

    atualizados++
    console.log(`  ✅ ${produto.titulo} → ${clube}`)
  }

  console.log(`\n🏁 Concluído: ${atualizados} produtos ${options.dryRun ? 'seriam atualizados' : 'atualizados'}.`)
  console.log(`   Sem clube identificado: ${semClube}`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
