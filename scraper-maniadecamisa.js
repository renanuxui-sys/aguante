/**
 * Scraper — Mania de Camisa
 * Roda com: node scraper-maniadecamisa.js
 * Teste sem salvar: node scraper-maniadecamisa.js --dry-run
 */

import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import {
  criarSupabase,
  desativarProdutosDaFonte,
  salvarProdutos,
  relatorioFinal,
  extrairAno,
  identificarClube,
  carregarClubesMapPorCategoria,
  combinarClubesMap,
  sleep,
} from './scraper-utils.js'
import { abrirChromium } from './scraper-playwright-utils.js'
import 'dotenv/config'

const BASE_URL = 'https://www.maniadecamisafut.com.br'
const FONTE_NOME = 'Mania de Camisa'
const FONTE_URL = BASE_URL
const DELAY_MS = 1500
const MAX_PAGINAS_VAZIAS = 2

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')

const COLECOES = [
  { path: '/nacionais', nome: 'Nacionais', categorias: ['Clubes Brasileiros'] },
  { path: '/clubes-europeus', nome: 'Clubes Europeus', categorias: ['Clubes Europeus'], somenteIdentificados: true },
  { path: '/sul-americanos', nome: 'Sul-americanos', categorias: ['Clubes Sulamericanos'], somenteIdentificados: true },
  { path: '/selecoes', nome: 'Seleções', categorias: ['Seleções'] },
]

function urlDaPagina(path, page) {
  const url = new URL(path, BASE_URL)
  url.searchParams.set('page', String(page))
  return url.toString()
}

function normalizarImagem(url) {
  if (!url || url.startsWith('data:')) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return new URL(url, BASE_URL).toString()
  return url
}

function limparTexto(texto) {
  return (texto || '').replace(/\s+/g, ' ').trim()
}

