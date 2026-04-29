/**
 * Scraper — Atrox Casual Club (Playwright)
 * Roda com: node scraper-atrox.js
 */

import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL   = 'https://www.atroxcasualclub.com'
const FONTE_NOME = 'Atrox Casual Club'
const FONTE_URL  = BASE_URL
const DELAY_MS   = 2000

const supabase = criarSupabase()

const COLECOES = [
  { slug: 'clubes/sulamericanos/brasileiros', clube: null },
]

function imagemValida(url) {
  if (!url) return false
  if (url.startsWith('data:')) return false
  if (url.includes('empty-placeholder')) return false
  return true
}

async function scrollarDevagar(page) {
  // Scrola em passos pequenos simulando usuário real
  const altura = await page.evaluate(() => document.body.scrollHeight)
  const passo = 300
  let posicao = 0

  while (posicao < altura) {
    posicao = Math.min(posicao + passo, altura)
    await page.evaluate(pos => window.scrollTo(0, pos), posicao)
    await sleep(100)
  }

  // Aguarda lazy loading terminar
  await sleep(2000)

  // Verifica se novos produtos carregaram e scrola mais se necessário
  const novaAltura = await page.evaluate(() => document.body.scrollHeight)
  if (novaAltura > altura) {
    let posicao2 = altura
    while (posicao2 < novaAltura) {
      posicao2 = Math.min(posicao2 + passo, novaAltura)
      await page.evaluate(pos => window.scrollTo(0, pos), posicao2)
      await sleep(100)
    }
    await sleep(1500)
  }
}

async function rasparPagina(page, slug, pagina) {
  const url = `${BASE_URL}/${slug}/?page=${pagina}`
  console.log(`  📄 Página ${pagina}: ${url}`)

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('.js-product-container', { timeout: 10000 }).catch(() => {})
    await sleep(500)

    // Scrola devagar para ativar lazy loading
    await scrollarDevagar(page)

    const total = await page.$$eval('.js-product-container', els => els.length)
    console.log(`     → ${total} containers encontrados`)

    const html = await page.content()
    const $ = cheerio.load(html)
    const produtos = []

    $('.js-product-container').each((_, el) => {
      const $el = $(el)

      const variantsRaw = $el.attr('data-variants')
      let preco = null
      let imagem = null

      if (variantsRaw) {
        try {
          const variants = JSON.parse(variantsRaw)
          if (variants.length > 0) {
            preco = variants[0].price_number || null
            const imgUrl = variants[0].image_url || ''
            if (imgUrl) imagem = `https:${imgUrl.replace('-1024-1024', '-480-0')}`
          }
        } catch {}
      }

      if (!imagemValida(imagem)) {
        const srcset = $el.find('img.js-item-image').attr('srcset') || ''
        const match = srcset.match(/([^\s,]+)\s+480w/)
        if (match) imagem = `https:${match[1]}`
      }

      const $link = $el.find('a[title]').first()
      const titulo = $el.find('.js-item-name').text().trim() || $link.attr('title') || ''
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

async function rasparColecao(browser, { slug, clube }) {
  console.log(`\n⚽ ${clube || slug}`)

  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  let pagina = 1
  let totalColecao = 0
  let paginasVazias = 0

  while (true) {
    const produtos = await rasparPagina(page, slug, pagina)

    if (produtos.length === 0) {
      paginasVazias++
      if (paginasVazias >= 2) break
    } else {
      paginasVazias = 0

      const convertidos = produtos.map(p => ({
        titulo: p.titulo,
        link_original: p.link,
        imagem_url: imagemValida(p.imagem) ? p.imagem : null,
        preco: p.preco,
        clube: clube || identificarClube(p.titulo),
        ano: extrairAno(p.titulo),
        fonte_nome: FONTE_NOME,
        fonte_url: FONTE_URL,
        tags: [],
        de_jogo: p.titulo.toLowerCase().includes('jogo'),
        novidade: false,
        alta_procura: false,
      }))

      const salvos = await salvarProdutos(supabase, convertidos)
      totalColecao += salvos
      console.log(`  ✅ ${salvos} salvos (total: ${totalColecao})`)
    }

    pagina++
    await sleep(DELAY_MS)
  }

  await page.close()
  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Atrox Casual Club (Playwright)\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)

  const browser = await chromium.launch({ headless: true })

  let totalGeral = 0

  try {
    for (const colecao of COLECOES) {
      totalGeral += await rasparColecao(browser, colecao)
      await sleep(DELAY_MS)
    }
  } finally {
    await browser.close()
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)