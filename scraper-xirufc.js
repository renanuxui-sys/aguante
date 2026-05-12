/**
 * Scraper — XIRÚ FC Store (Nuvemshop)
 * Roda com: node scraper-xirufc.js
 *
 * Coleções rastreadas:
 *   - /s-c-internacional/   → Internacional (clube fixo)
 *   - /selecoes/            → Seleções (identificação automática)
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
  carregarClubesMap,
  sleep,
} from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Xiru FC'
const FONTE_URL  = 'https://xirufc.com.br'
const DELAY_MS   = 1500
const MAX_ERROS  = 2

const supabase = criarSupabase()

const COLECOES = [
  { slug: 's-c-internacional', clube: 'Internacional' },
  { slug: 'selecoes',          clube: null },            // identificação automática
]

async function rasparPagina(slug, page) {
  const url = `${FONTE_URL}/${slug}/?page=${page}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
      redirect: 'follow',
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status} em ${url}`); return [] }
    const html = await res.text()
    const $ = cheerio.load(html)
    const produtos = []

    $('.js-product-container').each((_, el) => {
      try {
        const variantsRaw = $(el).attr('data-variants')
        if (!variantsRaw) return

        const variants = JSON.parse(variantsRaw)
        if (!variants?.length) return

        const v = variants[0]

        // Pula esgotados
        if (!v.available || v.stock === 0) return

        const preco     = v.price_number ?? null
        const imagemRaw = v.image_url ?? ''
        // Nuvemshop: image_url começa com // e tem tamanho embutido — pega 480px
        const imagem    = imagemRaw
          ? 'https:' + imagemRaw.replace(/-1024-1024(\.\w+)$/, '-480-0$1')
          : null

        // Título e link ficam no elemento irmão .item-description
        const container = $(el).closest('.item')
        const titulo    = container.find('a.item-link').attr('title')
          || container.find('.js-item-name').text().trim()
        const linkRel   = container.find('a.item-link').attr('href')
          || container.find('a.js-product-item-image-link-private').attr('href')
        const link      = linkRel
          ? (linkRel.startsWith('http') ? linkRel : FONTE_URL + linkRel)
          : null

        if (!titulo || !link) return

        produtos.push({ titulo, link, imagem, preco })
      } catch (e) {
        console.warn('  ⚠️  Erro ao parsear variante:', e.message)
      }
    })

    return produtos
  } catch (err) {
    console.warn(`  ⚠️  Erro ao buscar página ${page}: ${err.message}`)
    return []
  }
}

async function rasparColecao({ slug, clube }, clubesMap) {
  console.log(`\n⚽ ${clube || slug}`)
  let page = 1
  let erros = 0
  let totalColecao = 0

  while (true) {
    const items = await rasparPagina(slug, page)

    if (items.length === 0) {
      erros++
      if (erros >= MAX_ERROS) break
      page++
      await sleep(DELAY_MS)
      continue
    }

    erros = 0

    const produtos = items.map(({ titulo, link, imagem, preco }) => ({
      titulo,
      link_original: link,
      imagem_url: imagem,
      preco,
      clube: clube || identificarClube(titulo, clubesMap),
      ano: extrairAno(titulo),
      fonte_nome: FONTE_NOME,
      fonte_url: FONTE_URL,
      tags: [],
      de_jogo: /\bjogo\b/i.test(titulo),
      novidade: false,
      alta_procura: false,
    }))

    const salvos = await salvarProdutos(supabase, produtos)
    totalColecao += salvos
    console.log(`  ✅ Página ${page} — ${items.length} encontrados, ${salvos} salvos (total: ${totalColecao})`)

    page++
    await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Xiru FC\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesMap = await carregarClubesMap(supabase)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesMap)
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ativos.`)
}

main().catch(console.error)