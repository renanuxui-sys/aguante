/**
 * Scraper experimental — Mercado Livre via GeckoAPI
 *
 * Teste sem salvar:
 *   node scraper-gecko-mercadolivre.js --clubes=flamengo --max-paginas=1 --debug
 *
 * Salvar no Supabase:
 *   node scraper-gecko-mercadolivre.js --clubes=flamengo --max-paginas=1 --salvar --sem-desativar
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { writeFile } from 'node:fs/promises'
import {
  criarSupabase,
  desativarProdutosDaFonte,
  salvarProdutos,
  relatorioFinal,
  extrairAno,
  carregarClubesBusca,
  identificarClube,
  normalizarTexto,
  sleep,
} from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Mercado Livre'
const FONTE_URL = 'https://www.mercadolivre.com.br'
const BUSCA_URL = 'https://lista.mercadolivre.com.br'
const GECKO_API_URL = 'https://api.geckoapi.com.br/v1/extract'
const MAX_PAGINAS_PADRAO = 3
const MAX_PAGINAS_LIMITE = 3
const DELAY_MS = 1200
const RETRIES_PADRAO = 2
const SELECTOR_CARDS_HTML = '.poly-card, .ui-search-result, .andes-card.poly-card, li.ui-search-layout__item'

const supabase = criarSupabase()

function parseArgs() {
  const args = process.argv.slice(2)
  const valorArg = nome => args.find(arg => arg.startsWith(`--${nome}=`))?.replace(`--${nome}=`, '')
  const clubesSelecionados = (valorArg('clubes') || '')
    .split(',')
    .map(normalizarTexto)
    .filter(Boolean)

  return {
    url: valorArg('url') || null,
    query: valorArg('query') || null,
    clubesSelecionados,
    maxPaginas: Math.min(
      MAX_PAGINAS_LIMITE,
      Math.max(1, Number(valorArg('max-paginas') || MAX_PAGINAS_PADRAO) || MAX_PAGINAS_PADRAO)
    ),
    salvar: args.includes('--salvar'),
    semDesativar: args.includes('--sem-desativar'),
    htmlListing: args.includes('--html-listing'),
    browserListing: args.includes('--browser-listing'),
    filtrarCamisas: !args.includes('--sem-filtro-camisa'),
    filtrarUsados: !args.includes('--sem-filtro-usados'),
    comPdp: !args.includes('--html-listing') && !args.includes('--browser-listing') && (args.includes('--com-pdp') || args.includes('--salvar')),
    maxPdp: valorArg('max-pdp') ? Math.max(1, Number(valorArg('max-pdp')) || 1) : null,
    debug: args.includes('--debug'),
    retries: Math.max(0, Number(valorArg('retries') || RETRIES_PADRAO) || RETRIES_PADRAO),
  }
}

function primeiroValor(...valores) {
  return valores.find(valor => valor !== undefined && valor !== null && valor !== '')
}

function parsePreco(valor) {
  if (typeof valor === 'number') return valor
  if (!valor) return null

  const preco = Number(String(valor)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.'))

  return Number.isFinite(preco) ? preco : null
}

function primeiraImagem(item) {
  const imagens = primeiroValor(item.images, item.pictures, item.photos, item.media, item.gallery)
  if (Array.isArray(imagens)) {
    const primeira = imagens.find(Boolean)
    if (typeof primeira === 'string') return primeira
    return primeiroValor(primeira?.url, primeira?.secureUrl, primeira?.src, primeira?.imageUrl, primeira?.thumbnail)
  }

  if (imagens && typeof imagens === 'object') {
    return primeiroValor(imagens.url, imagens.secureUrl, imagens.src, imagens.imageUrl, imagens.thumbnail)
  }

  return primeiroValor(item.imageUrl, item.image, item.thumbnail, item.picture, item.photo, null)
}

function tituloDoItem(item) {
  return primeiroValor(item.name, item.title, item.titulo, '')
}

function limparUrlProduto(url) {
  if (!url) return ''

  try {
    const parsed = new URL(url, FONTE_URL)
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return String(url).split('#')[0]
  }
}

function linkDoItem(item) {
  return limparUrlProduto(primeiroValor(item.url, item.link, item.permalink, item.canonicalUrl, ''))
}

function precoDoItem(item) {
  return parsePreco(primeiroValor(item.price, item.priceValue, item.prices?.mainValue, item.value))
}

function slugBusca(query) {
  return normalizarTexto(query)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function montarUrlHtml(busca, page) {
  if (busca.url) {
    const url = new URL(busca.url)
    if (page > 1 && !url.pathname.includes('_Desde_')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}_Desde_${((page - 1) * 48) + 1}`
    }
    return url.toString()
  }

  const desde = page > 1 ? `_Desde_${((page - 1) * 48) + 1}` : ''
  return `${BUSCA_URL}/${slugBusca(busca.query)}${desde}`
}

async function buscarHtml(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    timeout: 20000,
  })
  if (!res.ok) throw new Error(`Status ${res.status}`)
  return res.text()
}

async function buscarHtmlRenderizado(url) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 900 },
      locale: 'pt-BR',
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    const temIntermediaria = await page.locator('#continue-button, .micro-landing-container').count()
    if (temIntermediaria > 0) {
      console.log('  Validando tela intermediária do Mercado Livre...')
      await context.addCookies([{
        name: '_bm_skipml',
        value: 'true',
        domain: '.mercadolivre.com.br',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 300,
      }])
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    }
    await page.waitForSelector(SELECTOR_CARDS_HTML, { timeout: 30000 }).catch(() => {})
    const html = await page.content()
    if (/suspicious-traffic|account-verification|negative_traffic|Olá! Para continuar, acesse/.test(html)) {
      const path = '/tmp/mercadolivre-listing-debug.html'
      await writeFile(path, html.slice(0, 500000))
      throw new Error(`Mercado Livre classificou o browser como tráfego suspeito. Diagnóstico salvo em ${path}`)
    }
    if (!html.match(/poly-card|ui-search-result|ui-search-layout__item/)) {
      const path = '/tmp/mercadolivre-listing-debug.html'
      await writeFile(path, html.slice(0, 500000))
      console.warn(`  ⚠️  Nenhum card renderizado encontrado. HTML salvo para diagnóstico: ${path}`)
    }
    return html
  } finally {
    await browser.close()
  }
}

function maiorImagemSrcset(srcset) {
  if (!srcset) return null
  const candidatos = srcset
    .split(',')
    .map(item => {
      const [url, largura] = item.trim().split(/\s+/)
      return { url, largura: Number((largura || '').replace(/\D/g, '')) || 0 }
    })
    .filter(item => item.url)
    .sort((a, b) => b.largura - a.largura)

  return candidatos[0]?.url || null
}

function extrairPrecoCard($, $card) {
  const aria = $card.find('.andes-money-amount[aria-label]').first().attr('aria-label')
  const precoAria = parsePreco(aria
    ?.replace(/\s*reais?\s*/i, ',')
    .replace(/\s*com\s*/i, '')
    .replace(/\s*centavos?.*/i, ''))
  if (precoAria !== null) return precoAria

  const fracao = $card.find('.andes-money-amount__fraction').first().text().trim()
  const centavos = $card.find('.andes-money-amount__cents').first().text().trim()
  if (!fracao) return null

  return parsePreco(`${fracao}${centavos ? `,${centavos}` : ''}`)
}

