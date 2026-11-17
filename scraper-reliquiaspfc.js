/**
 * Relíquia SPFC (Nuvemshop).
 * node scraper-reliquiaspfc.js --dry-run
 * Só altera o catálogo após percorrer todas as páginas com sucesso.
 */
import { pathToFileURL } from 'node:url'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import {
  criarSupabase, registrarFonte, salvarProdutos, relatorioFinal, extrairAno, sleep,
} from './scraper-utils.js'

const BASE_URL = 'https://reliquiaspfc.com.br'
const FONTE_NOME = 'Relíquia SPFC'
const TAMANHO_LOTE = 100

function urlProduto(href) {
  const url = new URL(href, BASE_URL)
  if (url.origin !== BASE_URL || !/^\/produtos\/[^/]+\/?$/.test(url.pathname)) {
    throw new Error(`Link de produto inesperado: ${href}`)
  }
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function extrairPagina(html) {
  const $ = cheerio.load(html)
  const total = Number(html.match(/LS\.productsCount\s*=\s*(\d+)/)?.[1])
  if (!Number.isInteger(total) || total < 0) throw new Error('Total do catálogo não identificado.')
  const cards = $('.js-product-table .js-item-product')
  if (!cards.length) {
    if ($('.category-body').text().includes('Não temos resultados para sua pesquisa')) {
      return { links: [], produtos: [], total }
    }
    throw new Error('Catálogo sem a estrutura esperada; coleta interrompida.')
  }

  const links = []
  const produtos = []
  cards.each((_, el) => {
    const card = $(el)
    const titulo = card.find('.js-item-name').first().text().trim()
    const href = card.find('a.js-product-item-image-link-private').first().attr('href')
    if (!titulo || !href) throw new Error('Produto sem título ou link; coleta interrompida.')
    const link = urlProduto(href)
    links.push(link)
    if (!/\bcamisa\b/i.test(titulo)) return

    const raw = card.find('.js-product-container[data-variants]').first().attr('data-variants')
    const variantes = JSON.parse(raw || 'null')
    if (!Array.isArray(variantes) || !variantes.length || variantes.some(v => typeof v.available !== 'boolean')) {
      throw new Error(`Estoque não identificado: ${titulo}`)
    }
    const disponiveis = variantes.filter(v => v.available && v.is_visible !== false)
    if (!disponiveis.length) return

    const precificadas = disponiveis.filter(v => !v.contact)
    const precos = precificadas.map(v => Number(v.price_number ?? v.price_number_raw / 100))
    if (precos.some(preco => !Number.isFinite(preco) || preco <= 0)) {
      throw new Error(`Preço inválido: ${titulo}`)
    }
    // A loja também publica camisas disponíveis com preço sob consulta.
    const preco = precos.length ? Math.min(...precos) : null
    const variante = preco === null ? disponiveis[0] : precificadas[precos.indexOf(preco)]
    const img = card.find('img.js-item-image').first()
    const imagem = variante.image_url || img.attr('data-src') || img.attr('src')
    if (!imagem || imagem.startsWith('data:')) throw new Error(`Imagem não identificada: ${titulo}`)
    const imagemUrl = new URL(imagem, BASE_URL)
    if (!['http:', 'https:'].includes(imagemUrl.protocol)) throw new Error(`Imagem inválida: ${titulo}`)

    produtos.push({
      titulo,
      link_original: link,
      imagem_url: imagemUrl.toString(),
      preco,
      clube: 'São Paulo',
      ano: extrairAno(titulo),
      fonte_nome: FONTE_NOME,
      fonte_url: BASE_URL,
      tags: [],
      novidade: false,
      alta_procura: false,
    })
  })
  return { links, produtos, total }
}

async function buscarHtml(url) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (error) {
      if (tentativa === 3) throw new Error(`Falha em ${url}: ${error.message}`)
      await sleep(2000 * tentativa)
    }
  }
}

