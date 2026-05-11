/**
 * Scraper experimental — OLX via GeckoAPI
 *
 * Teste sem salvar:
 *   node scraper-gecko-olx.js --query="camisa flamengo usada" --dry-run
 *
 * Salvar no Supabase:
 *   node scraper-gecko-olx.js --clubes=flamengo --max-paginas=2 --salvar
 */

import fetch from 'node-fetch'
import {
  criarSupabase,
  desativarProdutosDaFonte,
  salvarProdutos,
  relatorioFinal,
  extrairAno,
  carregarClubesBusca,
  identificarClube,
  normalizarTexto,
  sleep,
} from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'OLX'
const FONTE_URL = 'https://www.olx.com.br'
const GECKO_API_URL = 'https://api.geckoapi.com.br/v1/extract'
const MAX_PAGINAS_PADRAO = 1
const MAX_PAGINAS_LIMITE = 3
const PRECO_MINIMO_PADRAO = 250
const LOCATION_PADRAO = 'brasil'
const DELAY_MS = 1200
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
const ESTADOS_POR_CLUBE = {
  flamengo: ['RJ', 'SP'],
  fluminense: ['RJ', 'SP'],
  vasco: ['RJ', 'SP'],
  botafogo: ['RJ', 'SP'],
  'sao paulo': ['RJ', 'SP'],
  'são paulo': ['RJ', 'SP'],
  spfc: ['RJ', 'SP'],
  palmeiras: ['RJ', 'SP'],
  santos: ['RJ', 'SP'],
  corinthians: ['RJ', 'SP'],
  cruzeiro: ['RJ', 'MG'],
  'atletico-mg': ['RJ', 'MG'],
  'atletico mg': ['RJ', 'MG'],
  'atlético-mg': ['RJ', 'MG'],
  'atlético mg': ['RJ', 'MG'],
  'atletico mineiro': ['RJ', 'MG'],
  'atlético mineiro': ['RJ', 'MG'],
  gremio: ['RS'],
  grêmio: ['RS'],
  internacional: ['RS'],
  inter: ['RS'],
}

const supabase = criarSupabase()

function parseArgs() {
  const args = process.argv.slice(2)
  const valorArg = nome => args.find(arg => arg.startsWith(`--${nome}=`))?.replace(`--${nome}=`, '')
  const url = valorArg('url') || null
  const query = valorArg('query') || null
  const clubesSelecionados = (valorArg('clubes') || '')
    .split(',')
    .map(normalizarTexto)
    .filter(Boolean)

  return {
    query,
    url,
    clubesSelecionados,
    maxPaginas: Math.min(
      MAX_PAGINAS_LIMITE,
      Math.max(1, Number(valorArg('max-paginas') || MAX_PAGINAS_PADRAO) || MAX_PAGINAS_PADRAO)
    ),
    salvar: args.includes('--salvar'),
    semDesativar: args.includes('--sem-desativar'),
    filtrarCamisas: !args.includes('--sem-filtro-camisa'),
    debug: args.includes('--debug'),
    filtroPrecoApi: args.includes('--filtro-preco-api'),
    priceMin: valorArg('price-min') ? Number(valorArg('price-min')) : PRECO_MINIMO_PADRAO,
    priceMax: valorArg('price-max') ? Number(valorArg('price-max')) : null,
    city: valorArg('city') || null,
    state: valorArg('state') || null,
    todosEstados: args.includes('--todos-estados'),
    location: valorArg('location') || LOCATION_PADRAO,
    category: valorArg('category') || null,
    sort: valorArg('sort') || null,
  }
}

