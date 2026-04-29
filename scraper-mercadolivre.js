/**
 * Scraper — Mercado Livre
 * Busca camisas usadas de clubes brasileiros via API oficial
 * Roda com: node scraper-mercadolivre.js
 */

import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const FONTE_NOME = 'Mercado Livre'
const FONTE_URL  = 'https://www.mercadolivre.com.br'
const DELAY_MS   = 1000
const RESULTADOS_POR_PAGINA = 50
const MAX_PAGINAS_POR_CLUBE = 20 // até 1000 resultados por clube

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const CLUBES = [
  { clube: 'Flamengo',      query: 'camisa flamengo' },
  { clube: 'Corinthians',   query: 'camisa corinthians' },
  { clube: 'Palmeiras',     query: 'camisa palmeiras' },
  { clube: 'São Paulo',     query: 'camisa são paulo futebol' },
  { clube: 'Grêmio',        query: 'camisa grêmio' },
  { clube: 'Internacional', query: 'camisa internacional futebol' },
  { clube: 'Santos',        query: 'camisa santos futebol' },
  { clube: 'Atlético-MG',   query: 'camisa atlético mineiro' },
  { clube: 'Botafogo',      query: 'camisa botafogo' },
  { clube: 'Fluminense',    query: 'camisa fluminense' },
  { clube: 'Vasco',         query: 'camisa vasco' },
  { clube: 'Cruzeiro',      query: 'camisa cruzeiro' },
  { clube: 'Athletico-PR',  query: 'camisa athletico paranaense' },
  { clube: 'Fortaleza',     query: 'camisa fortaleza futebol' },
  { clube: 'Bahia',         query: 'camisa bahia futebol' },
  { clube: 'Vitória',       query: 'camisa vitória futebol' },
]

function extrairAno(titulo) {
  const match = titulo.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return match ? match[1] : null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Buscar token de acesso ───────────────────────────────
async function getAccessToken() {
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${process.env.ML_CLIENT_ID}&client_secret=${process.env.ML_CLIENT_SECRET}`
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Falha ao obter token: ' + JSON.stringify(data))
  console.log('🔑 Token obtido com sucesso\n')
  return data.access_token
}

// ── Buscar uma página de resultados ─────────────────────
async function buscarPagina(token, query, offset) {
  const params = new URLSearchParams({
    q: query,
    condition: 'used',
    category: 'MLB1276', // Camisetas de Futebol
    offset: offset.toString(),
    limit: RESULTADOS_POR_PAGINA.toString(),
  })

  const res = await fetch(`https://api.mercadolibre.com/sites/MLB/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    console.warn(`  ⚠️  Status ${res.status} para offset ${offset}`)
    return { results: [], total: 0 }
  }

  const data = await res.json()
  return {
    results: data.results || [],
    total: data.paging?.total || 0,
  }
}

// ── Converter item ML para formato do banco ──────────────
function converterItem(item, clube) {
  const titulo = item.title || ''
  const preco  = item.price || null
  const imagem = item.thumbnail
    ? item.thumbnail.replace('/I/', '/D/').replace('-I.', '-D.') // imagem maior
    : null
  const link   = item.permalink || ''

  return {
    titulo,
    link_original: link,
    imagem_url: imagem,
    preco,
    clube,
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: [],
    de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('match worn'),
    novidade: false,
    alta_procura: (item.sold_quantity || 0) > 5,
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

// ── Raspar um clube completo ─────────────────────────────
async function rasparClube(token, { clube, query }) {
  console.log(`\n⚽ ${clube} — query: "${query}"`)

  // Primeira busca para saber o total
  const primeira = await buscarPagina(token, query, 0)
  const total = Math.min(primeira.total, MAX_PAGINAS_POR_CLUBE * RESULTADOS_POR_PAGINA)
  const paginas = Math.ceil(total / RESULTADOS_POR_PAGINA)

  console.log(`   Total disponível: ${primeira.total} | Vamos buscar: ${total} (${paginas} páginas)`)

  let totalClube = 0

  // Salva primeira página
  if (primeira.results.length > 0) {
    const produtos = primeira.results.map(item => converterItem(item, clube))
    const salvos = await salvarProdutos(produtos)
    totalClube += salvos
    console.log(`  ✅ Página 1/${paginas} — ${salvos} salvos`)
  }

  // Demais páginas
  for (let pagina = 2; pagina <= paginas; pagina++) {
    await sleep(DELAY_MS)
    const offset = (pagina - 1) * RESULTADOS_POR_PAGINA
    const { results } = await buscarPagina(token, query, offset)

    if (results.length === 0) break

    const produtos = results.map(item => converterItem(item, clube))
    const salvos = await salvarProdutos(produtos)
    totalClube += salvos
    console.log(`  ✅ Página ${pagina}/${paginas} — ${salvos} salvos (total ${clube}: ${totalClube})`)
  }

  return totalClube
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log('🚀 Scraper — Mercado Livre\n')

  const token = await getAccessToken()
  let totalGeral = 0

  for (const fonte of CLUBES) {
    const total = await rasparClube(token, fonte)
    totalGeral += total
    console.log(`  ✅ ${fonte.clube} concluído: ${total} produtos`)
    await sleep(DELAY_MS * 2)
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)
