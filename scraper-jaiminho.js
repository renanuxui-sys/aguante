/**
 * Scraper — Jaiminho Camisas (Nuvemshop)
 * Roda com: node scraper-jaiminho.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const BASE_URL   = 'https://jaiminhocamisas.lojavirtualnuvem.com.br'
const FONTE_NOME = 'Jaiminho Camisas'
const FONTE_URL  = BASE_URL
const DELAY_MS   = 1500

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const COLECOES = [
  { slug: 'internacional',     clube: 'Internacional' },
  { slug: 'gremio',            clube: 'Grêmio' },
  { slug: 'flamengo',          clube: 'Flamengo' },
  { slug: 'botafogo',          clube: 'Botafogo' },
  { slug: 'fluminense',        clube: 'Fluminense' },
  { slug: 'vasco',             clube: 'Vasco' },
  { slug: 'corinthians',       clube: 'Corinthians' },
  { slug: 'palmeiras',         clube: 'Palmeiras' },
  { slug: 'santos',            clube: 'Santos' },
  { slug: 'sao-paulo',         clube: 'São Paulo' },
  { slug: 'atletico-mg',       clube: 'Atlético-MG' },
  { slug: 'cruzeiro',          clube: 'Cruzeiro' },
  { slug: 'atletico-pr',       clube: 'Athletico-PR' },
  { slug: 'fortaleza',         clube: 'Fortaleza' },
  { slug: 'bahia',             clube: 'Bahia' },
  { slug: 'vitoria',           clube: 'Vitória' },
  { slug: 'chapecoense',       clube: null },
  { slug: 'avai',              clube: null },
  { slug: 'criciuma',          clube: null },
  { slug: 'coritiba',          clube: null },
  { slug: 'america-mg',        clube: null },
  { slug: 'goias',             clube: null },
  { slug: 'atletico-go',       clube: null },
  { slug: 'nautico',           clube: null },
  { slug: 'santa-cruz',        clube: null },
  { slug: 'sport',             clube: null },
  { slug: 'ceara',             clube: null },
  { slug: 'selecoes',          clube: null },
  { slug: 'times-gauchos-interior', clube: null },
  { slug: 'times-argentinos',  clube: null },
  { slug: 'times-aleatorios',  clube: null },
]

const CLUBES_MAP = [
  { clube: 'Flamengo',      termos: ['flamengo'] },
  { clube: 'Corinthians',   termos: ['corinthians'] },
  { clube: 'Palmeiras',     termos: ['palmeiras'] },
  { clube: 'São Paulo',     termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Grêmio',        termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', termos: ['internacional'] },
  { clube: 'Santos',        termos: ['santos'] },
  { clube: 'Atlético-MG',   termos: ['atlético mineiro', 'atletico mineiro', 'atlético-mg', 'atletico mg'] },
  { clube: 'Botafogo',      termos: ['botafogo'] },
  { clube: 'Fluminense',    termos: ['fluminense'] },
  { clube: 'Vasco',         termos: ['vasco'] },
  { clube: 'Cruzeiro',      termos: ['cruzeiro'] },
  { clube: 'Athletico-PR',  termos: ['athletico', 'atletico pr', 'paranaense'] },
  { clube: 'Fortaleza',     termos: ['fortaleza'] },
  { clube: 'Bahia',         termos: ['bahia'] },
  { clube: 'Vitória',       termos: ['vitória', 'vitoria'] },
]

function identificarClube(titulo) {
  const lower = titulo.toLowerCase()
  for (const { clube, termos } of CLUBES_MAP) {
    if (termos.some(t => lower.includes(t))) return clube
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

async function rasparPagina(slug, page) {
  const url = `${BASE_URL}/${slug}/?page=${page}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) {
      console.warn(`  ⚠️  Status ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const produtos = []

    $('.js-product-container').each((_, el) => {
      const $el = $(el)

      // Dados principais via data-variants (JSON embutido)
      const variantsRaw = $el.attr('data-variants')
      let preco = null
      let imagem = null

      if (variantsRaw) {
        try {
          const variants = JSON.parse(variantsRaw)
          if (variants.length > 0) {
            preco = variants[0].price_number || null
            const imgUrl = variants[0].image_url || ''
            imagem = imgUrl ? `https:${imgUrl.replace('-1024-1024', '-480-0')}` : null
          }
        } catch {}
      }

      // Título e link
      const $link = $el.find('a.item-link').first()
      const titulo = $link.attr('title') || $el.find('.js-item-name').text().trim()
      const link   = $link.attr('href') || ''

      if (!titulo || !link) return

      produtos.push({ titulo, link, preco, imagem })
    })

    return produtos
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function salvarProdutos(produtos, clubeFixo) {
  if (produtos.length === 0) return 0

  const convertidos = produtos.map(p => ({
    titulo: p.titulo,
    link_original: p.link,
    imagem_url: p.imagem,
    preco: p.preco,
    clube: clubeFixo || identificarClube(p.titulo),
    ano: extrairAno(p.titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: [],
    de_jogo: p.titulo.toLowerCase().includes('jogo'),
    novidade: false,
    alta_procura: false,
    ativo: true,
  }))

  const { data, error } = await supabase
    .from('produtos')
    .upsert(convertidos, { onConflict: 'link_original', ignoreDuplicates: false })
    .select('id')

  if (error) {
    console.error('  ❌ Erro ao salvar:', error.message)
    return 0
  }

  return data?.length || 0
}

async function rasparColecao({ slug, clube }) {
  console.log(`\n⚽ ${clube || slug}`)

  let page = 1
  let totalColecao = 0
  let semResultados = 0

  while (true) {
    const produtos = await rasparPagina(slug, page)

    if (produtos.length === 0) {
      semResultados++
      if (semResultados >= 2) break
    } else {
      semResultados = 0
      const salvos = await salvarProdutos(produtos, clube)
      totalColecao += salvos
      console.log(`  ✅ Página ${page} — ${salvos} salvos (total: ${totalColecao})`)
    }

    page++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Jaiminho Camisas\n')

  let totalGeral = 0

  for (const colecao of COLECOES) {
    const total = await rasparColecao(colecao)
    totalGeral += total
    await sleep(DELAY_MS)
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)
