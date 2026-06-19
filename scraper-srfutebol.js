/**
 * Scraper — SR Futebol (Tray Commerce)
 * Roda com: node scraper-srfutebol.js
 * Teste sem salvar: node scraper-srfutebol.js --dry-run --max-paginas=1
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

const BASE_URL = 'https://www.sr-futebol.com.br'
const FONTE_NOME = 'SR Futebol'
const FONTE_URL = BASE_URL
const DELAY_MS = 1500
const MAX_PAGINAS_SEM_NOVOS = 2

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')
const maxPaginas = (() => {
  const flag = process.argv.find(arg => arg.startsWith('--max-paginas='))
  return flag ? Math.max(1, parseInt(flag.split('=')[1], 10) || 1) : Infinity
})()

const CATEGORIAS = [
  { path: '/equipes-nacionais', nome: 'Clubes brasileiros', categorias: ['Clubes Brasileiros'] },
  { path: '/feminino/camisetas', nome: 'Alemanha', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/escocia', nome: 'Escócia', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/espanha', nome: 'Espanha', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/reino-unido', nome: 'Inglaterra', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/italia', nome: 'Itália', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/holanda', nome: 'Holanda', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/portugal', nome: 'Portugal', categorias: ['Clubes Europeus'] },
  { path: '/equipes-internacionais/outros-paises', nome: 'Outros países da Europa', categorias: ['Clubes Europeus'] },
  { path: '/exemplo-tray-nivel-1-feminino/argentina', nome: 'Clubes argentinos', categorias: ['Clubes Sulamericanos'] },
  { path: '/selecoes', nome: 'Seleções', categorias: ['Seleções'] },
]

function urlAbsoluta(url) {
  if (!url) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('http')) return url
  return new URL(url, BASE_URL).toString()
}

function urlDaPagina(path, pagina) {
  const url = new URL(path, BASE_URL)
  url.searchParams.set('pg', String(pagina))
  return url.toString()
}

function parsePreco(valor) {
  if (!valor) return null
  const numero = Number(
    String(valor)
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.')
  )
  return Number.isFinite(numero) && numero > 0 ? numero : null
}

function extrairImagem($el) {
  const $img = $el.find('img.lazyload, img').first()
  const srcset = $img.attr('data-srcset') || $img.attr('srcset') || ''
  const maiorSrcset = srcset
    .split(',')
    .map(item => {
      const [url, largura] = item.trim().split(/\s+/)
      return { url, largura: parseInt(largura, 10) || 0 }
    })
    .filter(item => item.url)
    .sort((a, b) => b.largura - a.largura)[0]?.url

  const imagem = maiorSrcset ||
    $img.attr('data-src') ||
    $img.attr('data-original') ||
    $img.attr('data-lazy') ||
    $img.attr('src') ||
    null

  if (!imagem || imagem.startsWith('data:') || imagem.includes('/empty.png')) return null
  return urlAbsoluta(imagem)
}

function textoIndicaIndisponivel(texto) {
  const normalizado = (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return /\b(esgotado|indisponivel|sem estoque|avise-me|produto indisponivel)\b/.test(normalizado)
}

function extrairProdutos(html) {
  const $ = cheerio.load(html)
  const porLink = new Map()

  $('div.product').each((_, el) => {
    const $el = $(el)
    if (textoIndicaIndisponivel($el.text()) || textoIndicaIndisponivel($el.attr('class'))) return

    const titulo = ($el.attr('data-ga4-name') || $el.find('.product-name').first().text()).trim()
    const link = urlAbsoluta(
      $el.find('a.space-image').attr('href') ||
      $el.find('a.product-info').attr('href') ||
      $el.find('.product-name a').attr('href') ||
      $el.find('a.product-button').attr('href') ||
      null
    )
    const preco = parsePreco($el.attr('data-ga4-price')) ||
      parsePreco($el.find('.current-price').first().text()) ||
      parsePreco($el.find('.price').first().text())

    if (!titulo || !link || !preco) return

    porLink.set(link, {
      titulo,
      link,
      imagem: extrairImagem($el),
      preco,
    })
  })

  return Array.from(porLink.values())
}

async function buscarPagina(path, pagina) {
  const url = urlDaPagina(path, pagina)
  console.log(`  📄 Página ${pagina}: ${url}`)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        Referer: BASE_URL,
      },
      timeout: 20000,
      redirect: 'follow',
    })

    if (!res.ok) throw new Error(`Status ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const utf8 = buffer.toString('utf8')
    const html = /charset=["']?(?:iso-8859-1|windows-1252)/i.test(utf8.slice(0, 5000))
      ? buffer.toString('latin1')
      : utf8

    return extrairProdutos(html)
  } catch (error) {
    console.warn(`  ⚠️  Erro: ${error.message}`)
    return []
  }
}

async function rasparCategoria({ path, nome, categorias }, clubesPorCategoria, vistosGlobais) {
  console.log(`\n⚽ ${nome}`)
  const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))
  let pagina = 1
  let paginasSemNovos = 0
  let totalCategoria = 0

  while (pagina <= maxPaginas) {
    const encontrados = await buscarPagina(path, pagina)
    const novos = encontrados.filter(produto => {
      if (vistosGlobais.has(produto.link)) return false
      vistosGlobais.add(produto.link)
      return true
    })

    if (novos.length === 0) {
      paginasSemNovos++
      console.log(`  ℹ️  Nenhum produto novo (${paginasSemNovos}/${MAX_PAGINAS_SEM_NOVOS})`)
      if (paginasSemNovos >= MAX_PAGINAS_SEM_NOVOS) break
    } else {
      paginasSemNovos = 0
      let descartados = 0
      const produtos = novos
        .map(produto => ({
          titulo: produto.titulo,
          link_original: produto.link,
          imagem_url: produto.imagem,
          preco: produto.preco,
          clube: identificarClube(produto.titulo, clubesMap),
          ano: extrairAno(produto.titulo),
          fonte_nome: FONTE_NOME,
          fonte_url: FONTE_URL,
          tags: [],
          de_jogo: /\b(de jogo|usada em jogo|preparada para jogo|match worn)\b/i.test(produto.titulo),
          novidade: false,
          alta_procura: false,
        }))
        .filter(produto => {
          if (produto.clube) return true
          descartados++
          return false
        })

      if (descartados > 0) console.log(`  🚫 ${descartados} produtos sem clube pré-definido descartados`)

      const salvos = dryRun ? produtos.length : await salvarProdutos(supabase, produtos)
      totalCategoria += salvos
      console.log(`  ✅ ${dryRun ? 'Encontrados' : 'Salvos'}: ${salvos} (total ${nome}: ${totalCategoria})`)
      if (dryRun) produtos.slice(0, 3).forEach(produto => {
        console.log(`     · [${produto.clube}] ${produto.titulo} — R$${produto.preco}`)
      })
    }

    pagina++
    await sleep(DELAY_MS)
  }

  return totalCategoria
}

async function main() {
  console.log(`🚀 Scraper — SR Futebol${dryRun ? ' (dry-run)' : ''}\n`)

  if (!dryRun && !semDesativar) await desativarProdutosDaFonte(supabase, FONTE_NOME, FONTE_URL)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)
  const vistosGlobais = new Set()
  let totalGeral = 0

  for (const categoria of CATEGORIAS) {
    totalGeral += await rasparCategoria(categoria, clubesPorCategoria, vistosGlobais)
    await sleep(DELAY_MS)
  }

  if (!dryRun) await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${dryRun ? 'encontrados' : 'salvos'}.`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
