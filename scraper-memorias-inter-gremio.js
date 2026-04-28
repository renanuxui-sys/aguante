/**
 * Scraper — Internacional e Grêmio (Memórias do Esporte)
 * Roda com: node scraper-inter-gremio.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const FONTE_NOME = 'Memórias do Esporte'
const FONTE_URL  = 'https://memoriasdoesporteoficial.com.br'
const DELAY_MS   = 1500

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const FONTES = [
  {
    nome: 'Internacional',
    clube: 'Internacional',
    base: 'https://memoriasdoesporteoficial.com.br/categoria-produto/futebol/internacional',
    paginas: 19,
  },
  {
    nome: 'Grêmio',
    clube: 'Grêmio',
    base: 'https://memoriasdoesporteoficial.com.br/categoria-produto/futebol/gremio',
    paginas: 14,
  },
]

function extrairAno(titulo) {
  const match = titulo.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return match ? match[1] : null
}

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rasparPagina(base, pagina, clube) {
  const url = pagina === 1 ? `${base}/` : `${base}/page/${pagina}/`
  console.log(`  📄 Página ${pagina}: ${url}`)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) {
      console.warn(`  ⚠️  Status ${res.status}, pulando...`)
      return []
    }

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
        ativo: true,
      })
    })

    return produtos
  } catch (err) {
    console.warn(`  ⚠️  Erro: ${err.message}`)
    return []
  }
}

async function salvarProdutos(produtos) {
  if (produtos.length === 0) return 0

  const { data, error } = await supabase
    .from('produtos')
    .upsert(produtos, { onConflict: 'link_original', ignoreDuplicates: false })
    .select('id')

  if (error) {
    console.error('  ❌ Erro ao salvar:', error.message)
    return 0
  }

  return data?.length || 0
}

async function main() {
  console.log('🚀 Scraper — Internacional e Grêmio\n')

  let totalGeral = 0

  for (const fonte of FONTES) {
    console.log(`\n⚽ Raspando: ${fonte.nome} (${fonte.paginas} páginas)`)

    let totalFonte = 0

    for (let pagina = 1; pagina <= fonte.paginas; pagina++) {
      const produtos = await rasparPagina(fonte.base, pagina, fonte.clube)

      if (produtos.length > 0) {
        const salvos = await salvarProdutos(produtos)
        totalFonte += salvos
        console.log(`  ✅ ${salvos} salvos (total ${fonte.nome}: ${totalFonte})`)
      }

      if (pagina < fonte.paginas) await sleep(DELAY_MS)
    }

    console.log(`\n  ✅ ${fonte.nome} concluído: ${totalFonte} produtos`)
    totalGeral += totalFonte
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos novos salvos.`)
}

main().catch(console.error)
