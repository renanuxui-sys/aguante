/**
 * Reclassifica produtos existentes para clubes brasileiros adicionados depois.
 *
 * Testar:
 * node reclassificar-clubes-brasileiros-complemento.js
 *
 * Gravar no banco:
 * node reclassificar-clubes-brasileiros-complemento.js --confirmar
 */

import { criarSupabase, normalizarTexto } from './scraper-utils.js'
import 'dotenv/config'

const supabase = criarSupabase()
const PAGE = 1000
const confirmar = process.argv.includes('--confirmar')

const ALVOS = [
  { clube: 'Paysandu', termos: ['paysandu'] },
  { clube: 'Guarani', termos: ['guarani', 'guarani fc', 'guarani futebol clube'] },
  { clube: 'Santa Cruz', termos: ['santa cruz'] },
  { clube: 'Figueirense', termos: ['figueirense', 'figueira'] },
]

const bloqueiosPorClube = new Map([
  ['Guarani', ['paraguai', 'paraguay', 'asuncion', 'asuncao']],
])

function termoComBorda(termo) {
  return new RegExp(`(^|[^a-z0-9])${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)
}

function identificarClubeAlvo(titulo) {
  const texto = normalizarTexto(titulo || '')
  let melhor = null

  for (const alvo of ALVOS) {
    const bloqueios = bloqueiosPorClube.get(alvo.clube) || []
    if (bloqueios.some(bloqueio => termoComBorda(bloqueio).test(texto))) continue

    for (const termo of alvo.termos) {
      const termoNormalizado = normalizarTexto(termo)
      if (!termoComBorda(termoNormalizado).test(texto)) continue
      if (!melhor || termoNormalizado.length > melhor.tamanho) {
        melhor = { clube: alvo.clube, tamanho: termoNormalizado.length }
      }
    }
  }

  return melhor?.clube || null
}

async function carregarProdutos() {
  const produtos = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id,titulo,clube,fonte_nome,ativo')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)

    if (error) throw new Error(error.message)
    if (!data?.length) break

    produtos.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  return produtos
}

async function main() {
  const produtos = await carregarProdutos()
  const candidatos = produtos
    .map(produto => ({ ...produto, clubeIdentificado: identificarClubeAlvo(produto.titulo) }))
    .filter(produto => produto.clubeIdentificado && produto.clube !== produto.clubeIdentificado)

  console.log('🔎 Reclassificação focada: Paysandu, Guarani, Santa Cruz e Figueirense')
  console.log(`📦 Produtos analisados: ${produtos.length}`)
  console.log(`🎯 Candidatos encontrados: ${candidatos.length}`)
  if (!confirmar) console.log('Modo teste: nada será salvo. Use --confirmar para gravar.')

  for (const produto of candidatos) {
    if (confirmar) {
      const { error } = await supabase
        .from('produtos')
        .update({ clube: produto.clubeIdentificado })
        .eq('id', produto.id)

      if (error) {
        console.warn(`  ⚠️  ${produto.id}: ${error.message}`)
        continue
      }
    }

    const status = confirmar ? '✅' : '🧪'
    console.log(`  ${status} ${produto.titulo} | ${produto.clube || 'sem clube'} → ${produto.clubeIdentificado}`)
  }

  console.log(`\n🏁 Concluído: ${candidatos.length} produtos ${confirmar ? 'atualizados' : 'seriam atualizados'}.`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
