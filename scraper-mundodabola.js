/**
 * Scraper — Mundo da Bola Loja
 * Roda com: node scraper-mundodabola.js
 * Para automaticamente quando não encontrar produtos por 3 páginas seguidas.
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, identificarClube, sleep } from './scraper-utils.js'
import 'dotenv/config'

const BASE_URL   = 'https://www.mundodabolaloja.com.br'
const FONTE_NOME = 'Mundo da Bola'
const FONTE_URL  = BASE_URL
const DELAY_MS   = 1500

const supabase = criarSupabase()

async function rasparPagina(page) {
  const url = `${BASE_URL}/futebol-nacional?pg=${page}`
  console.log(`  📄 Página ${page}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status}`); return [] }

    const html = await res.text()
    const $ = cheerio.load(html)
    const produtos = []

    $('div.product').each((_, el) => {
      const $el    = $(el)
      const titulo = $el.attr('data-ga4-name') || ''
      const preco  = parseFloat($el.attr('data-ga4-price') || '0') || null
      const link   = $el.find('a.space-image').attr('href') || ''
      const imagem = $el.find('img.lazyload').attr('src') || null

      if (!titulo || !link) return

      // Só salva se identificar clube brasileiro
      const clube = identificarClube(titulo)
      if (!clube) return

      produtos.push({
        titulo,
        link_original: link.startsWith('http') ? link : `${BASE_URL}${link}`,
        imagem_url: imagem,
        preco,
        clube,
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
  console.log('🚀 Scraper — Mundo da Bola\n')

  await desativarProdutosDaFonte(supabase, FONTE_NOME)

  let totalSalvos = 0
  let page = 1
  let erros = 0

  while (true) {
    const produtos = await rasparPagina(page)

    if (produtos.length > 0) {
      const salvos = await salvarProdutos(supabase, produtos)
      totalSalvos += salvos
      console.log(`  ✅ ${salvos} salvos (total: ${totalSalvos})`)
      erros = 0
    } else {
      erros++
      if (erros >= 3) {
        console.log(`\n⏹️  Sem produtos por ${erros} páginas seguidas. Encerrando.`)
        break
      }
    }

    page++
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalSalvos)
  console.log(`\n🏁 Concluído! Total geral: ${totalSalvos} produtos salvos.`)
}

main().catch(console.error)