/**
 * Scraper — Brechó FC (Shopify)
 * Roda com: node scraper-brechofc.js
 */

import fetch from 'node-fetch'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, identificarSelecao, carregarClubesMap, sleep } from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Brechó FC'
const FONTE_URL  = 'https://brechofc.com'
const DELAY_MS   = 1000
const LIMITE     = 250

const supabase = criarSupabase()

// Coleções a raspar
const COLECOES = [
  { slug: 'todos-os-produtos', clube: null },
  { slug: 'times-internacionais', clube: null, somenteSelecoes: true },
  { slug: 'times-internacionais-1', clube: null, somenteIdentificados: true },
]

async function buscarPagina(slug, page) {
  const url = `${FONTE_URL}/collections/${slug}/products.json?limit=${LIMITE}&page=${page}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }
    const data = await res.json()
    return data.products || []
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

function converterProduto(produto, clubeFixo, clubesMap, { somenteSelecoes = false, somenteIdentificados = false } = {}) {
  const titulo    = produto.title || ''
  const link      = `${FONTE_URL}/products/${produto.handle}`
  const imagem    = produto.images?.[0]?.src || null
  const variante  = produto.variants?.[0]
  const preco     = variante?.price ? parseFloat(variante.price) : null
  const disponivel = variante?.available !== false

  // Ignora esgotados
  if (!disponivel) return null

  const tags = produto.tags || []
  const tagsNormalizadas = tags.map(t => t.toLowerCase())
  const internacionalOuSelecao = tagsNormalizadas.some(t =>
    t.includes('internacional') ||
    t.includes('internacionais') ||
    t.includes('seleção') ||
    t.includes('selecao') ||
    t.includes('seleções') ||
    t.includes('selecoes')
  )

  if (!somenteSelecoes && internacionalOuSelecao) return null

  const clube = clubeFixo || (somenteSelecoes ? identificarSelecao(titulo) : identificarClube(titulo, clubesMap))

  if ((somenteSelecoes || somenteIdentificados) && !clube) return null

  return {
    titulo,
    link_original: link,
    imagem_url: imagem,
    preco,
    clube,
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags,
    de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('match'),
    novidade: false,
    alta_procura: false,
  }
}

async function rasparColecao({ slug, clube, somenteSelecoes = false, somenteIdentificados = false }, clubesMap) {
  console.log(`\n⚽ ${clube || slug}`)

  let page = 1
  let totalColecao = 0
  let esgotados = 0

  while (true) {
    console.log(`  📄 Página ${page}`)
    const produtos = await buscarPagina(slug, page)
    if (produtos.length === 0) break

    const convertidos = produtos
      .map(p => converterProduto(p, clube, clubesMap, { somenteSelecoes, somenteIdentificados }))
      .filter(Boolean)

    esgotados += produtos.length - convertidos.length

    if (convertidos.length > 0) {
      const salvos = await salvarProdutos(supabase, convertidos)
      totalColecao += salvos
      console.log(`  ✅ ${salvos} salvos (${produtos.length - convertidos.length} esgotados ignorados) — total: ${totalColecao}`)
    }

    if (produtos.length < LIMITE) break
    page++
    await sleep(DELAY_MS)
  }

  console.log(`  ⏸️  Total esgotados ignorados: ${esgotados}`)
  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Brechó FC\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesMap = await carregarClubesMap(supabase)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesMap)
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)
