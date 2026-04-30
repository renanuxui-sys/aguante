/**
 * Scraper — Mundo da Bola Loja
 * Roda com: node scraper-mundodabola.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL   = 'https://www.mundodabolaloja.com.br'
const FONTE_NOME = 'Mundo da Bola'
const FONTE_URL  = BASE_URL
const DELAY_MS   = 1500

const supabase = criarSupabase()

const COLECOES = [
  { slug: 'futebol-nacional/cariocas' },
  { slug: 'futebol-nacional/baianos' },
  { slug: 'camisas-de-futebol/gauchos' },
  { slug: 'futebol-nacional/catarinenses' },
  { slug: 'futebol-nacional/cearenses' },
  { slug: 'futebol-nacional/goianos' },
  { slug: 'futebol-nacional/mineiros' },
  { slug: 'futebol-nacional/mato-grossense' },
  { slug: 'futebol-nacional/paranaenses' },
  { slug: 'futebol-nacional/paulistas' },
  { slug: 'futebol-nacional/pernambucanos' },
]

async function rasparPagina(slug, page) {
  const url = `${BASE_URL}/${slug}/?page=${page}`
  console.log(`  📄 Página ${page}`)

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

    $('div.product').each((_, el) => {
      const $el    = $(el)
      const titulo = $el.attr('data-ga4-name') || ''
      const preco  = parseFloat($el.attr('data-ga4-price') || '0') || null
      const link   = $el.find('a.space-image').attr('href') || ''
      const imagem = $el.find('img.lazyload').attr('src') || null

      if (!titulo || !link) return

      // Só salva se identificar clube brasileiro
      const clube = identificarClube(titulo)
      if (!clube) return

      produtos.push({
        titulo,
        link_original: link.startsWith('http') ? link : `${BASE_URL}${link}`,
        imagem_url: imagem,
        preco,
        clube,
        ano: extrairAno(titulo),
        fonte_nome: FONTE_NOME,
        fonte_url: FONTE_URL,
        tags: [],
        de_jogo: titulo.toLowerCase().includes('jogo'),
        novidade: false,
        alta_procura: false,
      })
    })

    return produtos
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparColecao({ slug }) {
  console.log(`\n⚽ ${slug}`)

  let page = 1
  let totalColecao = 0
  let paginasVazias = 0

  while (true) {
    const produtos = await rasparPagina(slug, page)

    if (produtos.length === 0) {
      paginasVazias++
      if (paginasVazias >= 2) break
    } else {
      paginasVazias = 0
      const salvos = await salvarProdutos(supabase, produtos)
      totalColecao += salvos
      console.log(`  ✅ ${salvos} salvos (total: ${totalColecao})`)
    }

    page++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Mundo da Bola\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao)
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)