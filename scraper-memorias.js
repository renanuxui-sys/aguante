/**
 * Scraper — Memórias do Esporte Oficial
 * Roda com: node scraper-memorias.js
 * Dependências: npm install node-fetch cheerio @supabase/supabase-js dotenv
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// ── Config ──────────────────────────────────────────────
const BASE_URL   = 'https://memoriasdoesporteoficial.com.br/categoria-produto/futebol/brasil'
const FONTE_NOME = 'Memórias do Esporte'
const FONTE_URL  = 'https://memoriasdoesporteoficial.com.br'
const TOTAL_PAGINAS = 107
const DELAY_MS   = 1500  // pausa entre páginas para não sobrecarregar o servidor

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── Mapa de identificação de clubes ─────────────────────
const CLUBES_MAP = [
  { clube: 'Flamengo',      termos: ['flamengo'] },
  { clube: 'Corinthians',   termos: ['corinthians'] },
  { clube: 'Palmeiras',     termos: ['palmeiras'] },
  { clube: 'São Paulo',     termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Grêmio',        termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', termos: ['internacional', 'inter '] },
  { clube: 'Santos',        termos: ['santos'] },
  { clube: 'Atlético-MG',   termos: ['atlético-mg', 'atletico-mg', 'atlético mineiro', 'atletico mineiro', 'galo'] },
  { clube: 'Botafogo',      termos: ['botafogo'] },
  { clube: 'Fluminense',    termos: ['fluminense'] },
  { clube: 'Vasco',         termos: ['vasco'] },
  { clube: 'Cruzeiro',      termos: ['cruzeiro'] },
  { clube: 'Athletico-PR',  termos: ['athletico', 'atlético-pr', 'atletico-pr', 'furacão', 'furacao', 'paranaense'] },
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

function limparPreco(texto) {
  if (!texto) return null
  const match = texto.replace(/\./g, '').replace(',', '.').match(/[\d]+\.?\d*/)
  return match ? parseFloat(match[0]) : null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Scraping de uma página ───────────────────────────────
async function rasparPagina(pagina) {
  const url = pagina === 1
    ? `${BASE_URL}/`
    : `${BASE_URL}/page/${pagina}/`

  console.log(`  📄 Página ${pagina}/${TOTAL_PAGINAS}: ${url}`)

  let html
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) {
      console.warn(`  ⚠️  Página ${pagina} retornou status ${res.status}, pulando...`)
      return []
    }
    html = await res.text()
  } catch (err) {
    console.warn(`  ⚠️  Erro ao buscar página ${pagina}: ${err.message}`)
    return []
  }

  const $ = cheerio.load(html)
  const produtos = []

  $('ul.products li.product').each((_, el) => {
    const $el      = $(el)
    const titulo   = $el.find('h2').text().trim()
    const link     = $el.find('a.woocommerce-loop-product__link').attr('href') || ''
    const imagem   = $el.find('img').attr('src') || $el.find('img').attr('data-src') || null
    const precoTxt = $el.find('.price ins .amount, .price .amount').first().text().trim()

    if (!titulo || !link) return

    const produto = {
      titulo,
      link_original: link,
      imagem_url: imagem && imagem.startsWith('data:') ? null : imagem,
      preco: limparPreco(precoTxt),
      clube: identificarClube(titulo),
      ano: extrairAno(titulo),
      fonte_nome: FONTE_NOME,
      fonte_url: FONTE_URL,
      tags: [],
      de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('match'),
      novidade: false,
      alta_procura: false,
      ativo: true,
    }

    produtos.push(produto)
  })

  return produtos
}

// ── Salvar no Supabase ───────────────────────────────────
async function salvarProdutos(produtos) {
  if (produtos.length === 0) return 0

  // Upsert: se o link já existir, atualiza preço e imagem; não duplica
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

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando scraper — Memórias do Esporte')
  console.log(`   Total de páginas: ${TOTAL_PAGINAS}`)
  console.log(`   Delay entre páginas: ${DELAY_MS}ms\n`)

  let totalSalvos = 0
  let totalErros  = 0

  for (let pagina = 1; pagina <= TOTAL_PAGINAS; pagina++) {
    const produtos = await rasparPagina(pagina)

    if (produtos.length > 0) {
      const salvos = await salvarProdutos(produtos)
      totalSalvos += salvos
      console.log(`  ✅ ${salvos} produtos salvos (total: ${totalSalvos})`)
    } else {
      totalErros++
      if (totalErros >= 5) {
        console.log('\n⛔ Muitas páginas com erro. Encerrando.')
        break
      }
    }

    if (pagina < TOTAL_PAGINAS) await sleep(DELAY_MS)
  }

  // Atualizar total_produtos na tabela fontes
  await supabase
    .from('fontes')
    .update({ ultimo_scraping: new Date().toISOString(), total_produtos: totalSalvos })
    .eq('url', FONTE_URL)

  console.log(`\n✅ Scraping concluído! ${totalSalvos} produtos salvos no banco.`)
}

main().catch(console.error)