function parsePreco(valor) {
  if (typeof valor === 'number') return valor
  if (!valor) return null

  const preco = Number(String(valor)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.'))

  return Number.isFinite(preco) ? preco : null
}

function primeiroValor(...valores) {
  return valores.find(valor => valor !== undefined && valor !== null && valor !== '')
}

function primeiraImagem(item) {
  const imagens = primeiroValor(item.images, item.pictures, item.photos, item.media, item.gallery)
  if (Array.isArray(imagens)) {
    const primeira = imagens.find(Boolean)
    if (typeof primeira === 'string') return primeira
    return primeiroValor(
      primeira?.url,
      primeira?.webpUrl,
      primeira?.src,
      primeira?.imageUrl,
      primeira?.image,
      primeira?.thumbnail,
      primeira?.original,
      primeira?.originalUrl,
      primeira?.large,
      primeira?.largeUrl
    )
  }

  if (imagens && typeof imagens === 'object') {
    return primeiroValor(
      imagens.url,
      imagens.webpUrl,
      imagens.src,
      imagens.imageUrl,
      imagens.image,
      imagens.thumbnail,
      imagens.original,
      imagens.originalUrl,
      imagens.large,
      imagens.largeUrl
    )
  }

  const imagem = primeiroValor(item.imageUrl, item.thumbnail, item.picture, item.photo)
  if (imagem) return imagem

  if (typeof item.image === 'string') return item.image
  if (item.image && typeof item.image === 'object') {
    return primeiroValor(item.image.url, item.image.webpUrl, item.image.src, item.image.imageUrl, item.image.thumbnail)
  }

  return null
}

function tituloDoItem(item) {
  return primeiroValor(item.title, item.name, item.description, item.subject, '')
}

function linkDoItem(item) {
  return primeiroValor(item.url, item.link, item.permalink, item.canonicalUrl, '')
}

function precoDoItem(item) {
  return parsePreco(primeiroValor(
    item.price,
    item.priceValue,
    item.prices?.mainValue,
    item.prices?.value,
    item.value
  ))
}

function extrairItems(payload) {
  const data = payload?.data?.data || payload?.data || payload
  return primeiroValor(
    data?.items,
    data?.results,
    data?.ads,
    data?.listings,
    data?.products,
    []
  )
}

function pareceCamisa(titulo) {
  const texto = normalizarTexto(titulo)
  if (!/\bcamisa\b/.test(texto)) return false
  return !/\b(agasalho|bermuda|blusa|calca|calção|chuteira|conjunto|jaqueta|moletom|short|tenis)\b/.test(texto)
}

function pertenceAoClube(titulo, termos) {
  const texto = normalizarTexto(titulo)
  return termos.some(termo => texto.includes(normalizarTexto(termo)))
}

function converterItem(item, clube) {
  const titulo = tituloDoItem(item)

  return {
    titulo,
    link_original: linkDoItem(item),
    imagem_url: primeiraImagem(item) || null,
    preco: precoDoItem(item),
    clube: clube || identificarClube(titulo),
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: [],
    de_jogo: normalizarTexto(titulo).includes('jogo') || normalizarTexto(titulo).includes('match worn'),
    novidade: false,
    alta_procura: false,
  }
}

async function carregarBuscas(options) {
  const estados = options.todosEstados
    ? ESTADOS_BR
    : [options.state].filter(Boolean).map(estado => estado.toUpperCase())

  if (options.url) {
    return estados.length > 0
      ? estados.map(estado => ({ query: options.query || options.url, url: options.url, estado, clube: null, termos: [] }))
      : [{ query: options.query || options.url, url: options.url, estado: null, clube: null, termos: [] }]
  }

  if (options.query) {
    return estados.length > 0
      ? estados.map(estado => ({ query: options.query, url: null, estado, clube: null, termos: [] }))
      : [{ query: options.query, url: null, estado: null, clube: null, termos: [] }]
  }

  const clubes = await carregarClubesBusca(supabase, { usado: true })
  const filtrados = options.clubesSelecionados.length === 0
    ? clubes
    : clubes.filter(({ clube, aliases = [], termos = [] }) => {
      const nomes = [clube, ...aliases, ...termos].map(normalizarTexto)
      return options.clubesSelecionados.some(clubeSelecionado => nomes.includes(clubeSelecionado))
    })

  return filtrados.flatMap(({ clube, query, termos, aliases = [] }) => {
    const estadosClube = estados.length > 0 ? estados : estadosParaClube(clube, aliases)
    return estadosClube.map(estado => ({ clube, query, url: null, estado, termos }))
  })
}

function estadosParaClube(clube, aliases = []) {
  const chaves = [clube, ...aliases].map(normalizarTexto)
  for (const chave of chaves) {
    const estados = ESTADOS_POR_CLUBE[chave]
    if (estados) return estados
  }

  throw new Error(`Defina UFs para "${clube}" em ESTADOS_POR_CLUBE ou rode com --state=UF.`)
}

function montarUrlBusca(busca, page, options) {
  if (busca.url) {
    const url = new URL(busca.url)
    if (!url.searchParams.has('o')) url.searchParams.set('o', String(page))
    if (options.priceMin !== null && !url.searchParams.has('ps')) url.searchParams.set('ps', String(options.priceMin))
    if (options.priceMax !== null && !url.searchParams.has('pe')) url.searchParams.set('pe', String(options.priceMax))
    return url
  }

  const location = busca.estado ? `estado-${busca.estado.toLowerCase()}` : (options.location || LOCATION_PADRAO)
  const url = new URL(`${FONTE_URL}/${location}`)
  url.searchParams.set('q', busca.query)
  url.searchParams.set('o', String(page))

  if (options.priceMin !== null) url.searchParams.set('ps', String(options.priceMin))
  if (options.priceMax !== null) url.searchParams.set('pe', String(options.priceMax))

  return url
}

function montarPayload(busca, page, options) {
  const url = montarUrlBusca(busca, page, options)
  const payload = {
    target: 'olx.com.br',
    type: 'plp',
    url: url.toString(),
  }

  if (options.city || options.state || options.category || options.sort) {
    return {
      ...payload,
      keyword: busca.query,
      page,
      ...(options.city ? { city: options.city } : {}),
      ...(busca.estado ? { state: busca.estado } : {}),
      ...(options.category ? { category: options.category } : {}),
      ...(options.sort ? { sort: options.sort } : {}),
    }
  }

  return payload
}

async function chamarGecko(payload) {
  if (!process.env.GECKO_API_KEY) {
    throw new Error('Configure GECKO_API_KEY no .env para usar o scraper OLX via GeckoAPI.')
  }

  const res = await fetch(GECKO_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GECKO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await res.text()
  let data = null
  try {
    data = JSON.parse(body)
  } catch {
    data = { raw: body }
  }

  if (!res.ok) {
    const detalhe = data?.message || data?.error || data?.errorCode || JSON.stringify(data?.details || data)
    throw new Error(`GeckoAPI retornou status ${res.status}: ${detalhe}`)
  }

  return data
}

function filtrarProdutos(produtos, busca, options) {
  return produtos.filter(produto => {
    if (!produto.titulo || !produto.link_original) return false
    if (options.filtrarCamisas && !pareceCamisa(produto.titulo)) return false
    if (busca.termos?.length && !pertenceAoClube(produto.titulo, busca.termos)) return false
    if (options.priceMin !== null && produto.preco !== null && produto.preco < options.priceMin) return false
    if (options.priceMax !== null && produto.preco !== null && produto.preco > options.priceMax) return false
    return true
  })
}

function diagnosticarPrimeiroItem(items) {
  const item = items[0]
  if (!item) return

  console.log('  Debug primeiro item:')
  console.log(JSON.stringify(item, null, 2).slice(0, 3000))
}

async function rasparBusca(busca, options) {
  console.log(`\n🔎 OLX${busca.estado ? ` ${busca.estado}` : ''} — "${busca.query}"`)

  let totalBusca = 0

  for (let page = 1; page <= options.maxPaginas; page++) {
    const payload = montarPayload(busca, page, options)
    console.log(`  URL consultada: ${payload.url}`)
    const data = await chamarGecko(payload)
    const items = extrairItems(data)
    if (options.debug) diagnosticarPrimeiroItem(items)
    const produtos = filtrarProdutos(items.map(item => converterItem(item, busca.clube)), busca, options)

    console.log(`  Página ${page}: ${items.length} recebidos, ${produtos.length} aprovados`)
    produtos.slice(0, 5).forEach((produto, index) => {
      console.log(`     ${index + 1}. ${produto.titulo} — R$ ${produto.preco ?? 's/preço'}`)
    })

    if (produtos.length === 0) break

    if (options.salvar) {
      const salvos = await salvarProdutos(supabase, produtos)
      totalBusca += salvos
      console.log(`  ✅ ${salvos} salvos`)
    } else {
      totalBusca += produtos.length
      console.log('  Modo teste: nada foi salvo no banco.')
    }

    await sleep(DELAY_MS)
  }

  return totalBusca
}

async function main() {
  const options = parseArgs()
  if ((options.query || options.url) && !options.state && !options.todosEstados) {
    throw new Error('A GeckoAPI exige uma UF para OLX. Use --state=RJ, --todos-estados ou rode por --clubes para usar o mapa de UFs.')
  }

  if (!options.query && !options.url && !options.state && !options.todosEstados) {
    console.log('Sem --state: usando o mapa de UFs por clube quando aplicável.')
  }

  const buscas = await carregarBuscas(options)

  if (buscas.length === 0) throw new Error('Nenhuma busca encontrada para os filtros informados.')

  console.log(`🚀 Scraper — OLX via GeckoAPI${options.salvar ? '' : ' (dry-run)'}\n`)
  console.log(`Buscas: ${buscas.map(busca => busca.query).join(', ')}`)
  if (options.url) console.log(`URL pronta: ${options.url}`)
  console.log(`Páginas por busca: ${options.maxPaginas}`)
  console.log(`UFs: ${Array.from(new Set(buscas.map(busca => busca.estado).filter(Boolean))).join(', ')}`)
  if (options.priceMin !== null) console.log(`Preço mínimo: R$ ${options.priceMin}`)
  if (options.priceMax !== null) console.log(`Preço máximo: R$ ${options.priceMax}`)
  if (!options.salvar) console.log('Use --salvar para gravar no Supabase.')

  if (options.salvar && !options.semDesativar) {
    await desativarProdutosDaFonte(supabase, FONTE_NOME)
  }

  let totalGeral = 0
  for (const busca of buscas) {
    totalGeral += await rasparBusca(busca, options)
    await sleep(DELAY_MS)
  }

  if (options.salvar) {
    await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${options.salvar ? 'salvos' : 'encontrados'}.`)
}

main().catch(error => {
  console.error(error.message || error)
  process.exitCode = 1
})