function textoNormalizado(texto) {
  return limparTexto(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function extrairPrecoTexto(texto) {
  if (!texto) return null
  const match = limparTexto(texto).match(/R\$\s*([\d.]+,\d{2})/)
  if (!match) return null
  const valor = Number(match[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(valor) ? valor : null
}

function textoIndicaEsgotado(texto) {
  return /\b(esgotado|sem estoque|fora de estoque|indisponivel|sold out|out of stock)\b/.test(textoNormalizado(texto))
}

function produtoDisponivelJsonLd(produto) {
  const availability = produto?.offers?.availability || ''
  return !availability || availability.toLowerCase().includes('instock')
}

function extrairProdutoJsonLd(raw) {
  if (!raw) return null

  try {
    const data = JSON.parse(raw)
    const items = Array.isArray(data) ? data : [data]
    const produto = items.find(item => item?.['@type'] === 'Product')
    if (!produto || !produtoDisponivelJsonLd(produto)) return null

    const titulo = limparTexto(produto.name)
    const link = produto.offers?.url || produto.url || produto.mainEntityOfPage?.['@id'] || ''
    const preco = produto.offers?.price ? parseFloat(produto.offers.price) : null

    if (!titulo || !link) return null

    return {
      titulo,
      link: new URL(link, BASE_URL).toString(),
      imagem: normalizarImagem(Array.isArray(produto.image) ? produto.image[0] : produto.image || null),
      preco: Number.isFinite(preco) ? preco : null,
    }
  } catch {
    return null
  }
}

function urlEhProduto(url) {
  try {
    const parsed = new URL(url, BASE_URL)
    if (parsed.origin !== BASE_URL) return false

    const path = parsed.pathname.replace(/\/+$/, '')
    if (!path || path === '') return false
    if (/\/(nacionais|clubes-europeus|sul-americanos|selecoes|carrinho|login|conta|checkout)$/i.test(path)) return false
    if (/\.(jpg|jpeg|png|webp|gif|svg|css|js)$/i.test(path)) return false

    return true
  } catch {
    return false
  }
}

function maiorSrcSet(srcset) {
  if (!srcset) return null

  return srcset
    .split(',')
    .map(item => {
      const [url, size] = item.trim().split(/\s+/)
      return { url, size: parseInt(size, 10) || 0 }
    })
    .filter(item => item.url)
    .sort((a, b) => b.size - a.size)[0]?.url || null
}

function primeiraImagem($el) {
  const img = $el.find('img').first()
  return normalizarImagem(
    maiorSrcSet(img.attr('srcset') || img.attr('data-srcset')) ||
    img.attr('data-src') ||
    img.attr('data-original') ||
    img.attr('src') ||
    null
  )
}

function tituloDoLink($link) {
  const imgAlt = limparTexto($link.find('img').first().attr('alt'))
  const titulo = limparTexto($link.attr('title') || $link.attr('aria-label') || imgAlt || $link.text())

  return titulo
    .replace(/R\$\s*[\d.]+,\d{2}.*/g, '')
    .replace(/\b(comprar|ver produto|produto)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function encontrarCard($, linkEl) {
  let $card = $(linkEl)

  for (let i = 0; i < 8; i++) {
    const texto = $card.text()
    if (extrairPrecoTexto(texto) && ($card.find('img').length > 0 || primeiraImagem($card))) return $card

    const parent = $card.parent()
    if (!parent.length || parent.is('body')) break
    $card = parent
  }

  return $(linkEl)
}

function extrairProdutoPorLink($, el) {
  const $link = $(el)
  const href = $link.attr('href') || ''
  if (!urlEhProduto(href)) return null

  const $card = encontrarCard($, el)
  const textoCard = limparTexto($card.text())
  if (textoIndicaEsgotado(textoCard) || textoIndicaEsgotado($card.attr('class'))) return null

  const titulo = tituloDoLink($link)
  const preco = extrairPrecoTexto(textoCard)
  if (!titulo || !preco) return null

  return {
    titulo,
    link: new URL(href, BASE_URL).toString().split('#')[0],
    imagem: primeiraImagem($card) || primeiraImagem($link),
    preco,
  }
}

function extrairProdutos($) {
  const porLink = new Map()

  $('script[type="application/ld+json"]').each((_, el) => {
    const produto = extrairProdutoJsonLd($(el).html())
    if (produto?.link) porLink.set(produto.link, produto)
  })

  $('a[href]').each((_, el) => {
    const produto = extrairProdutoPorLink($, el)
    if (produto?.link && !porLink.has(produto.link)) porLink.set(produto.link, produto)
  })

  return Array.from(porLink.values())
}

async function scrollarAteProdutos(page) {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.8)))
    await sleep(500)
  }
}

async function rasparPagina(page, path, numeroPagina) {
  const url = urlDaPagina(path, numeroPagina)
  console.log(`  📄 Página ${numeroPagina}: ${url}`)

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await scrollarAteProdutos(page)

    const html = await page.content()
    return extrairProdutos(cheerio.load(html))
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparColecao(page, { path, nome, categorias, somenteIdentificados = false }, clubesPorCategoria, vistosGlobais) {
  console.log(`\n⚽ ${nome}`)
  const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))

  let paginaAtual = 1
  let totalColecao = 0
  let paginasVazias = 0

  while (true) {
    const produtos = await rasparPagina(page, path, paginaAtual)
    const novos = produtos.filter(produto => {
      if (vistosGlobais.has(produto.link)) return false
      vistosGlobais.add(produto.link)
      return true
    })

    if (novos.length === 0) {
      paginasVazias++
      if (paginasVazias >= MAX_PAGINAS_VAZIAS) break
    } else {
      paginasVazias = 0

      const convertidos = novos
        .map(p => ({
          titulo: p.titulo,
          link_original: p.link,
          imagem_url: p.imagem,
          preco: p.preco,
          clube: identificarClube(p.titulo, clubesMap),
          ano: extrairAno(p.titulo),
          fonte_nome: FONTE_NOME,
          fonte_url: FONTE_URL,
          tags: [],
          de_jogo: p.titulo.toLowerCase().includes('de jogo') || p.titulo.toLowerCase().includes('match worn'),
          novidade: false,
          alta_procura: false,
        }))
        .filter(produto => !somenteIdentificados || produto.clube)

      const salvos = dryRun ? convertidos.length : await salvarProdutos(supabase, convertidos)
      totalColecao += salvos
      console.log(`  ✅ ${dryRun ? 'Encontrados' : 'Salvos'}: ${salvos} (total ${nome}: ${totalColecao})`)
      if (dryRun) convertidos.slice(0, 3).forEach(p => console.log(`     · [${p.clube || '?'}] ${p.titulo} — R$${p.preco}`))
    }

    paginaAtual++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log(`🚀 Scraper — Mania de Camisa${dryRun ? ' (dry-run)' : ''}\n`)

  if (!dryRun && !semDesativar) await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)

  let totalGeral = 0
  const vistosGlobais = new Set()
  const browser = await abrirChromium(chromium)
  const context = await browser.newContext({
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  try {
    page.setDefaultTimeout(15000)
    page.setDefaultNavigationTimeout(45000)
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    })

    await page.route('**/*', route => {
      const tipo = route.request().resourceType()
      if (['image', 'media', 'font'].includes(tipo)) return route.abort()
      return route.continue()
    })

    for (const colecao of COLECOES) {
      totalGeral += await rasparColecao(page, colecao, clubesPorCategoria, vistosGlobais)
      await sleep(DELAY_MS)
    }
  } finally {
    await browser.close()
  }

  if (!dryRun) await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${dryRun ? 'encontrados' : 'salvos'}.`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
