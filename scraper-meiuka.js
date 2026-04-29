/**
 * Scraper — Meiuka (API Supabase pública)
 * Roda com: node scraper-meiuka.js
 */

import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const FONTE_NOME = 'Meiuka'
const FONTE_URL  = 'https://www.meiukabr.com'
const DELAY_MS   = 800
const LIMITE     = 50

const MEIUKA_URL    = 'https://uhpdwmkqmzbobiuscinm.supabase.co'
const MEIUKA_APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocGR3bWtxbXpib2JpdXNjaW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTQ4MjgsImV4cCI6MjA3NTk3MDgyOH0._nu4px9HG79zwAdt3YhlVkrRDEBjyxint1IT7_IuvGQ'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const CLUBES = [
  { clube: 'Flamengo',      query: 'flamengo' },
  { clube: 'Corinthians',   query: 'corinthians' },
  { clube: 'Palmeiras',     query: 'palmeiras' },
  { clube: 'São Paulo',     query: 'sao paulo' },
  { clube: 'Grêmio',        query: 'gremio' },
  { clube: 'Internacional', query: 'internacional' },
  { clube: 'Santos',        query: 'santos' },
  { clube: 'Atlético-MG',   query: 'atletico mineiro' },
  { clube: 'Botafogo',      query: 'botafogo' },
  { clube: 'Fluminense',    query: 'fluminense' },
  { clube: 'Vasco',         query: 'vasco' },
  { clube: 'Cruzeiro',      query: 'cruzeiro' },
  { clube: 'Athletico-PR',  query: 'athletico paranaense' },
  { clube: 'Fortaleza',     query: 'fortaleza' },
  { clube: 'Bahia',         query: 'bahia' },
  { clube: 'Vitória',       query: 'vitoria' },
]

function extrairAno(texto) {
  if (!texto) return null
  const match = texto.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return match ? match[1] : null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function buscarPagina(query, offset) {
  const q = encodeURIComponent(query)
  const url = `${MEIUKA_URL}/rest/v1/shirts?select=*&status=eq.a_venda&or=%28club.ilike.%25${q}%25%2Ccountry.ilike.%25${q}%25%2Cname.ilike.%25${q}%25%2Cseason.ilike.%25${q}%25%2Ctags.cs.%7B${q}%7D%29&limit=${LIMITE}&offset=${offset}`

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': MEIUKA_APIKEY,
        'Authorization': `Bearer ${MEIUKA_APIKEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })

    if (!res.ok) {
      console.warn(`  ⚠️  Status ${res.status}`)
      return []
    }

    return await res.json()
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

function converterItem(item, clube) {
  const titulo = [item.name, item.club, item.season].filter(Boolean).join(' — ')
  const link   = `${FONTE_URL}/shirt/${item.id}`
  const imagem = item.front_image_url || item.back_image_url || null
  const preco  = item.min_price ? parseFloat(item.min_price) : null
  const ano    = extrairAno(item.season) || extrairAno(item.name)

  return {
    titulo,
    link_original: link,
    imagem_url: imagem,
    preco,
    clube,
    ano,
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: item.tags || [],
    de_jogo: (item.model_type || '').includes('jogo'),
    novidade: false,
    alta_procura: false,
    ativo: true,
  }
}

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

async function rasparClube({ clube, query }) {
  console.log(`\n⚽ ${clube} — query: "${query}"`)

  let offset = 0
  let totalClube = 0
  let pagina = 1

  while (true) {
    const items = await buscarPagina(query, offset)

    if (items.length === 0) break

    const produtos = items.map(item => converterItem(item, clube))

    // Log de debug — mostra imagem do primeiro item
    if (pagina === 1 && produtos.length > 0) {
      console.log(`  🖼️  Exemplo imagem: ${produtos[0].imagem_url}`)
    }

    const salvos = await salvarProdutos(produtos)
    totalClube += salvos
    console.log(`  ✅ Página ${pagina} — ${salvos} salvos (total: ${totalClube})`)

    if (items.length < LIMITE) break

    offset += LIMITE
    pagina++
    await sleep(DELAY_MS)
  }

  return totalClube
}

async function main() {
  console.log('🚀 Scraper — Meiuka\n')

  let totalGeral = 0

  for (const fonte of CLUBES) {
    const total = await rasparClube(fonte)
    totalGeral += total
    await sleep(DELAY_MS)
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)