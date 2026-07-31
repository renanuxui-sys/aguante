/**
 * Scraper — Minha Camisa Vermelha (Loja Integrada)
 * Roda com: node scraper-minha-camisa-vermelha.js
 * Teste sem salvar: node scraper-minha-camisa-vermelha.js --dry-run
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import {
  criarSupabase,
  desativarProdutosDaFonte,
  salvarProdutos,
  relatorioFinal,
  extrairAno,
  sleep,
} from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL = 'https://www.minhacamisavermelha.com.br'
const FONTE_NOME = 'Minha Camisa Vermelha'
const FONTE_URL = BASE_URL
const CLUBE_FIXO = 'Internacional'
const DELAY_MS = 1500
const MAX_PAGINAS_VAZIAS = 2

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')

const CATEGORIAS = [
  { path: '/adidas', nome: 'Adidas' },
  { path: '/olympikus', nome: 'Olympikus' },
  { path: '/rebook', nome: 'Rebook' },
  { path: '/nike', nome: 'Nike' },
  { path: '/topper', nome: 'Topper' },
  { path: '/umbro', nome: 'Umbro' },
]

function urlDaPagina(path, pagina) {
  const url = new URL(path, BASE_URL)
  if (pagina > 1) url.searchParams.set('pagina', String(pagina))
  return url.toString()
}

function normalizarImagem(url) {
  if (!url || url.startsWith('data:')) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return new URL(url, BASE_URL).toString()
  return url
}

function precoPorTexto(texto) {
  if (!texto) return null
  const match = texto.replace(/\s+/g, ' ').match(/R\$\s*([\d.]+,\d{2})/)
  if (!match) return null
  const valor = Number(match[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(valor) ? valor : null
}

function precoProduto($el) {
  const dataPrice = $el.find('.preco-promocional[data-sell-price]').first().attr('data-sell-price')
  if (dataPrice) {
    const valor = Number(dataPrice)
    if (Number.isFinite(valor)) return valor
  }

  return precoPorTexto($el.find('.preco-promocional').first().text()) || precoPorTexto($el.text())
}

function pareceCamisa(titulo) {
  return /\bcamisa\b/i.test(titulo || '')
}

function extrairProduto($, el) {
  const $el = $(el)
  if ($el.hasClass('indisponivel') || $el.find('.bandeira-indisponivel').length > 0) return null

  const $link = $el.find('a.nome-produto, a.produto-sobrepor').first()
  const titulo = $el.find('a.nome-produto').first().text().trim() || $link.attr('title') || ''
  const link = $link.attr('href') || ''

  if (!titulo || !link || !pareceCamisa(titulo)) return null

  const $img = $el.find('img.imagem-principal, .imagem-produto img').first()
  const imagem = normalizarImagem(
    $img.attr('data-src') ||
    $img.attr('src') ||
    null
  )

  return {
    titulo,
    link: new URL(link, BASE_URL).toString(),
    imagem,
    preco: precoProduto($el),
  }
}

function extrairProdutos(html) {
  const $ = cheerio.load(html)
  const porLink = new Map()

  $('.listagem-item[data-id]').each((_, el) => {
    const produto = extrairProduto($, el)
    if (produto?.link) porLink.set(produto.link, produto)
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

async function rasparPagina(path, pagina) {
  const url = urlDaPagina(path, pagina)
  console.log(`  📄 Página ${pagina}: ${url}`)

  try {
    const html = await buscarHtml(url)
    return extrairProdutos(html)
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparCategoria({ path, nome }, vistosGlobais) {
  console.log(`\n⚽ ${nome}`)
  let pagina = 1
  let totalCategoria = 0
  let paginasVazias = 0

  while (true) {
    const produtos = await rasparPagina(path, pagina)
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
      const convertidos = novos.map(produto => ({
        titulo: produto.titulo,
        link_original: produto.link,
        imagem_url: produto.imagem,
        preco: produto.preco,
        clube: CLUBE_FIXO,
        ano: extrairAno(produto.titulo),
        fonte_nome: FONTE_NOME,
        fonte_url: FONTE_URL,
        tags: [],
        de_jogo: /\b(jogo|match worn|matchworn|player issue)\b/i.test(produto.titulo),
        novidade: false,
        alta_procura: false,
      }))

      const salvos = dryRun ? convertidos.length : await salvarProdutos(supabase, convertidos)
      totalCategoria += salvos
      console.log(`  ✅ ${dryRun ? 'Encontrados' : 'Salvos'}: ${salvos} (total ${nome}: ${totalCategoria})`)
      if (dryRun) convertidos.slice(0, 3).forEach(p => console.log(`     · ${p.titulo} — R$${p.preco}`))
    }

    pagina++
    await sleep(DELAY_MS)
  }

  return totalCategoria
}

async function main() {
  console.log(`🚀 Scraper — Minha Camisa Vermelha${dryRun ? ' (dry-run)' : ''}\n`)

  if (!dryRun && !semDesativar) await desativarProdutosDaFonte(supabase, FONTE_NOME, FONTE_URL)

  let totalGeral = 0
  const vistosGlobais = new Set()
  for (const categoria of CATEGORIAS) {
    totalGeral += await rasparCategoria(categoria, vistosGlobais)
    await sleep(DELAY_MS)
  }

  if (!dryRun) await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${dryRun ? 'encontrados' : 'salvos'}.`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
