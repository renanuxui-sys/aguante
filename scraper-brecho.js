/**
 * Scraper — Brechó do Futebol
 * Usa a API JSON nativa do Shopify — sem autenticação necessária
 * Roda com: node scraper-brecho.js
 */

import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const FONTE_NOME = 'Brechó do Futebol'
const FONTE_URL  = 'https://brechodofutebol.com'
const DELAY_MS   = 1000
const LIMITE     = 250 // máximo permitido pelo Shopify

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Mapeamento de coleção → clube
const COLECOES = [
  { slug: 'flamengo',           clube: 'Flamengo' },
  { slug: 'botafogo',           clube: 'Botafogo' },
  { slug: 'fluminense',         clube: 'Fluminense' },
  { slug: 'vasco-da-gama',      clube: 'Vasco' },
  { slug: 'corinthians',        clube: 'Corinthians' },
  { slug: 'palmeiras',          clube: 'Palmeiras' },
  { slug: 'santos',             clube: 'Santos' },
  { slug: 'sao-paulo',          clube: 'São Paulo' },
  { slug: 'gremio',             clube: 'Grêmio' },
  { slug: 'internacional',      clube: 'Internacional' },
  { slug: 'atletico-mineiro',   clube: 'Atlético-MG' },
  { slug: 'cruzeiro',           clube: 'Cruzeiro' },
  { slug: 'athletico-paranaense', clube: 'Athletico-PR' },
  { slug: 'fortaleza',          clube: 'Fortaleza' },
  { slug: 'bahia',              clube: 'Bahia' },
  { slug: 'vitoria',            clube: 'Vitória' },
  // Demais clubes brasileiros (sem clube específico identificado)
  { slug: 'demais-clubes-da-bahia',          clube: null },
  { slug: 'demais-clubes-do-rio-de-janeiro', clube: null },
  { slug: 'demais-clubes-gauchos',           clube: null },
  { slug: 'demais-clubes-de-minas-gerais',   clube: null },
  { slug: 'demais-clubes-parana',            clube: null },
  { slug: 'demais-clubes-sao-paulo',         clube: null },
]

const CLUBES_MAP = [
  { clube: 'Flamengo',      termos: ['flamengo'] },
  { clube: 'Corinthians',   termos: ['corinthians'] },
  { clube: 'Palmeiras',     termos: ['palmeiras'] },
  { clube: 'São Paulo',     termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Grêmio',        termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', termos: ['internacional', 'inter '] },
  { clube: 'Santos',        termos: ['santos'] },
  { clube: 'Atlético-MG',   termos: ['atlético mineiro', 'atletico mineiro', 'atlético-mg', 'galo'] },
  { clube: 'Botafogo',      termos: ['botafogo'] },
  { clube: 'Fluminense',    termos: ['fluminense'] },
  { clube: 'Vasco',         termos: ['vasco'] },
  { clube: 'Cruzeiro',      termos: ['cruzeiro'] },
  { clube: 'Athletico-PR',  termos: ['athletico', 'paranaense', 'furacão'] },
  { clube: 'Fortaleza',     termos: ['fortaleza'] },
  { clube: 'Bahia',         termos: ['bahia'] },
  { clube: 'Vitória',       termos: ['vitória', 'vitoria'] },
]

function identificarClube(titulo) {
  const tituloLower = titulo.toLowerCase()
  for (const { clube, termos } of CLUBES_MAP) {
    if (termos.some(t => tituloLower.includes(t))) return clube
  }
  return null
}

function extrairAno(titulo) {
  const match = titulo.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return match ? match[1] : null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Buscar uma página da coleção ─────────────────────────
async function buscarPagina(slug, page) {
  const url = `${FONTE_URL}/collections/${slug}/products.json?limit=${LIMITE}&page=${page}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) {
      console.warn(`  ⚠️  Status ${res.status}`)
      return []
    }
    const data = await res.json()
    return data.products || []
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

// ── Converter produto Shopify para formato do banco ──────
function converterProduto(produto, clubeFixo) {
  const titulo  = produto.title || ''
  const handle  = produto.handle || ''
  const link    = `${FONTE_URL}/products/${handle}`
  const imagem  = produto.images?.[0]?.src || null
  const variante = produto.variants?.[0]
  const preco   = variante?.price ? parseFloat(variante.price) : null
  const clube   = clubeFixo || identificarClube(titulo)

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
    de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('match'),
    novidade: false,
    alta_procura: false,
    ativo: true,
  }
}

// ── Salvar no Supabase ───────────────────────────────────
async function salvarProdutos(produtos) {
  if (produtos.length === 0) return 0

  const { data, error } = await supabase
    .from('produtos')
    .upsert(produtos, { onConflict: 'link_original', ignoreDuplicates: false })
    .select('id')

  if (error) {
    console.error('  ❌ Erro ao salvar:', error.message)
    return 0
  }

  return data?.length || 0
}

// ── Raspar uma coleção completa ──────────────────────────
async function rasparColecao({ slug, clube }) {
  console.log(`\n⚽ ${clube || slug}`)

  let page = 1
  let totalColecao = 0

  while (true) {
    const produtos = await buscarPagina(slug, page)

    if (produtos.length === 0) break

    const convertidos = produtos.map(p => converterProduto(p, clube))
    const salvos = await salvarProdutos(convertidos)
    totalColecao += salvos

    console.log(`  ✅ Página ${page} — ${salvos} salvos (total: ${totalColecao})`)

    // Se veio menos que o limite, não tem próxima página
    if (produtos.length < LIMITE) break

    page++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log('🚀 Scraper — Brechó do Futebol\n')

  let totalGeral = 0

  for (const colecao of COLECOES) {
    const total = await rasparColecao(colecao)
    totalGeral += total
    await sleep(DELAY_MS)
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)