function extrairCardsHtml(html) {
  const $ = cheerio.load(html)
  const produtos = []
  const vistos = new Set()

  $(SELECTOR_CARDS_HTML).each((_, el) => {
    const $card = $(el)
    const $link = $card.find('a.poly-component__title, a.poly-component__link, a[href*="mercadolivre.com"]').first()
    const titulo = $card.find('.poly-component__title').first().text().trim() || $link.text().trim() || $link.attr('title') || ''
    const link = limparUrlProduto($link.attr('href') || '')
    const $img = $card.find('img.poly-component__picture, img[data-testid="picture"], img').first()
    const imagem = primeiroValor(
      $img.attr('src'),
      maiorImagemSrcset($img.attr('srcset')),
      $img.attr('data-src')
    )
    const condicao = $card.find('.poly-component__item-condition').first().text().trim()
    const preco = extrairPrecoCard($, $card)
    const chave = link || `${normalizarTexto(titulo)}|${preco}|${imagem}`

    if (!titulo || !link) return
    if (vistos.has(chave)) return

    vistos.add(chave)

    produtos.push({
      name: titulo,
      title: titulo,
      url: link,
      image: imagem,
      price: preco,
      condition: condicao,
    })
  })

  return produtos
}

function itemDisponivel(item) {
  const disponibilidade = normalizarTexto(primeiroValor(item.availability, item.stockStatus, ''))
  const estoque = primeiroValor(item.stockQuantity, item.stock)
  if (disponibilidade && /\b(outofstock|out of stock|indisponivel)\b/.test(disponibilidade)) return false
  if (typeof estoque === 'number' && estoque <= 0) return false
  return true
}

