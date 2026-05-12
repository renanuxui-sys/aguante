/**
 * Scraper — Manto Sagrado Camisas (Loja Integrada)
 * Roda com: node scraper-mantosagrado.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, carregarClubesMapPorCategoria, combinarClubesMap, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL   = 'https://www.mantosagradocamisas.com'
const FONTE_NOME = 'Manto Sagrado'
const FONTE_URL  = BASE_URL
const DELAY_MS   = 1500

const supabase = criarSupabase()

const COLECOES = [
  { slug: 'gremio',     clube: 'Grêmio',        paginas: 2 },
  { slug: 'inter',      clube: 'Internacional',  paginas: 1 },
  { slug: 'nacionais',  clube: null,             paginas: 4, categorias: ['Clubes Brasileiros', 'Seleções'] },
  { slug: 'europa',     clube: null,             paginas: 4, categorias: ['Clubes Europeus'], somenteIdentificados: true },
  { slug: 'estrangeiras', clube: null,           paginas: 4, categorias: ['Clubes Europeus', 'Clubes Sulamericanos', 'Seleções'], somenteIdentificados: true },
]

async function rasparPagina(slug, page, clubesMap) {
  const url = `${BASE_URL}/${slug}?page=${page}`
  console.log(`  📄 Página ${page}: ${url}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }

    const html = await res.text()
    const $ = cheerio.load(html)
    const produtos = []

    $('div.listagem-item').each((_, el) => {
      const $el   = $(el)
      // Ignora indisponíveis
      if ($el.hasClass('indisponivel')) return
      const titulo = $el.find('a.nome-produto').text().trim()
      const link   = $el.find('a.produto-sobrepor').attr('href') || ''
      const imagem = $el.find('img.imagem-principal').attr('src') || null
      const precoAttr = $el.find('strong.preco-promocional').attr('data-sell-price')
      const preco  = precoAttr ? parseFloat(precoAttr) : null

      if (!titulo || !link) return

      const linkFull = link.startsWith('http') ? link : `${BASE_URL}${link}`

      produtos.push({
        titulo,
        link_original: linkFull,
        imagem_url: imagem,
        preco,
        clube: identificarClube(titulo, clubesMap),
        ano: extrairAno(titulo),
        fonte_nome: FONTE_NOME,
        fonte_url: FONTE_URL,
        tags: [],
        de_jogo: titulo.toLowerCase().includes('jogo'),
        novidade: false,
        alta_procura: false,
      })
    })

    return produtos
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function rasparColecao({ slug, clube, paginas, categorias = ['Clubes Brasileiros'], somenteIdentificados = false }, clubesPorCategoria) {
  console.log(`\n⚽ ${clube || slug} (${paginas} páginas)`)
  const clubesMap = combinarClubesMap(...categorias.map(categoria => clubesPorCategoria.get(categoria) || []))

  let totalColecao = 0

  for (let page = 1; page <= paginas; page++) {
    const produtos = await rasparPagina(slug, page, clubesMap)

    if (produtos.length > 0) {
      // Se clube fixo, força o clube em todos os produtos
      const convertidos = clube
        ? produtos.map(p => ({ ...p, clube }))
        : produtos
      const filtrados = somenteIdentificados
        ? convertidos.filter(p => p.clube)
        : convertidos

      const salvos = await salvarProdutos(supabase, filtrados)
      totalColecao += salvos
      console.log(`  ✅ ${salvos} salvos (total: ${totalColecao})`)
    }

    if (page < paginas) await sleep(DELAY_MS)
  }

  return totalColecao
}

async function main() {
  console.log('🚀 Scraper — Manto Sagrado Camisas\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesPorCategoria = await carregarClubesMapPorCategoria(supabase)

  let totalGeral = 0
  for (const colecao of COLECOES) {
    totalGeral += await rasparColecao(colecao, clubesPorCategoria)
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)
