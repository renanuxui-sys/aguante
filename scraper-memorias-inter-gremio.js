/**
 * Scraper — Internacional e Grêmio (Memórias do Esporte)
 * Roda com: node scraper-memorias-inter-gremio.js
 * Para automaticamente quando não encontrar produtos por 3 páginas seguidas.
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, salvarProdutos, relatorioFinal, extrairAno, sleep } from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Memórias do Esporte'
const FONTE_URL  = 'https://memoriasdoesporteoficial.com.br'
const DELAY_MS   = 1500

const supabase = criarSupabase()

const FONTES = [
  {
    nome: 'Internacional',
    clube: 'Internacional',
    base: 'https://memoriasdoesporteoficial.com.br/categoria-produto/futebol/internacional',
  },
  {
    nome: 'Grêmio',
    clube: 'Grêmio',
    base: 'https://memoriasdoesporteoficial.com.br/categoria-produto/futebol/gremio',
  },
]

function limparPreco(texto) {
  if (!texto) return null
  const match = texto.replace(/\./g, '').replace(',', '.').match(/[\d]+\.?\d*/)
  return match ? parseFloat(match[0]) : null
}

function imagemInvalida(url) {
  if (!url) return true
  if (url.startsWith('data:')) return true
  if (url.includes('svg+xml')) return true
  return false
}

async function rasparPagina(base, pagina, clube) {
  const url = pagina === 1 ? `${base}/` : `${base}/page/${pagina}/`
  console.log(`  📄 Página ${pagina}`)

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
      const imagem   = !imagemInvalida(imgSrc) ? imgSrc : (!imagemInvalida(imgData) ? imgData : null)
      const precoTxt = $el.find('.price ins .amount, .price .amount').first().text().trim()

      if (!titulo || !link) return

      produtos.push({
        titulo,
        link_original: link,
        imagem_url: imagem,
        preco: limparPreco(precoTxt),
        clube,
        ano: extrairAno(titulo),
        fonte_nome: FONTE_NOME,
        fonte_url: FONTE_URL,
        tags: [],
        de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('match'),
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

async function rasparFonte({ nome, clube, base }) {
  console.log(`\n⚽ ${nome}`)

  let pagina = 1
  let totalFonte = 0
  let erros = 0

  while (true) {
    const produtos = await rasparPagina(base, pagina, clube)

    if (produtos.length > 0) {
      const salvos = await salvarProdutos(supabase, produtos)
      totalFonte += salvos
      console.log(`  ✅ ${salvos} salvos (total ${nome}: ${totalFonte})`)
      erros = 0
    } else {
      erros++
      if (erros >= 3) {
        console.log(`  ⏹️  Sem produtos por ${erros} páginas. Encerrando ${nome}.`)
        break
      }
    }

    pagina++
    await sleep(DELAY_MS)
  }

  return totalFonte
}

async function main() {
  console.log('🚀 Scraper — Internacional e Grêmio (Memórias do Esporte)\n')

  // Nota: NÃO desativa aqui — o scraper-memorias.js já faz isso.
  // Para rodar isolado, descomente:
  // await desativarProdutosDaFonte(supabase, FONTE_NOME)

  let totalGeral = 0
  for (const fonte of FONTES) {
    totalGeral += await rasparFonte(fonte)
    await sleep(DELAY_MS)
  }

  await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos salvos.`)
}

main().catch(console.error)