function extrairItems(payload) {
  const data = payload?.data?.data || payload?.data || payload
  return primeiroValor(data?.items, data?.results, data?.products, [])
}

function pareceCamisa(titulo) {
  const texto = normalizarTexto(titulo)
  if (!/\bcamisa\b/.test(texto)) return false
  return !/\b(agasalho|bermuda|blusa|calca|calção|chuteira|conjunto|jaqueta|moletom|short|tenis)\b/.test(texto)
}

function pareceUsado(condicao) {
  const texto = normalizarTexto(condicao)
  return /\b(used|usad[ao]s?)\b/.test(texto)
}

function pertenceAoClube(titulo, termos) {
  const texto = normalizarTexto(titulo)
  return termos.some(termo => texto.includes(normalizarTexto(termo)))
}

function converterItem(item, clube) {
  const titulo = tituloDoItem(item)

  return {
    titulo,
    link_original: linkDoItem(item),
    imagem_url: primeiraImagem(item) || null,
    preco: precoDoItem(item),
    clube: clube || identificarClube(titulo),
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: ['geckoapi'],
    de_jogo: normalizarTexto(titulo).includes('jogo') || normalizarTexto(titulo).includes('match worn'),
    novidade: false,
    alta_procura: false,
    condicao_gecko: primeiroValor(item.condition, item.condicao, item.estado, null),
  }
}

async function carregarBuscas(options) {
  if (options.url) {
    return [{ query: options.query || options.url, url: options.url, clube: null, termos: [] }]
  }

  if (options.query) {
    return [{ query: options.query, url: null, clube: null, termos: [] }]
  }

  const clubes = await carregarClubesBusca(supabase, { usado: true })
  const filtrados = options.clubesSelecionados.length === 0
    ? clubes
    : clubes.filter(({ clube, aliases = [], termos = [] }) => {
      const nomes = [clube, ...aliases, ...termos].map(normalizarTexto)
      return options.clubesSelecionados.some(clubeSelecionado => nomes.includes(clubeSelecionado))
    })

  return filtrados.map(({ clube, query, termos }) => ({ clube, query, url: null, termos }))
}

function montarPayload(busca, page) {
  return {
    target: 'mercadolivre.com.br',
    type: 'plp',
    page,
    ...(busca.url ? { url: busca.url } : { keyword: busca.query }),
  }
}

function montarPayloadPdp(url) {
  return {
    target: 'mercadolivre.com.br',
    type: 'pdp',
    url,
  }
}

function erroTemporarioGecko(error) {
  return error?.status === 429 || error?.status >= 500
}

