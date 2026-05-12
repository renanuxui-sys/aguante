/**
 * Scraper — Fut Classics (Wix + Playwright)
 * Roda com: node scraper-futclassics.js
 */

import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, carregarClubesMapPorCategoria, combinarClubesMap, sleep } from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME      = 'Fut Classics'
const FONTE_URL       = 'https://www.futclassics.com.br'
const MAX_CLIQUES_VER_MAIS = 80
const MAX_CLIQUES_SEM_NOVOS_PRODUTOS = 3
const TIMEOUT_PAGINA_MS = 8 * 60 * 1000

const supabase = criarSupabase()

const PAGINAS = [
  { url: 'https://www.futclassics.com.br/clubes-brasileiros', categorias: ['Clubes Brasileiros'] },
  { url: 'https://www.futclassics.com.br/clubes-argentinos', categorias: ['Clubes Sulamericanos'] },
  { url: 'https://www.futclassics.com.br/outros-clubes-america', categorias: ['Clubes Sulamericanos'] },
  { url: 'https://www.futclassics.com.br/clubes-alemaes-camisas-futebol', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/clubes-espanhois-camisas-futebol', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/clubes-franceses-camisas-futebol', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/clubes-ingleses-camisas-futebol', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/clubes-italianos-camisas-futebol', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/clubes-escoceses-camisas-futebol', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/outros-clubes-da-europa', categorias: ['Clubes Europeus'] },
  { url: 'https://www.futclassics.com.br/selecoes-camisas-futebol', categorias: ['Seleções'] },
]

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

async function contarProdutos(page) {
  return page.$$eval('[data-hook="product-list-grid-item"]', els => els.length).catch(() => 0)
}

async function carregarTodosProdutos(page) {
  const inicio = Date.now()
  let cliques = 0
  let cliquesSemNovosProdutos = 0
  let totalAnterior = await contarProdutos(page)

  while (true) {
    if (Date.now() - inicio > TIMEOUT_PAGINA_MS) {
      console.warn(`  ⚠️  Tempo limite por página atingido após ${cliques} cliques. Seguindo com ${totalAnterior} produtos carregados.`)
      break
    }

    if (cliques >= MAX_CLIQUES_VER_MAIS) {
      console.warn(`  ⚠️  Limite de ${MAX_CLIQUES_VER_MAIS} cliques em "ver mais" atingido. Seguindo com ${totalAnterior} produtos carregados.`)
      break
    }

    const botao = await page.$('[data-hook="load-more-button"]')
    if (!botao || !(await botao.isVisible().catch(() => false))) break

    console.log(`  🔄 Clicando em "ver mais" (${++cliques}x)...`)

    await Promise.all([
      botao.click({ timeout: 10000 }).catch(err => {
        console.warn(`  ⚠️  Clique em "ver mais" falhou: ${err.message}`)
      }),
      page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}),
    ])

    await sleep(800)

    const totalAtual = await contarProdutos(page)
    if (totalAtual <= totalAnterior) {
      cliquesSemNovosProdutos++
      console.warn(`  ⚠️  Nenhum produto novo após o clique (${cliquesSemNovosProdutos}/${MAX_CLIQUES_SEM_NOVOS_PRODUTOS}).`)
      if (cliquesSemNovosProdutos >= MAX_CLIQUES_SEM_NOVOS_PRODUTOS) break
    } else {
      cliquesSemNovosProdutos = 0
      totalAnterior = totalAtual
    }
  }

  return { cliques, totalCarregado: await contarProdutos(page) }
}

async function main() {
  console.log('🚀 Scraper — Fut Classics\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setDefaultTimeout(15000)
  page.setDefaultNavigationTimeout(45000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/*', route => {
    const tipo = route.request().resourceType()
    if (['image', 'media', 'font'].includes(tipo)) return route.abort()
    return route.continue()
  })

  const vistos = new Set()
  const produtos = []

  try {
    for (const { url, categorias } of PAGINAS) {
      const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))
      console.log(`🌐 Abrindo página: ${url}`)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      const encontrouGrid = await page.waitForSelector('[data-hook="product-list-grid-item"]', { timeout: 15000 }).then(() => true).catch(() => false)
      if (!encontrouGrid) {
        console.warn('  ⚠️  Nenhum grid de produtos encontrado.')
        continue
      }
      await sleep(1500)

      const { cliques, totalCarregado } = await carregarTodosProdutos(page)
      console.log(`  ✅ ${totalCarregado} produtos carregados após ${cliques} cliques`)

      const html = await page.content()
      const $ = cheerio.load(html)

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
          clube: identificarClube(titulo, clubesMap),
          ano: extrairAno(titulo),
          fonte_nome: FONTE_NOME,
          fonte_url: FONTE_URL,
          tags: [],
          de_jogo: titulo.toLowerCase().includes('de jogo') || titulo.toLowerCase().includes('match worn'),
          novidade: false,
          alta_procura: false,
        })
      })
    }
  } finally {
    await browser.close()
  }

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
