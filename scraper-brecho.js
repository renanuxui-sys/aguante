/**
 * Scraper — Brechó do Futebol (Shopify)
 * Roda com: node scraper-brecho-v2.js
 */

import fetch from 'node-fetch'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, carregarClubesMapPorCategoria, combinarClubesMap, sleep } from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Brechó do Futebol'
const FONTE_URL  = 'https://brechodofutebol.com'
const DELAY_MS   = 1000
const LIMITE     = 250

const supabase = criarSupabase()

const COLECOES = [
  { slug: 'flamengo',             clube: 'Flamengo' },
  { slug: 'botafogo',             clube: 'Botafogo' },
  { slug: 'fluminense',           clube: 'Fluminense' },
  { slug: 'vasco-da-gama',        clube: 'Vasco' },
  { slug: 'corinthians',          clube: 'Corinthians' },
  { slug: 'palmeiras',            clube: 'Palmeiras' },
  { slug: 'santos',               clube: 'Santos' },
  { slug: 'sao-paulo',            clube: 'São Paulo' },
  { slug: 'gremio',               clube: 'Grêmio' },
  { slug: 'internacional',        clube: 'Internacional' },
  { slug: 'atletico-mineiro',     clube: 'Atlético-MG' },
  { slug: 'cruzeiro',             clube: 'Cruzeiro' },
  { slug: 'athletico-paranaense', clube: 'Athletico-PR' },
  { slug: 'fortaleza',            clube: 'Fortaleza' },
  { slug: 'bahia',                clube: 'Bahia' },
  { slug: 'vitoria',              clube: 'Vitória' },
  { slug: 'demais-clubes-da-bahia',          clube: null, categorias: ['Clubes Brasileiros'] },
  { slug: 'demais-clubes-do-rio-de-janeiro', clube: null, categorias: ['Clubes Brasileiros'] },
  { slug: 'demais-clubes-gauchos',           clube: null, categorias: ['Clubes Brasileiros'] },
  { slug: 'demais-clubes-de-minas-gerais',   clube: null, categorias: ['Clubes Brasileiros'] },
  { slug: 'demais-clubes-parana',            clube: null, categorias: ['Clubes Brasileiros'] },
  { slug: 'demais-clubes-sao-paulo',         clube: null, categorias: ['Clubes Brasileiros'] },
  { slug: 'selecoes-nacionais',              clube: null, categorias: ['Seleções'] },
  { slug: 'clubes-europeus',                 clube: null, categorias: ['Clubes Europeus'], somenteIdentificados: true },
  { slug: 'clubes-latino-americanos',        clube: null, categorias: ['Clubes Sulamericanos'], somenteIdentificados: true },
]

async function buscarPagina(slug, page) {
  const url = `${FONTE_URL}/collections/${slug}/products.json?limit=${LIMITE}&page=${page}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' }, timeout: 15000 })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }
    const data = await res.json()
    return data.products || []
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

function converterProduto(produto, clubeFixo, clubesMap, { somenteIdentificados = false } = {}) {
  const titulo   = produto.title || ''
  const link     = `${FONTE_URL}/products/${produto.handle}`
  const imagem   = produto.images?.[0]?.src || null
  const preco    = produto.variants?.[0]?.price ? parseFloat(produto.variants[0].price) : null

  const clube = clubeFixo || identificarClube(titulo, clubesMap)
  if (somenteIdentificados && !clube) return null

  return {
    titulo,
    link_original: link,
    imagem_url: imagem,
    preco,
    clube,
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: produto.tags || [],
    de_jogo: titulo.toLowerCase().includes('jogo'),
    novidade: false,
    alta_procura: false,
  }
}

async function rasparColecao({ slug, clube, categorias = ['Clubes Brasileiros'], somenteIdentificados = false }, clubesPorCategoria) {
  console.log(`\n⚽ ${clube || slug}`)
  const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))
  let page = 1
  let totalColecao = 0

  while (true) {
    const produtos = await buscarPagina(slug, page)
    if (produtos.length === 0) break

    const convertidos = produtos
      .map(p => converterProduto(p, clube, clubesMap, { somenteIdentificados }))
      .filter(Boolean)
    const salvos = await salvarProdutos(supabase, convertidos)
    totalColecao += salvos
    console.log(`  ✅ Página ${page} — ${salvos} salvos (total: ${totalColecao})`)

    if (produtos.length < LIMITE) break
    page++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Brechó do Futebol\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesPorCategoria)
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ativos.`)
}

main().catch(console.error)
