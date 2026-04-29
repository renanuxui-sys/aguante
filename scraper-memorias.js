/**
 * Scraper — Memórias do Esporte Oficial
 * Roda com: node scraper-memorias.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL    = 'https://memoriasdoesporteoficial.com.br/categoria-produto/futebol/brasil'
const FONTE_NOME  = 'Memórias do Esporte'
const FONTE_URL   = 'https://memoriasdoesporteoficial.com.br'
const TOTAL_PAGINAS = 107
const DELAY_MS    = 1500

const supabase = criarSupabase()

function limparPreco(texto) {
  if (!texto) return null
  const match = texto.replace(/\./g, '').replace(',', '.').match(/[\d]+\.?\d*/)
  return match ? parseFloat(match[0]) : null
}

async function rasparPagina(pagina) {
  const url = pagina === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${pagina}/`
  console.log(`  📄 Página ${pagina}/${TOTAL_PAGINAS}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }

    const html = await res.text()
    const $ = cheerio.load(html)
    const produtos = []

    $('ul.products li.product').each((_, el) => {
      const $el      = $(el)
      const titulo   = $el.find('h2').text().trim()
      const link     = $el.find('a.woocommerce-loop-product__link').attr('href') || ''
      const imgSrc   = $el.find('img').attr('src') || ''
      const imgData  = $el.find('img').attr('data-src') || ''
      const imagem   = (!imgSrc.startsWith('data:') && imgSrc) ? imgSrc : (!imgData.startsWith('data:') && imgData) ? imgData : null
      const precoTxt = $el.find('.price ins .amount, .price .amount').first().text().trim()

      if (!titulo || !link) return

      produtos.push({
        titulo,
        link_original: link,
        imagem_url: imagem,
        preco: limparPreco(precoTxt),
        clube: identificarClube(titulo),
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

async function main() {
  console.log('🚀 Scraper — Memórias do Esporte\n')

  // 1. Desativa todos os produtos desta fonte antes de começar
  await desativarProdutosDaFonte(supabase, FONTE_NOME)

  let totalSalvos = 0
  let erros = 0

  for (let pagina = 1; pagina <= TOTAL_PAGINAS; pagina++) {
    const produtos = await rasparPagina(pagina)

    if (produtos.length > 0) {
      const salvos = await salvarProdutos(supabase, produtos)
      totalSalvos += salvos
      console.log(`  ✅ ${salvos} salvos (total: ${totalSalvos})`)
      erros = 0
    } else {
      erros++
      if (erros >= 5) { console.log('\n⛔ Muitas páginas com erro. Encerrando.'); break }
    }

    if (pagina < TOTAL_PAGINAS) await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalSalvos)
  console.log(`\n✅ Concluído! ${totalSalvos} produtos ativos.`)
}

main().catch(console.error)