async function chamarGecko(payload) {
  if (!process.env.GECKO_API_KEY) {
    throw new Error('Configure GECKO_API_KEY no .env para usar o scraper Mercado Livre via GeckoAPI.')
  }

  const res = await fetch(GECKO_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GECKO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await res.text()
  let data = null
  try {
    data = JSON.parse(body)
  } catch {
    data = { raw: body }
  }

  if (!res.ok) {
    const detalhe = data?.message || data?.error || data?.errorCode || JSON.stringify(data?.details || data)
    const error = new Error(`GeckoAPI retornou status ${res.status}: ${detalhe}`)
    error.status = res.status
    throw error
  }

  return data
}

async function chamarGeckoComRetry(payload, options) {
  let ultimaFalha = null

  for (let tentativa = 1; tentativa <= options.retries + 1; tentativa++) {
    try {
      return await chamarGecko(payload)
    } catch (error) {
      ultimaFalha = error
      if (!erroTemporarioGecko(error) || tentativa > options.retries) break

      const espera = Math.round((3000 * tentativa) + (Math.random() * 2000))
      console.warn(`  GeckoAPI falhou (${error.message}). Tentativa ${tentativa + 1}/${options.retries + 1} em ${Math.round(espera / 1000)}s`)
      await sleep(espera)
    }
  }

  throw ultimaFalha
}

function filtrarProdutos(produtos, busca, options) {
  return produtos
    .filter(produto => {
      if (!produto.titulo || !produto.link_original) return false
      if (options.filtrarCamisas && !pareceCamisa(produto.titulo)) return false
      if (options.filtrarUsados && !pareceUsado(produto.condicao_gecko)) return false
      if (busca.termos?.length && !pertenceAoClube(produto.titulo, busca.termos)) return false
      return true
    })
    .map(({ condicao_gecko, ...produto }) => {
      void condicao_gecko
      return produto
    })
}

function diagnosticarPrimeiroItem(items) {
  const item = items[0]
  if (!item) return

  console.log('  Debug primeiro item:')
  console.log(JSON.stringify(item, null, 2).slice(0, 4000))
}

function produtoDaPdp(produto, payload) {
  const data = payload?.data?.data || payload?.data || payload
  if (!data || payload?.notFound || !itemDisponivel(data)) return null

  const condicao = primeiroValor(data.itemCondition, data.condition, produto.condicao_gecko, null)
  return {
    ...produto,
    titulo: primeiroValor(data.name, produto.titulo),
    link_original: primeiroValor(data.canonicalUrl, data.url, produto.link_original),
    imagem_url: primeiraImagem(data) || produto.imagem_url || null,
    preco: precoDoItem(data) ?? produto.preco,
    ano: extrairAno(primeiroValor(data.name, produto.titulo)),
    condicao_gecko: condicao,
    alta_procura: Number(data.soldCount || 0) > 5,
  }
}

async function completarComPdp(produtos, options) {
  const limite = options.maxPdp ? produtos.slice(0, options.maxPdp) : produtos
  const completos = []

  for (let index = 0; index < limite.length; index++) {
    const produto = limite[index]
    try {
      const data = await chamarGeckoComRetry(montarPayloadPdp(produto.link_original), options)
      if (options.debug && index === 0) {
        console.log('  Debug PDP do primeiro aprovado:')
        console.log(JSON.stringify(data?.data || data, null, 2).slice(0, 4000))
      }

      const completo = produtoDaPdp(produto, data)
      if (!completo) {
        console.log(`     ⏭️  PDP indisponível: ${produto.titulo}`)
      } else if (!completo.imagem_url) {
        console.log(`     ⏭️  PDP sem foto: ${produto.titulo}`)
      } else if (options.filtrarUsados && !pareceUsado(completo.condicao_gecko)) {
        console.log(`     ⏭️  PDP não usado: ${produto.titulo}`)
      } else {
        const { condicao_gecko, ...salvavel } = completo
        void condicao_gecko
        completos.push(salvavel)
      }
    } catch (error) {
      console.warn(`     ⚠️  PDP falhou: ${produto.titulo} (${error.message || error})`)
    }

    await sleep(DELAY_MS)
  }

  if (options.maxPdp && produtos.length > options.maxPdp) {
    console.log(`  PDP limitada por --max-pdp: ${options.maxPdp}/${produtos.length} produtos aprovados`)
  }

  return completos
}

async function rasparBusca(busca, options) {
  console.log(`\n🔎 Mercado Livre — "${busca.query}"`)

  let totalBusca = 0

  for (let page = 1; page <= options.maxPaginas; page++) {
    let items = []

    if (options.browserListing) {
      const url = montarUrlHtml(busca, page)
      console.log(`  Browser consultado: ${url}`)
      items = extrairCardsHtml(await buscarHtmlRenderizado(url))
    } else if (options.htmlListing) {
      const url = montarUrlHtml(busca, page)
      console.log(`  HTML consultado: ${url}`)
      items = extrairCardsHtml(await buscarHtml(url))
    } else {
      const payload = montarPayload(busca, page)
      const data = await chamarGeckoComRetry(payload, options)
      items = extrairItems(data)
    }

    if (options.debug) diagnosticarPrimeiroItem(items)
    const aprovados = filtrarProdutos(items.map(item => converterItem(item, busca.clube)), busca, options)
    const produtos = options.comPdp ? await completarComPdp(aprovados, options) : aprovados

    console.log(`  Página ${page}: ${items.length} recebidos, ${aprovados.length} aprovados${options.comPdp ? `, ${produtos.length} completos via PDP` : ''}`)
    produtos.slice(0, 5).forEach((produto, index) => {
      console.log(`     ${index + 1}. ${produto.titulo} — R$ ${produto.preco ?? 's/preço'} — ${produto.imagem_url ? 'com foto' : 'sem foto'}`)
    })

    if (items.length === 0 || aprovados.length === 0) break

    if (options.salvar) {
      const salvos = await salvarProdutos(supabase, produtos)
      totalBusca += salvos
      console.log(`  ✅ ${salvos} salvos`)
    } else {
      totalBusca += produtos.length
      console.log('  Modo teste: nada foi salvo no banco.')
    }

    await sleep(DELAY_MS)
  }

  return totalBusca
}

async function main() {
  const options = parseArgs()
  const buscas = await carregarBuscas(options)
  if (buscas.length === 0) throw new Error('Nenhuma busca encontrada para os filtros informados.')

  console.log(`🚀 Scraper — Mercado Livre via GeckoAPI${options.salvar ? '' : ' (dry-run)'}\n`)
  console.log(`Buscas: ${buscas.map(busca => busca.query).join(', ')}`)
  if (options.url) console.log(`URL pronta: ${options.url}`)
  console.log(`Páginas por busca: ${options.maxPaginas}`)
  console.log(`Filtro local de usados: ${options.filtrarUsados ? 'ligado' : 'desligado'}`)
  console.log(`Listagem HTML: ${options.htmlListing ? 'ligada' : 'desligada'}`)
  console.log(`Listagem browser: ${options.browserListing ? 'ligada' : 'desligada'}`)
  console.log(`Enriquecimento PDP: ${options.comPdp ? 'ligado' : 'desligado'}`)
  if (options.maxPdp) console.log(`Limite PDP por página: ${options.maxPdp}`)
  if (!options.salvar) console.log('Use --salvar para gravar no Supabase.')

  const execucaoParcial = Boolean(options.query || options.url || options.clubesSelecionados.length)
  if (options.salvar && !options.semDesativar && !execucaoParcial) {
    await desativarProdutosDaFonte(supabase, FONTE_NOME)
  } else if (options.salvar) {
    console.log('Sem desativação inicial: execução filtrada ou flag --sem-desativar.')
  }

  let totalGeral = 0
  const falhas = []
  for (const busca of buscas) {
    try {
      totalGeral += await rasparBusca(busca, options)
    } catch (error) {
      falhas.push({ busca, erro: error.message || String(error) })
      console.warn(`\n⚠️  Falha em "${busca.query}": ${error.message || error}`)
    }
    await sleep(DELAY_MS)
  }

  if (options.salvar) {
    await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  }

  if (falhas.length > 0) {
    console.warn('\n⚠️  Buscas com falha:')
    falhas.forEach(({ busca, erro }, index) => {
      console.warn(`   ${index + 1}. ${busca.query}: ${erro}`)
    })
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${options.salvar ? 'salvos' : 'encontrados'}.`)
}

main().catch(error => {
  console.error(error.message || error)
  process.exitCode = 1
})
