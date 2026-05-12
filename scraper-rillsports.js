/**
 * Scraper — Rill Sports (Tray Commerce)
 * Roda com: node scraper-rillsports.js
 *
 * Coleções rastreadas:
 *   - /futebol-nacional          → clubes nacionais, identificação automática
 *   - /futebol/camisas-de-futebol → seleções + clubes estrangeiros misturados
 *     → filtra pelo segmento de URL: só aceita slugs que batem com seleções conhecidas
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

const FONTE_NOME = 'Rill Sports'
const FONTE_URL  = 'https://www.rillsports.com.br'
const DELAY_MS   = 1500
const MAX_ERROS  = 3  // páginas consecutivas sem clube identificado

const supabase = criarSupabase()

const CATEGORIAS = [
  { path: '/futebol-nacional',          clube: null, filtroSelecao: false },
  { path: '/futebol/camisas-de-futebol', clube: null, filtroSelecao: true  },
]

// Slugs espelhados do SELECOES_MAP do scraper-utils.js (versão sem acentos, formato URL Tray).
// Serve apenas para descartar clubes estrangeiros (barcelona, clubes-sul-americanos, etc.)
// que aparecem misturados na categoria /futebol/camisas-de-futebol da Rill Sports.
// Se a Rill adicionar nova seleção com slug diferente, incluir aqui.
const SELECOES_SLUGS = new Set([
  'brasil', 'argentina', 'uruguai', 'chile', 'colombia', 'paraguai',
  'peru', 'equador', 'mexico', 'estados-unidos', 'canada',
  'alemanha', 'espanha', 'franca', 'inglaterra', 'italia',
  'holanda', 'portugal', 'belgica', 'croacia',
  'japao', 'coreia',
  'nigeria', 'camaroes', 'marrocos',
  'selecoes',  // subcategoria genérica da Rill, se existir
])

// Extrai o slug de seleção da URL da Rill Sports.
// Ex: ".../futebol/camisas-de-futebol/brasil/camisa-..." → "brasil"
//     ".../futebol/camisas-de-futebol/selecoes/chile/..." → "chile"
function extrairSlugSelecao(link) {
  const match = link.match(/\/camisas-de-futebol\/(?:selecoes\/)?([^/]+)\//)
  return match ? match[1] : null
}

// Padrões de competição que contêm nomes de seleções mas NÃO são seleções.
// Ex: "Copa do Brasil", "Libertadores", "Copa America" no título de um clube nacional.
const FALSOS_POSITIVOS = /copa do brasil|libertadores|sul-americana|conmebol/i

// Wrapper que descarta falsos positivos antes de identificar seleção pelo título.
function identificarSelecaoSegura(titulo, clubesMap) {
  if (FALSOS_POSITIVOS.test(titulo)) return null
  return identificarClube(titulo, clubesMap)
}

async function rasparPagina(path, page) {
  // Tray Commerce usa ?pg=N (igual ao Mundo da Bola)
  const url = `${FONTE_URL}${path}?pg=${page}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': FONTE_URL,
      },
      timeout: 15000,
      redirect: 'follow',
    })
    if (!res.ok) { console.warn(`  ⚠️  Status ${res.status} em ${url}`); return [] }
    // node-fetch às vezes ignora o charset do Content-Type e decodifica como latin-1.
    // Lê os bytes raw e decodifica forçando UTF-8.
    const buffer = Buffer.from(await res.arrayBuffer())
    const html = buffer.toString('latin1')
    const $ = cheerio.load(html)
    const produtos = []

    $('div.product').each((_, el) => {
      try {
        // Tray: título e link no .product-info > .product-name e no href do <a>
        const titulo = $(el).find('.product-name').text().trim()
        const linkRel = $(el).find('a.space-image').attr('href')
          || $(el).find('a.product-info').attr('href')
          || $(el).find('a.product-button').attr('href')
        const link = linkRel
          ? (linkRel.startsWith('http') ? linkRel : FONTE_URL + linkRel)
          : null

        // Imagem: primeiro <img> com data-src ou src (Tray usa lazyload)
        const imgEl = $(el).find('img.lazyload').first()
        const imagem = imgEl.attr('data-src') || imgEl.attr('src') || null

        // Preço: texto do .current-price, limpa "R$ " e converte
        const precoTexto = $(el).find('.current-price').first().text().trim()
        const preco = precoTexto
          ? parseFloat(precoTexto.replace(/[R$\s.]/g, '').replace(',', '.'))
          : null

        // Ignora produtos sem título ou link
        if (!titulo || !link) return

        // Ignora se explicitamente marcado como indisponível
        // (Tray não tem classe padrão; verifica se botão de compra não existe)
        const temBotao = $(el).find('.product-button, a.product-button').length > 0
        if (!temBotao) return

        produtos.push({ titulo, link, imagem, preco })
      } catch (e) {
        console.warn('  ⚠️  Erro ao parsear produto:', e.message)
      }
    })

    return produtos
  } catch (err) {
    console.warn(`  ⚠️  Erro ao buscar página ${page}: ${err.message}`)
    return []
  }
}

async function rasparCategoria({ path, clube, filtroSelecao }, clubesMap) {
  console.log(`\n⚽ ${clube || path}`)
  let page = 1
  let errosSemClube = 0
  let totalCategoria = 0

  while (true) {
    const items = await rasparPagina(path, page)

    if (items.length === 0) {
      console.log(`  ℹ️  Página ${page} vazia — fim da coleção`)
      break
    }

    const produtos = []
    let descartados = 0

    for (const { titulo, link, imagem, preco } of items) {
      let clubeIdentificado

      if (filtroSelecao) {
        // Categoria mista: usa slug da URL para identificar a seleção
        // e descarta qualquer produto que não seja seleção conhecida
        const slug = extrairSlugSelecao(link)
        if (!slug || !SELECOES_SLUGS.has(slug)) {
          descartados++
          continue
        }
        // Nome canônico resolvido pelo título; filtra falsos positivos (Copa do Brasil etc.)
        clubeIdentificado = identificarSelecaoSegura(titulo, clubesMap)
      } else {
        // Categoria de clubes nacionais: identificação pelo título
        clubeIdentificado = clube || identificarClube(titulo, clubesMap)
      }

      if (!clubeIdentificado) continue

      produtos.push({
        titulo,
        link_original: link,
        imagem_url: imagem,
        preco,
        clube: clubeIdentificado,
        ano: extrairAno(titulo),
        fonte_nome: FONTE_NOME,
        fonte_url: FONTE_URL,
        tags: [],
        de_jogo: /\bjogo\b/i.test(titulo),
        novidade: false,
        alta_procura: false,
      })
    }

    if (descartados > 0) {
      console.log(`  🚫 Página ${page} — ${descartados} estrangeiros descartados`)
    }

    if (produtos.length === 0) {
      // Na categoria mista (filtroSelecao), páginas só com estrangeiros são normais —
      // só conta erro se a página veio completamente vazia (sem nenhum produto).
      if (!filtroSelecao || descartados === 0) {
        errosSemClube++
        console.log(`  ⚠️  Página ${page} — nenhum clube identificado (${errosSemClube}/${MAX_ERROS})`)
        if (errosSemClube >= MAX_ERROS) break
      } else {
        console.log(`  >> Página ${page} — so estrangeiros, continuando...`)
      }
    } else {
      errosSemClube = 0
      if (DRY_RUN) {
        console.log(`  🧪 Página ${page} — ${produtos.length} produtos encontrados (dry-run, não salvo)`)
        produtos.slice(0, 3).forEach(p => console.log(`     · [${p.clube || '?'}] ${p.titulo} — R$${p.preco}`))
        totalCategoria += produtos.length
      } else {
        const salvos = await salvarProdutos(supabase, produtos)
        totalCategoria += salvos
        console.log(`  ✅ Página ${page} — ${items.length} encontrados, ${salvos} salvos (total: ${totalCategoria})`)
      }
    }

    if (page >= MAX_PAGINAS) break
    page++
    await sleep(DELAY_MS)
  }

  return totalCategoria
}

const DRY_RUN = process.argv.includes('--dry-run')
const MAX_PAGINAS = (() => {
  const flag = process.argv.find(a => a.startsWith('--max-paginas='))
  return flag ? parseInt(flag.split('=')[1]) : Infinity
})()

async function main() {
  if (DRY_RUN) console.log('🧪 MODO DRY-RUN — nenhum dado será salvo no banco\n')
  console.log('🚀 Scraper — Rill Sports\n')

  if (!DRY_RUN) await desativarProdutosDaFonte(supabase, FONTE_NOME)
  const clubesMap = await carregarClubesMap(supabase)

  let totalGeral = 0
  for (const categoria of CATEGORIAS) {
    totalGeral += await rasparCategoria(categoria, clubesMap)
    await sleep(DELAY_MS)
  }

  if (!DRY_RUN) await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos${DRY_RUN ? ' encontrados (dry-run)' : ' ativos'}.`)
}

main().catch(console.error)