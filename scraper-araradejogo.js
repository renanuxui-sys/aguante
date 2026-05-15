/**
 * Scraper — Arara de Jogo (Nuvemshop)
 * Roda com: node scraper-araradejogo.js
 * Teste sem salvar: node scraper-araradejogo.js --dry-run
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

const BASE_URL = 'https://araradejogo.lojavirtualnuvem.com.br'
const FONTE_NOME = 'Arara de Jogo'
const FONTE_URL = BASE_URL
const DELAY_MS = 1500
const MAX_PAGINAS_VAZIAS = 2

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')

const COLECOES = [
  { path: '/brasileiros/', nome: 'Brasileiros', categorias: ['Clubes Brasileiros'] },
  { path: '/sul-americanos/', nome: 'Sul-americanos', categorias: ['Clubes Sulamericanos'], somenteIdentificados: true },
  { path: '/europeus/', nome: 'Europeus', categorias: ['Clubes Europeus'], somenteIdentificados: true },
  { path: '/selecoes/', nome: 'Seleções', categorias: ['Seleções'] },
]

function urlDaPagina(path, page) {
  const url = new URL(path, BASE_URL)
  url.searchParams.set('page', String(page))
  return url.toString()
}

function produtoDisponivel(produto) {
  const availability = produto?.offers?.availability || ''
  return !availability || availability.toLowerCase().includes('instock')
}

function extrairProdutoJsonLd(raw) {
  if (!raw) return null

  try {
    const data = JSON.parse(raw)
    const items = Array.isArray(data) ? data : [data]
    const produto = items.find(item => item?.['@type'] === 'Product')
    if (!produto || !produtoDisponivel(produto)) return null

    const titulo = produto.name || ''
    const link = produto.offers?.url || produto.mainEntityOfPage?.['@id'] || ''
    const preco = produto.offers?.price ? parseFloat(produto.offers.price) : null

    if (!titulo || !link) return null

    return {
      titulo,
      link,
      imagem: Array.isArray(produto.image) ? produto.image[0] : produto.image || null,
      preco: isNaN(preco) ? null : preco,
    }
  } catch {
    return null
  }
}

function extrairProdutoContainer($, el) {
  const $el = $(el)
  const variantsRaw = $el.attr('data-variants')
  let preco = null
  let imagem = null

  if (variantsRaw) {
    try {
      const variants = JSON.parse(variantsRaw)
      if (variants.length > 0) {
        preco = variants[0].price_number || variants[0].price || null
        const imgUrl = variants[0].image_url || ''
        imagem = imgUrl ? (imgUrl.startsWith('//') ? `https:${imgUrl}` : imgUrl) : null
      }
    } catch {}
  }

  const $link = $el.find('a.item-link, a.js-item-name, a').first()
  const titulo = $link.attr('title') || $el.find('.js-item-name, .item-name').first().text().trim()
  const link = $link.attr('href') || ''
  if (!titulo || !link) return null

  if (!imagem) {
    const img = $el.find('img').first()
    imagem = img.attr('data-src') || img.attr('src') || null
    if (imagem?.startsWith('//')) imagem = `https:${imagem}`
  }

  return {
    titulo,
    link: new URL(link, BASE_URL).toString(),
    preco: preco ? Number(preco) : null,
    imagem,
  }
}

function extrairProdutos($) {
  const porLink = new Map()

  $('script[type="application/ld+json"]').each((_, el) => {
    const produto = extrairProdutoJsonLd($(el).html())
    if (produto?.link) porLink.set(produto.link, produto)
  })

  $('.js-product-container, .item-product').each((_, el) => {
    const produto = extrairProdutoContainer($, el)
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
  console.log(`🚀 Scraper — Arara de Jogo${dryRun ? ' (dry-run)' : ''}\n`)

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
