/**
 * Scraper — Fut Classics (Wix + Playwright)
 * Roda com: node scraper-futclassics.js
 */

import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, sleep } from './scraper-utils.js'
import 'dotenv/config'

const URL_BRASILEIROS = 'https://www.futclassics.com.br/clubes-brasileiros'
const FONTE_NOME      = 'Fut Classics'
const FONTE_URL       = 'https://www.futclassics.com.br'

const supabase = criarSupabase()

function extrairImagemWix(el, $) {
  const $el = $(el)
  const infoRaw = $el.find('wow-image').first().attr('data-image-info')
  if (infoRaw) {
    try {
      const uri = JSON.parse(infoRaw)?.imageData?.uri
      if (uri) return `https://static.wixstatic.com/media/${uri}/v1/fill/w_480,h_480,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${uri}`
    } catch {}
  }
  return $el.find('img').first().attr('src') || null
}

async function main() {
  console.log('🚀 Scraper — Fut Classics\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  console.log('🌐 Abrindo página...')
  await page.goto(URL_BRASILEIROS, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('[data-hook="product-list-grid-item"]', { timeout: 15000 })
  await sleep(2000)

  let cliques = 0
  while (true) {
    const botao = await page.$('[data-hook="load-more-button"]')
    if (!botao || !(await botao.isVisible())) break
    console.log(`  🔄 Clicando em "ver mais" (${++cliques}x)...`)
    await botao.click()
    await sleep(1000)
    await page.waitForLoadState('networkidle').catch(() => {})
    await sleep(500)
  }

  const totalCarregado = await page.$$eval('[data-hook="product-list-grid-item"]', els => els.length)
  console.log(`\n✅ ${totalCarregado} produtos carregados após ${cliques} cliques\n`)

  const html = await page.content()
  await browser.close()

  const $ = cheerio.load(html)
  const vistos = new Set()
  const produtos = []

  $('[data-hook="product-list-grid-item"]').each((_, el) => {
    const $el = $(el)

    // Ignora esgotados
    if ($el.find('[data-hook="product-item-out-of-stock"]').length > 0) return

    const titulo   = $el.find('[data-hook="product-item-name"]').text().trim()
    const link     = $el.find('[data-hook="product-item-container"]').attr('href') || ''
    const precoTxt = $el.find('[data-hook="product-item-price-to-pay"]').attr('data-wix-price') || ''
    const imagem   = extrairImagemWix(el, $)

    if (!titulo || !link) return

    const linkFull = link.startsWith('http') ? link : `${FONTE_URL}${link}`

    // Deduplica por link
    if (vistos.has(linkFull)) return
    vistos.add(linkFull)

    const preco = precoTxt
      ? parseFloat(precoTxt.replace(/[R$\s\u00a0]/g, '').replace('.', '').replace(',', '.'))
      : null

    produtos.push({
      titulo,
      link_original: linkFull,
      imagem_url: imagem,
      preco: isNaN(preco) ? null : preco,
      clube: identificarClube(titulo),
      ano: extrairAno(titulo),
      fonte_nome: FONTE_NOME,
      fonte_url: FONTE_URL,
      tags: [],
      de_jogo: titulo.toLowerCase().includes('de jogo') || titulo.toLowerCase().includes('match worn'),
      novidade: false,
      alta_procura: false,
    })
  })

  console.log(`📦 ${produtos.length} produtos únicos disponíveis`)

  // Salva em lotes de 100 para evitar conflitos
  let totalSalvos = 0
  for (let i = 0; i < produtos.length; i += 100) {
    const lote = produtos.slice(i, i + 100)
    const salvos = await salvarProdutos(supabase, lote)
    totalSalvos += salvos
    console.log(`  ✅ Lote ${Math.floor(i/100)+1}: ${salvos} salvos (total: ${totalSalvos})`)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalSalvos)
  console.log('\n🏁 Concluído!')
}

main().catch(console.error)