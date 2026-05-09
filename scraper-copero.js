/**
 * Scraper — Copero Brechó
 * Roda com: node scraper-copero.js
 * Teste sem salvar: node scraper-copero.js --dry-run
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, carregarClubesMap, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL = 'https://coperobrecho.net'
const FONTE_NOME = 'Copero Brechó'
const FONTE_URL = BASE_URL
const DELAY_MS = 1500

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')

const COLECOES = [
  { path: 'gremio', clube: 'Grêmio' },
  { path: 'selecao-brasileira', clube: 'Brasil' },
  { path: 'camisas-de-outras-selecoes', clube: null },
]

function urlAbsoluta(url) {
  if (!url) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('http')) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function limparPreco(texto) {
  if (!texto) return null
  const match = texto.replace(/\./g, '').replace(',', '.').match(/[\d]+\.?\d*/)
  return match ? parseFloat(match[0]) : null
}

function limparTexto(texto) {
  if (!texto) return ''
  return cheerio.load(texto).text().replace(/\s+/g, ' ').trim()
}

function parseJsonProduto($el) {
  const json = $el.find('script[type="application/ld+json"]').first().html()
  if (!json) return null

  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function primeiraImagemDoSrcset(srcset) {
  if (!srcset) return null

  const opcoes = srcset
    .split(',')
    .map(item => {
      const [url, largura] = item.trim().split(/\s+/)
      return {
        url,
        largura: parseInt((largura || '').replace(/\D/g, ''), 10) || 0,
      }
    })
    .filter(item => item.url)
    .sort((a, b) => b.largura - a.largura)

  return opcoes[0]?.url || null
}

function extrairImagem($el, produtoJson) {
  const imagemJson = Array.isArray(produtoJson?.image) ? produtoJson.image[0] : produtoJson?.image
  if (imagemJson) return urlAbsoluta(imagemJson)

  const $img = $el.find('img.item-image-featured, img.js-item-image, img').first()
  const imagem = primeiraImagemDoSrcset($img.attr('data-srcset') || $img.attr('srcset')) ||
    $img.attr('data-src') ||
    $img.attr('src') ||
    null

  if (!imagem || imagem.startsWith('data:')) return null
  return urlAbsoluta(imagem)
}

function estaDisponivel($el, produtoJson) {
  const disponibilidade = produtoJson?.offers?.availability || ''
  if (disponibilidade && !disponibilidade.toLowerCase().includes('instock')) return false

  const texto = $el.text().toLowerCase()
  return !texto.includes('esgotado') && !texto.includes('sem estoque')
}

function converterProduto($, el, clube, clubesMap) {
  const $el = $(el)
  const produtoJson = parseJsonProduto($el)

  if (!estaDisponivel($el, produtoJson)) return null

  const titulo = limparTexto(produtoJson?.name ||
    $el.find('.js-item-name, .item-name').first().text().trim() ||
    $el.find('img').first().attr('alt') ||
    '')
  const link = produtoJson?.offers?.url ||
    produtoJson?.mainEntityOfPage?.['@id'] ||
    $el.find('a[href*="/produtos/"]').first().attr('href') ||
    ''
  const preco = limparPreco($el.find('.js-price-display, .item-price').first().text()) ||
    (produtoJson?.offers?.price ? parseFloat(produtoJson.offers.price) : null)

  if (!titulo || !link) return null

  return {
    titulo,
    link_original: urlAbsoluta(link),
    imagem_url: extrairImagem($el, produtoJson),
    preco,
    clube: clube || identificarClube(titulo, clubesMap),
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: [],
    de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('game'),
    novidade: false,
    alta_procura: false,
  }
}

async function rasparPagina({ path, clube }, pagina, clubesMap) {
  const url = pagina === 1 ? `${BASE_URL}/${path}/` : `${BASE_URL}/${path}/page/${pagina}/`
  console.log(`  📄 Página ${pagina}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }

    const html = await res.text()
    const $ = cheerio.load(html)

    return $('.js-item-product')
      .map((_, el) => converterProduto($, el, clube, clubesMap))
      .get()
      .filter(Boolean)
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparColecao(colecao, clubesMap) {
  console.log(`\n⚽ ${colecao.clube || colecao.path}`)

  let totalColecao = 0
  let pagina = 1
  let paginasVazias = 0

  while (true) {
    const produtos = await rasparPagina(colecao, pagina, clubesMap)

    if (produtos.length > 0) {
      if (dryRun) {
        console.log(`  🔎 ${produtos.length} encontrados — exemplo: ${produtos[0].titulo}`)
        totalColecao += produtos.length
      } else {
        const salvos = await salvarProdutos(supabase, produtos)
        totalColecao += salvos
        console.log(`  ✅ ${salvos} salvos (total: ${totalColecao})`)
      }
      paginasVazias = 0
    } else {
      paginasVazias++
      if (paginasVazias >= 2) {
        console.log(`  ⏹️  Sem produtos por ${paginasVazias} páginas. Encerrando coleção.`)
        break
      }
    }

    pagina++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log(`🚀 Scraper — Copero Brechó${dryRun ? ' (dry-run)' : ''}\n`)

  if (!dryRun && !semDesativar) {
    await desativarProdutosDaFonte(supabase, FONTE_NOME)
  }
  const clubesMap = await carregarClubesMap(supabase)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesMap)
    await sleep(DELAY_MS)
  }

  if (!dryRun) {
    await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  }
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${dryRun ? 'encontrados' : 'salvos'}.`)
}

main().catch(console.error)
