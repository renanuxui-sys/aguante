/**
 * Scraper — Di Gordo (Nuvemshop)
 * Roda com: node scraper-digordo.js
 * Teste sem salvar: node scraper-digordo.js --dry-run
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, carregarClubesMapPorCategoria, combinarClubesMap, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL = 'https://digordo.lojavirtualnuvem.com.br'
const FONTE_NOME = 'Di Gordo'
const FONTE_URL = BASE_URL
const DELAY_MS = 1500
const MAX_PAGINAS_VAZIAS = 2

const supabase = criarSupabase()
const dryRun = process.argv.includes('--dry-run')
const semDesativar = process.argv.includes('--sem-desativar')

const COLECOES = [
  { slug: 'times-nacionais', nome: 'Times nacionais', categorias: ['Clubes Brasileiros'] },
  { slug: 'times-sul-americanos', nome: 'Times sul-americanos', categorias: ['Clubes Sulamericanos'], somenteIdentificados: true },
  { slug: 'times-europeus', nome: 'Times europeus', categorias: ['Clubes Europeus'], somenteIdentificados: true },
  { slug: 'selecoes', nome: 'Seleções', categorias: ['Seleções'] },
]

function produtoDisponivel(produto) {
  const availability = produto?.offers?.availability || ''
  return availability.toLowerCase().includes('instock')
}

function extrairProdutoJsonLd(raw) {
  if (!raw) return null

  try {
    const data = JSON.parse(raw)
    if (data?.['@type'] !== 'Product') return null
    if (!produtoDisponivel(data)) return null

    const titulo = data.name || ''
    const link = data.offers?.url || data.mainEntityOfPage?.['@id'] || ''
    const preco = data.offers?.price ? parseFloat(data.offers.price) : null

    if (!titulo || !link) return null

    return {
      titulo,
      link,
      imagem: data.image || null,
      preco: isNaN(preco) ? null : preco,
    }
  } catch {
    return null
  }
}

async function rasparPagina(slug, page) {
  const url = `${BASE_URL}/${slug}/?page=${page}`
  console.log(`  📄 Página ${page}: ${url}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }

    const html = await res.text()
    const $ = cheerio.load(html)

    return $('script[type="application/ld+json"]')
      .toArray()
      .map(el => extrairProdutoJsonLd($(el).html()))
      .filter(Boolean)
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparColecao({ slug, nome, categorias, somenteIdentificados = false }, clubesPorCategoria) {
  console.log(`\n⚽ ${nome}`)
  const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))

  let page = 1
  let totalColecao = 0
  let paginasVazias = 0
  const vistos = new Set()

  while (true) {
    const produtos = await rasparPagina(slug, page)
    const novos = produtos.filter(produto => {
      if (vistos.has(produto.link)) return false
      vistos.add(produto.link)
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
  console.log(`🚀 Scraper — Di Gordo${dryRun ? ' (dry-run)' : ''}\n`)

  if (!dryRun && !semDesativar) await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesPorCategoria)
    await sleep(DELAY_MS)
  }

  if (!dryRun) await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${dryRun ? 'encontrados' : 'salvos'}.`)
}

main().catch(console.error)