export async function coletarCatalogo({ buscar = buscarHtml, esperar = sleep, maxPaginas = 1000 } = {}) {
  const vistos = new Set()
  const produtos = new Map()
  let totalEsperado
  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const url = new URL('/produtos/', BASE_URL)
    url.searchParams.set('sort_by', 'created-descending')
    url.searchParams.set('page', String(pagina))
    const resultado = extrairPagina(await buscar(url.toString()))
    totalEsperado ??= resultado.total
    if (!resultado.links.length) {
      if (resultado.total !== 0 && resultado.total !== totalEsperado) throw new Error('Catálogo mudou durante a coleta; tente novamente.')
      if (vistos.size !== totalEsperado) throw new Error(`Coleta incompleta: ${vistos.size} de ${totalEsperado} itens.`)
      if (!produtos.size) throw new Error('Nenhuma camisa disponível; catálogo existente preservado.')
      console.log(`📊 ${pagina - 1} páginas, ${vistos.size} itens, ${produtos.size} camisas disponíveis.`)
      return [...produtos.values()]
    }
    if (resultado.total !== totalEsperado) throw new Error('Catálogo mudou durante a coleta; tente novamente.')
    const novos = resultado.links.filter(link => !vistos.has(link))
    if (!novos.length) throw new Error(`Página ${pagina} repetida; catálogo existente preservado.`)
    resultado.links.forEach(link => vistos.add(link))
    resultado.produtos.forEach(produto => produtos.set(produto.link_original, produto))
    console.log(`  Página ${pagina}: ${resultado.links.length} itens, ${resultado.produtos.length} camisas disponíveis.`)
    await esperar(500)
  }
  throw new Error(`Limite de ${maxPaginas} páginas atingido; catálogo existente preservado.`)
}

async function buscarFonte(supabase) {
  const { data, error } = await supabase.from('fontes').select('id,ativa').eq('nome', FONTE_NOME).maybeSingle()
  if (error) throw new Error(`Erro ao consultar fonte: ${error.message}`)
  return data
}

export async function sincronizarCatalogo(supabase, produtos, { salvar = salvarProdutos } = {}) {
  if (!produtos.length) throw new Error('Catálogo vazio; sincronização cancelada.')
  const fonte = await buscarFonte(supabase)
  if (fonte?.ativa === false) {
    console.log('⏸️ Fonte inativa no CMS. Scraping ignorado.')
    return
  }
  await registrarFonte(supabase, FONTE_NOME, BASE_URL)
  if (!await buscarFonte(supabase)) throw new Error('Não foi possível cadastrar a fonte.')

  // Guarda os IDs antes do upsert para retirar apenas os anúncios ausentes.
  const encontrados = new Set(produtos.map(p => p.link_original))
  const ausentes = []
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabase.from('produtos').select('id,link_original')
      .eq('fonte_nome', FONTE_NOME).eq('ativo', true).order('id').range(inicio, inicio + 999)
    if (error) throw new Error(`Erro ao consultar catálogo atual: ${error.message}`)
    ausentes.push(...data.filter(p => !encontrados.has(p.link_original)).map(p => p.id))
    if (data.length < 1000) break
  }

  for (let i = 0; i < produtos.length; i += TAMANHO_LOTE) {
    const lote = produtos.slice(i, i + TAMANHO_LOTE)
    if (await salvar(supabase, lote) !== lote.length) {
      throw new Error('Falha ao salvar produtos; anúncios anteriores não foram desativados.')
    }
  }
  const agora = new Date().toISOString()
  for (let i = 0; i < ausentes.length; i += TAMANHO_LOTE) {
    const { error } = await supabase.from('produtos')
      .update({ ativo: false, inactivated_at: agora, updated_at: agora })
      .eq('fonte_nome', FONTE_NOME).in('id', ausentes.slice(i, i + TAMANHO_LOTE))
    if (error) throw new Error(`Erro ao desativar ausentes: ${error.message}`)
  }
  console.log(`✅ ${produtos.length} camisas salvas; ${ausentes.length} anúncios ausentes desativados.`)
  await relatorioFinal(supabase, FONTE_NOME)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`🚀 Relíquia SPFC${dryRun ? ' (dry-run, sem alterações no banco)' : ''}`)
  const supabase = dryRun ? null : criarSupabase()
  if (supabase && (await buscarFonte(supabase))?.ativa === false) {
    console.log('⏸️ Fonte inativa no CMS. Scraping ignorado.')
    return
  }
  const produtos = await coletarCatalogo()
  if (dryRun) {
    produtos.slice(0, 5).forEach(p => console.log(`  ${p.titulo} — ${p.preco === null ? 'sob consulta' : `R$ ${p.preco.toFixed(2)}`}`))
  } else {
    await sincronizarCatalogo(supabase, produtos)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('❌', error.message)
    process.exitCode = 1
  })
}
