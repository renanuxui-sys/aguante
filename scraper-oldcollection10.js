/**
 * Scraper — Old Collection 10 (Nuvemshop)
 * Roda com: node scraper-oldcollection10.js
 * Teste sem salvar: node scraper-oldcollection10.js --dry-run
 */

import fetch from 'node-fetch'
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
import 'dotenv/config'

const BASE_URL = 'https://oldcollection10.lojavirtualnuvem.com.br'
const FONTE_NOME = 'Old Collection 10'
const FONTE_URL = BASE_URL
const DELAY_MS = 1500
const MAX_PAGINAS_VAZIAS = 2

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')

const COLECOES = [
  { path: '/clubes-nacionais/', nome: 'Clubes nacionais', categorias: ['Clubes Brasileiros'] },
  { path: '/clubes-europeus/', nome: 'Clubes europeus', categorias: ['Clubes Europeus'], somenteIdentificados: true },
  { path: '/clubes-sul-americanos/', nome: 'Clubes sul-americanos', categorias: ['Clubes Sulamericanos'], somenteIdentificados: true },
  { path: '/selecoes/', nome: 'Seleções', categorias: ['Seleções'] },
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

function extrairPrecoTexto(texto) {
  if (!texto) return null
  const match = texto.replace(/\s+/g, ' ').match(/R\$\s*([\d.]+,\d{2})/)
  if (!match) return null
  const valor = Number(match[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(valor) ? valor : null
}

function textoIndicaEsgotado(texto) {
  const normalizado = (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return /\b(esgotado|sem estoque|fora de estoque|indisponivel|sold out|out of stock)\b/.test(normalizado)
}

function normalizarPrecoVariante(variante) {
  if (typeof variante?.price_number === 'number') return variante.price_number
  if (typeof variante?.price === 'number') return variante.price
  if (typeof variante?.price_number_raw === 'number') return variante.price_number_raw / 100
  return null
}

function extrairVariantes(raw) {
  if (!raw) return { temVariantes: false, disponivel: true, preco: null, imagem: null }

  try {
    const variantes = JSON.parse(raw)
    const disponiveis = variantes.filter(variante => variante?.available === true || Number(variante?.stock || 0) > 0)

    if (variantes.length > 0 && disponiveis.length === 0) {
      return { temVariantes: true, disponivel: false, preco: null, imagem: null }
    }

    const variante = disponiveis[0] || variantes[0]
    return {
      temVariantes: true,
      disponivel: true,
      preco: normalizarPrecoVariante(variante),
      imagem: normalizarImagem(variante?.image_url || null),
    }
  } catch {
    return { temVariantes: false, disponivel: true, preco: null, imagem: null }
  }
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

    const titulo = produto.name || ''
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

function primeiraImagem($el) {
  const img = $el.find('img').first()
  return normalizarImagem(
    img.attr('data-src') ||
    img.attr('data-original') ||
    img.attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0] ||
    img.attr('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
    img.attr('src') ||
    null
  )
}

function extrairProdutoContainer($, el) {
  const $el = $(el)
  const $container = $el.find('.js-product-container').first()
  const variantes = extrairVariantes($container.attr('data-variants') || $el.attr('data-variants'))

  if (variantes.temVariantes && !variantes.disponivel) return null
  if (textoIndicaEsgotado($el.find('.js-stock-label, .label-stock, .label-sold-out, .sold-out').text())) return null

  const $link = $el.find('a.item-link, a.js-product-item-image-link-private, a[title]').first()
  const titulo = $el.find('.js-item-name, .item-name').first().text().trim() || $link.attr('title') || ''
  const link = $link.attr('href') || ''
  if (!titulo || !link) return null

  return {
    titulo,
    link: new URL(link, BASE_URL).toString(),
    preco: variantes.preco || extrairPrecoTexto($el.find('.js-price-display, .item-price').first().text()) || extrairPrecoTexto($el.text()),
    imagem: variantes.imagem || primeiraImagem($el),
  }
}

function extrairProdutos($) {
  const porLink = new Map()

  $('.js-item-product, [data-component="product-list-item"], .item-product').each((_, el) => {
    const produto = extrairProdutoContainer($, el)
    if (produto?.link) porLink.set(produto.link, produto)
  })

  $('script[type="application/ld+json"]').each((_, el) => {
    const produto = extrairProdutoJsonLd($(el).html())
    if (produto?.link && !porLink.has(produto.link)) porLink.set(produto.link, produto)
  })

  return Array.from(porLink.values())
}

async function buscarHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
    timeout: 20000,
  })
  if (!res.ok) throw new Error(`Status ${res.status}`)
  return res.text()
}

async function rasparPagina(path, page) {
  const url = urlDaPagina(path, page)
  console.log(`  📄 Página ${page}: ${url}`)

  try {
    const html = await buscarHtml(url)
    return extrairProdutos(cheerio.load(html))
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparColecao({ path, nome, categorias, somenteIdentificados = false }, clubesPorCategoria, vistosGlobais) {
  console.log(`\n⚽ ${nome}`)
  const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))

  let page = 1
  let totalColecao = 0
  let paginasVazias = 0

  while (true) {
    const produtos = await rasparPagina(path, page)
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

    page++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log(`🚀 Scraper — Old Collection 10${dryRun ? ' (dry-run)' : ''}\n`)

  if (!dryRun && !semDesativar) await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)

  let totalGeral = 0
  const vistosGlobais = new Set()
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesPorCategoria, vistosGlobais)
    await sleep(DELAY_MS)
  }

  if (!dryRun) await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${dryRun ? 'encontrados' : 'salvos'}.`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
