/**
 * Importa clubes sul-americanos e europeus no Supabase.
 *
 * Teste sem salvar:
 *   node importar-clubes-internacionais.js --dry-run
 *
 * Importar:
 *   node importar-clubes-internacionais.js
 */

import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const ARQUIVO_SQL = 'supabase-clubes-internacionais.sql'
const TAMANHO_LOTE = 50
const dryRun = process.argv.includes('--dry-run')

function criarSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env para importar clubes.')
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function extrairClubesDoSql() {
  const sql = fs.readFileSync(ARQUIVO_SQL, 'utf8')
  const regex = /\('((?:[^']|'')*)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/g

  return [...sql.matchAll(regex)].map(match => ({
    nome: match[1].replace(/''/g, "'"),
    slug: match[2],
    categoria: match[3],
    pais: match[4],
    destaque: false,
    ativo: true,
    ordem: Number(match[5]),
  }))
}

function contarPorCategoria(clubes) {
  return clubes.reduce((acc, clube) => {
    acc[clube.categoria] = (acc[clube.categoria] || 0) + 1
    return acc
  }, {})
}

async function main() {
  const clubes = extrairClubesDoSql()
  const slugs = clubes.map(clube => clube.slug)
  const duplicados = slugs.filter((slug, index) => slugs.indexOf(slug) !== index)

  if (duplicados.length > 0) {
    throw new Error(`Slugs duplicados: ${[...new Set(duplicados)].join(', ')}`)
  }

  console.log(`🚀 Importador de clubes internacionais${dryRun ? ' (dry-run)' : ''}`)
  console.log(`📦 ${clubes.length} clubes carregados de ${ARQUIVO_SQL}`)

  const contagem = contarPorCategoria(clubes)
  Object.entries(contagem).forEach(([categoria, total]) => {
    console.log(`   · ${categoria}: ${total}`)
  })

  if (dryRun) {
    console.log('\nAmostra:')
    clubes.slice(0, 10).forEach(clube => {
      console.log(`   · [${clube.categoria}] ${clube.nome} (${clube.pais})`)
    })
    console.log('\n✅ Dry-run concluído. Nada foi salvo.')
    return
  }

  const supabase = criarSupabaseAdmin()
  let total = 0

  for (let i = 0; i < clubes.length; i += TAMANHO_LOTE) {
    const lote = clubes.slice(i, i + TAMANHO_LOTE)
    const slugsLote = lote.map(clube => clube.slug)

    const { data: existentes, error: erroBusca } = await supabase
      .from('clubes')
      .select('slug')
      .in('slug', slugsLote)

    if (erroBusca) {
      throw new Error(`Erro ao buscar lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${erroBusca.message}`)
    }

    const slugsExistentes = new Set((existentes || []).map(clube => clube.slug))
    const paraAtualizar = lote.filter(clube => slugsExistentes.has(clube.slug))
    const paraInserir = lote.filter(clube => !slugsExistentes.has(clube.slug))

    for (const clube of paraAtualizar) {
      const { error: erroUpdate } = await supabase
        .from('clubes')
        .update(clube)
        .eq('slug', clube.slug)

      if (erroUpdate) {
        throw new Error(`Erro ao atualizar "${clube.nome}": ${erroUpdate.message}`)
      }
    }

    if (paraInserir.length > 0) {
      const { error: erroInsert } = await supabase
        .from('clubes')
        .insert(paraInserir)

      if (erroInsert) {
        throw new Error(`Erro ao inserir lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${erroInsert.message}`)
      }
    }

    total += lote.length
    console.log(`  ✅ Lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${paraInserir.length} inseridos, ${paraAtualizar.length} atualizados (total: ${total})`)
  }

  console.log(`\n🏁 Concluído! ${total} clubes importados/atualizados.`)
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
