/**
 * Automação Netshoes via Rakuten Advertising.
 *
 * Teste sem gravar:
 *   node netshoes-rakuten.js --dry-run
 *
 * Diagnóstico de busca/filtros:
 *   node netshoes-rakuten.js --diagnostico --diagnostico-clube=Internacional --diagnostico-busca="internacional ii 26 27 adidas"
 *
 * Execução real:
 *   node netshoes-rakuten.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { criarSupabase, normalizarTexto, sleep } from './scraper-utils.js'
import 'dotenv/config'

const PRODUCT_SEARCH_URL = 'https://api.linksynergy.com/productsearch/1.0'
const COUPON_URL = 'https://api.linksynergy.com/coupon/1.0'
const DEEP_LINK_URL = 'https://api.linksynergy.com/v1/links/deep_links'
const NETSHOES_URL = 'https://www.netshoes.com.br'
const LOJA = 'Netshoes'
const ORIGEM = 'rakuten-netshoes'
const DELAY_MS = 700
const DEFAULT_CUPOM_CODIGO = process.env.NETSHOES_DEFAULT_COUPON_CODE || 'AGUANTE'
const DEFAULT_CUPOM_PERCENTUAL = Number(process.env.NETSHOES_DEFAULT_COUPON_PERCENT || 15)
const DEFAULT_CUPOM_DESCONTO_MAXIMO = valorDinheiro(process.env.NETSHOES_DEFAULT_COUPON_MAX_DISCOUNT)
const DEFAULT_CUPOM_VARIAVEL = process.env.NETSHOES_DEFAULT_COUPON_VARIABLE === 'true'
const DEFAULT_CUPOM_DESCRICAO = process.env.NETSHOES_DEFAULT_COUPON_DESCRIPTION || 'Cupom não válido para produtos com tag SELEÇÃO'
const MAX_POR_CLUBE = Math.max(1, Number(process.env.NETSHOES_MAX_OFFERS_PER_CLUB || 48))
const RESULTADOS_POR_BUSCA = Math.min(100, Math.max(1, Number(process.env.NETSHOES_SEARCH_MAX || 100)))
let accessTokenCache = null

const LINHAS_OFICIAIS_BUSCA = ['i', 'ii', 'iii']
const TEMPORADAS_PRIORITARIAS = temporadasPrioritarias()

const MARCAS_OFICIAIS = [
  'adidas',
  'nike',
  'puma',
  'umbro',
  'kappa',
  'new balance',
  'penalty',
  'volt',
  'reebok',
  'fila',
  'mizuno',
  'under armour',
  'lotto',
  'super bolla',
  'le coq',
]

const CLUBES = [
  { nome: 'Flamengo', buscas: ['flamengo adidas', 'flamengo'], termos: ['flamengo'], marcas: ['adidas'] },
  { nome: 'Corinthians', buscas: ['corinthians nike', 'corinthians'], termos: ['corinthians'], marcas: ['nike'] },
  { nome: 'Palmeiras', buscas: ['palmeiras puma', 'palmeiras'], termos: ['palmeiras'], marcas: ['puma'] },
  { nome: 'São Paulo', buscas: ['sao paulo new balance', 'sao paulo'], termos: ['sao paulo', 'são paulo'], marcas: ['new balance'] },
  { nome: 'Grêmio', buscas: ['gremio umbro', 'gremio'], termos: ['gremio', 'grêmio'], marcas: ['umbro', 'new balance'] },
  {
    nome: 'Internacional',
    buscas: ['internacional adidas', 'sc internacional adidas', 'sport club internacional', 'inter adidas'],
    termos: ['internacional', 'sc internacional', 'sport club internacional', 'inter'],
    excluirTermos: ['inter miami', 'miami', 'inter milan', 'inter milao', 'inter milão'],
    marcas: ['adidas'],
  },
  { nome: 'Atlético Mineiro', buscas: ['atletico mineiro adidas', 'atletico mineiro'], termos: ['atletico mineiro', 'atlético mineiro', 'galo'], marcas: ['adidas'] },
  { nome: 'Fluminense', buscas: ['fluminense umbro', 'fluminense'], termos: ['fluminense'], marcas: ['umbro', 'puma'] },
  { nome: 'Vasco', buscas: ['vasco kappa', 'vasco'], termos: ['vasco'], marcas: ['kappa'] },
  { nome: 'Botafogo', buscas: ['botafogo reebok', 'botafogo'], termos: ['botafogo'], marcas: ['reebok'] },
  { nome: 'Santos', buscas: ['santos umbro', 'santos'], termos: ['santos'], marcas: ['umbro'] },
  { nome: 'Cruzeiro', buscas: ['cruzeiro adidas', 'cruzeiro'], termos: ['cruzeiro'], marcas: ['adidas'] },
  { nome: 'Athletico-PR', buscas: ['athletico umbro', 'athletico'], termos: ['athletico', 'atletico paranaense', 'athletico pr'], marcas: ['umbro'] },
  { nome: 'Fortaleza', buscas: ['fortaleza volt', 'fortaleza'], termos: ['fortaleza'], marcas: ['volt'] },
  { nome: 'Bahia', buscas: ['bahia puma', 'bahia'], termos: ['bahia'], marcas: ['puma'] },
  { nome: 'Vitória', buscas: ['vitoria volt', 'vitoria'], termos: ['vitoria', 'vitória'], marcas: ['volt'] },
  {
    nome: 'Seleção Brasileira',
    buscas: ['brasil nike', 'selecao brasileira nike', 'seleção brasileira nike', 'camisa brasil nike', 'camisa seleção brasileira nike'],
    termos: ['brasil', 'seleção brasileira', 'selecao brasileira'],
    marcas: ['nike'],
    permitirSelecoes: true,
  },
  {
    nome: 'Outras Seleções',
    buscas: [
      'argentina adidas',
      'alemanha adidas',
      'espanha adidas',
      'frança nike',
      'franca nike',
      'italia adidas',
      'itália adidas',
      'portugal puma',
      'inglaterra nike',
      'holanda nike',
      'uruguai puma',
      'mexico adidas',
      'méxico adidas',
      'japao adidas',
      'japão adidas',
      'croacia nike',
      'croácia nike',
      'belgica adidas',
      'bélgica adidas',
      'eua nike',
      'estados unidos nike',
      'colombia adidas',
      'colômbia adidas',
      'chile adidas',
    ],
    termos: [
      'argentina',
      'alemanha',
      'espanha',
      'frança',
      'franca',
      'italia',
      'itália',
      'portugal',
      'inglaterra',
      'holanda',
      'uruguai',
      'mexico',
      'méxico',
      'japao',
      'japão',
      'croacia',
      'croácia',
      'belgica',
      'bélgica',
      'eua',
      'estados unidos',
      'colombia',
      'colômbia',
      'chile',
    ],
    excluirTermos: ['brasil', 'seleção brasileira', 'selecao brasileira'],
    marcas: ['adidas', 'nike', 'puma', 'umbro', 'new balance', 'kappa'],
    permitirSelecoes: true,
  },
]

const dryRun = process.argv.includes('--dry-run')
const somenteCupons = process.argv.includes('--somente-cupons')
const semDesativar = process.argv.includes('--sem-desativar')
const listarProdutos = process.argv.includes('--listar')
const diagnostico = process.argv.includes('--diagnostico')
const diagnosticoClube = normalizarTexto(argumentoValor('--diagnostico-clube') || argumentoValor('--clube') || '')
const diagnosticoBusca = normalizarTexto(argumentoValor('--diagnostico-busca') || argumentoValor('--buscar') || '')
const diagnosticoAmostras = Math.max(1, Number(argumentoValor('--diagnostico-amostras') || 8) || 8)
const diagnosticoUrl = argumentoValor('--diagnostico-url') || argumentoValor('--url') || ''
const TAMANHO_LOTE_SUPABASE = 50
const TIPOS_PRODUTOS_BUSCA = [
  'camisa',
  'camisa i',
  'camisa ii',
  'camisa iii',
  'camisa branca',
  'camisa manga curta',
  'camisa manga longa',
  'camisa goleiro',
  'camisa treino',
  'jaqueta',
  'moletom',
  'parka',
  'agasalho',
  'corta vento',
]

function temporadasPrioritarias() {
  const anoAtual = new Date().getFullYear()
  const inicios = [anoAtual, anoAtual - 1]
  const temporadas = new Set()

  for (const inicio of inicios) {
    const fim = inicio + 1
    const inicioCurto = String(inicio).slice(-2)
    const fimCurto = String(fim).slice(-2)
    temporadas.add(`${inicioCurto}/${fimCurto}`)
    temporadas.add(`${inicioCurto}${fimCurto}`)
    temporadas.add(`${inicio}/${fim}`)
    temporadas.add(String(inicio))
    temporadas.add(String(fim))
  }

  return Array.from(temporadas)
}

function argumentoValor(nome) {
  const prefixo = `${nome}=`
  const inline = process.argv.find(arg => arg.startsWith(prefixo))
  if (inline) return inline.slice(prefixo.length)

  const indice = process.argv.indexOf(nome)
  if (indice !== -1 && process.argv[indice + 1] && !process.argv[indice + 1].startsWith('--')) {
    return process.argv[indice + 1]
  }

  return ''
}

function dividirEmLotes(lista, tamanho = TAMANHO_LOTE_SUPABASE) {
  const lotes = []
  for (let i = 0; i < lista.length; i += tamanho) {
    lotes.push(lista.slice(i, i + tamanho))
  }
  return lotes
}

function mensagemErroSupabase(error) {
  if (!error) return 'erro desconhecido'
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(' | ')
}

function tokenRakutenInformado() {
  return process.env.RAKUTEN_ACCESS_TOKEN || process.env.RAKUTEN_BEARER_TOKEN || ''
}

function rakutenTokenKey() {
  if (process.env.RAKUTEN_TOKEN_KEY) return process.env.RAKUTEN_TOKEN_KEY
  if (process.env.RAKUTEN_CLIENT_ID && process.env.RAKUTEN_CLIENT_SECRET) {
    return Buffer.from(`${process.env.RAKUTEN_CLIENT_ID}:${process.env.RAKUTEN_CLIENT_SECRET}`).toString('base64')
  }

  return ''
}

function rakutenAccountId() {
  return process.env.RAKUTEN_ACCOUNT_ID || process.env.RAKUTEN_SID || '4700910'
}

function netshoesMid() {
  return process.env.RAKUTEN_NETSHOES_MID || process.env.NETSHOES_RAKUTEN_MID || ''
}

async function obterAccessToken() {
  const tokenInformado = tokenRakutenInformado()
  if (tokenInformado) return tokenInformado
  if (accessTokenCache?.token && accessTokenCache.expiresAt > Date.now() + 60_000) return accessTokenCache.token

  const tokenKey = rakutenTokenKey()
  if (!tokenKey) {
    throw new Error('Configure RAKUTEN_ACCESS_TOKEN, RAKUTEN_TOKEN_KEY ou RAKUTEN_CLIENT_ID + RAKUTEN_CLIENT_SECRET no .env.')
  }

  const body = new URLSearchParams()
  body.set('scope', rakutenAccountId())

  const res = await fetch('https://api.linksynergy.com/token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'AguanteAfiliados/1.0',
    },
    body,
    timeout: 30000,
  })

  const textoResposta = await res.text()
  if (!res.ok) throw new Error(`Token API falhou (${res.status}): ${textoResposta}`)

  const json = JSON.parse(textoResposta)
  if (!json.access_token) throw new Error('Token API não retornou access_token.')

  accessTokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(1, Number(json.expires_in || 3600)) * 1000,
  }

  return accessTokenCache.token
}

async function authHeaders() {
  const token = await obterAccessToken()
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/xml,application/json',
    'User-Agent': 'AguanteAfiliados/1.0',
  }
}

function texto($, el, seletor) {
  return $(el).find(seletor).first().text().trim()
}

function preco(valor) {
  const limpo = String(valor || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')
  if (!limpo) return null
  const numero = Number(limpo)
  return Number.isFinite(numero) && numero > 0 ? numero : null
}

function valorDinheiro(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(String(valor).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'))
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero * 100) / 100 : null
}

function urlAbsoluta(valor) {
  const url = String(valor || '').trim()
  if (!url) return null
  if (url.startsWith('//')) return `https:${url}`
  return url
}

function canonicalizarUrlProduto(linkProduto) {
  if (!linkProduto) return ''

  try {
    const url = new URL(linkProduto)
    url.hash = ''
    url.search = ''
    return `${url.hostname.replace(/^www\./, '')}${url.pathname}`.toLowerCase().replace(/\/+$/, '')
  } catch {
    return linkProduto.split('?')[0].split('#')[0].toLowerCase()
  }
}

function extrairUrlProdutoNetshoes(linkRakuten) {
  const link = urlAbsoluta(linkRakuten)
  if (!link) return null

  try {
    const url = new URL(link)
    const murl = url.searchParams.get('murl')
    if (murl) return decodeURIComponent(murl)
  } catch {
    return link
  }

  return link
}

function chaveProduto(produto) {
  return normalizarTexto(produto.titulo || '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(adulto|unissex)\b/g, ' ')
    .replace(/\s+(masculina|masculino)\s+masculino$/, ' $1')
    .replace(/\s+(feminina|feminino)\s+feminino$/, ' $1')
    .replace(/\s+/g, ' ')
    .trim() || canonicalizarUrlProduto(produto.link_produto)
}

function itemId(item, linkProduto) {
  const base = canonicalizarUrlProduto(linkProduto) || texto(item.$, item.el, 'sku') || texto(item.$, item.el, 'linkid') || linkProduto
  return `rakuten-netshoes:${base}`
}

function parseProdutosXml(xml) {
  const $ = cheerio.load(xml, { xmlMode: true })
  return $('item').map((_, el) => {
    const linkProduto = extrairUrlProdutoNetshoes(texto($, el, 'linkurl'))
    return {
      $,
      el,
      mid: texto($, el, 'mid'),
      titulo: texto($, el, 'productname'),
      preco: preco(texto($, el, 'saleprice') || texto($, el, 'price')),
      imagem_url: urlAbsoluta(texto($, el, 'imageurl')),
      link_produto: linkProduto,
      descricao: [texto($, el, 'description short'), texto($, el, 'description long'), texto($, el, 'keywords')].filter(Boolean).join(' '),
      external_id: itemId({ $, el }, linkProduto),
    }
  }).get()
}

function contemClube(produto, clube) {
  const textoTitulo = normalizarTexto(produto.titulo || '')
  if (clube.excluirTermos?.some(termo => textoTitulo.includes(normalizarTexto(termo)))) return false
  return clube.termos.some(termo => textoTitulo.includes(normalizarTexto(termo)))
}

function contemMarcaOficial(textoProduto) {
  return MARCAS_OFICIAIS.some(marca => textoProduto.includes(marca))
}

function contemMarcaEsperada(textoProduto, clube) {
  return !clube.marcas?.length || clube.marcas.some(marca => textoProduto.includes(marca))
}

function contemTemporada(textoProduto) {
  return /\b\d{2}\s*\/\s*\d{2}\b/.test(textoProduto)
    || /\b20\d{2}\s*\/\s*(?:\d{2}|20\d{2})\b/.test(textoProduto)
}

function contemLinhaOficial(textoProduto) {
  return /\bcamisa\s+[a-z0-9 ]*\b(i|ii|iii|1|2|3)\b/.test(textoProduto)
}

function avaliarProduto(produto, clube) {
  const textoTitulo = normalizarTexto(produto.titulo || '')
  const textoProduto = normalizarTexto(`${produto.titulo} ${produto.descricao}`)
  const motivos = []
  if (!/\b(camisa|camiseta|manto|moletom|parka|jaqueta|agasalho|blusao|blusão|corta vento|corta-vento)\b/.test(textoTitulo)) motivos.push('sem tipo permitido')
  if (!contemClube(produto, clube)) motivos.push('sem termo do clube ou termo excluído')
  if (/\s\+\s|combo|conjunto/.test(textoTitulo)) motivos.push('combo/conjunto')
  const categoriasBloqueadas = clube.permitirSelecoes
    ? /\b(kit|infantil|juvenil|kids|bebe|bebe|regata|polo|short|bone|bone|chuteira|calca|meiao|top|cropped)\b/
    : /\b(kit|selecao|selecoes|infantil|juvenil|kids|bebe|bebe|regata|polo|short|bone|bone|chuteira|calca|meiao|top|cropped)\b/
  if (categoriasBloqueadas.test(textoTitulo)) motivos.push('categoria bloqueada')
  if (/\b(retr[oô]|vintage|personalizada|customizada|historica|hist[oó]rica|legado|epic|replica)\b/.test(textoTitulo)) motivos.push('linha bloqueada')
  const marca = contemMarcaOficial(textoProduto)
  const marcaEsperada = contemMarcaEsperada(textoProduto, clube)
  if (!marca) motivos.push('sem marca oficial')
  if (!marcaEsperada) motivos.push('sem marca esperada do clube')

  return {
    aprovado: motivos.length === 0,
    motivos,
  }
}

function pareceCamisaOficial(produto, clube) {
  return avaliarProduto(produto, clube).aprovado
}

function diagnosticoAtivoParaClube(clube) {
  if (!diagnostico) return false
  if (!diagnosticoClube) return true
  const termos = [clube.nome, ...(clube.termos || [])].map(termo => normalizarTexto(termo))
  return termos.some(termo => termo.includes(diagnosticoClube) || diagnosticoClube.includes(termo))
}

function produtoBateDiagnostico(produto) {
  if (!diagnosticoBusca) return true
  const tokens = diagnosticoBusca.match(/[a-z0-9]+/g) || []
  if (tokens.length === 0) return true
  const textoProduto = normalizarTexto(`${produto.titulo} ${produto.descricao} ${produto.link_produto}`).replace(/[^a-z0-9]+/g, ' ')
  return tokens.every(token => {
    const alternativas = [token]
    if (token === 'branca') alternativas.push('branco')
    if (token === 'branco') alternativas.push('branca')
    if (/^\d{2}$/.test(token)) alternativas.push(`20${token}`)
    return alternativas.some(alternativa => textoProduto.includes(alternativa))
  })
}

function logDiagnosticoProdutos(clube, termoBusca, produtos) {
  if (!diagnosticoAtivoParaClube(clube)) return

  const contagemMotivos = new Map()
  const aprovados = produtos.filter(produto => {
    if (!produto.link_produto || !produto.titulo) {
      contagemMotivos.set('sem link ou título', (contagemMotivos.get('sem link ou título') || 0) + 1)
      return false
    }

    const avaliacao = avaliarProduto(produto, clube)
    if (!avaliacao.aprovado) {
      avaliacao.motivos.forEach(motivo => contagemMotivos.set(motivo, (contagemMotivos.get(motivo) || 0) + 1))
    }
    return avaliacao.aprovado
  })
  const matches = produtos.filter(produtoBateDiagnostico)
  console.log(`  Diagnóstico "${termoBusca}": ${produtos.length} brutos, ${aprovados.length} aprovados, ${matches.length} matches da busca`)
  if (contagemMotivos.size > 0) {
    const resumoMotivos = Array.from(contagemMotivos.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([motivo, total]) => `${motivo}: ${total}`)
      .join('; ')
    console.log(`    Cortes: ${resumoMotivos}`)
  }

  const deveMostrarAmostra = matches.length > 0
    || /branca|manga|ii|inter|internacional|adidas/i.test(termoBusca)
  if (!deveMostrarAmostra) return

  const amostra = (matches.length > 0 ? matches : produtos).slice(0, diagnosticoAmostras)
  amostra.forEach(produto => {
    const avaliacao = avaliarProduto(produto, clube)
    const status = avaliacao.aprovado ? 'OK' : `CORTADO: ${avaliacao.motivos.join(', ')}`
    const descricao = normalizarTexto(produto.descricao || '').slice(0, 120)
    console.log(`    [${status}] ${produto.titulo || '(sem título)'} | ${produto.link_produto || '(sem link)'}`)
    if (descricao) console.log(`      desc: ${descricao}`)
  })
}

function pontuar(produto) {
  const textoProduto = normalizarTexto(`${produto.titulo} ${produto.descricao}`)
  let pontos = 0
  if (/\boficial|licenciado\b/.test(textoProduto)) pontos += 30
  if (/\btorcedor|jogador\b/.test(textoProduto)) pontos += 20
  if (contemTemporada(textoProduto)) pontos += 16
  if (contemLinhaOficial(textoProduto)) pontos += 10
  if (contemMarcaOficial(textoProduto)) pontos += 8
  if (produto.preco) pontos += Math.max(0, 20 - Math.floor(produto.preco / 30))
  return pontos
}

async function buscarProdutosPorTermo(clube, termoBusca) {
  const mid = netshoesMid()
  if (!mid) throw new Error('Configure RAKUTEN_NETSHOES_MID no .env.')

  const url = new URL(PRODUCT_SEARCH_URL)
  const termoNormalizado = normalizarTexto(termoBusca)
  const termoTemTipoProduto = /\b(camisa|camiseta|manto|moletom|parka|jaqueta|agasalho|blusao|blusão|corta vento|corta-vento)\b/.test(termoNormalizado)
  url.searchParams.set('keyword', termoTemTipoProduto ? termoBusca : `camisa ${termoBusca}`)
  url.searchParams.set('mid', mid)
  url.searchParams.set('max', String(RESULTADOS_POR_BUSCA))

  const res = await fetch(url, { headers: await authHeaders(), timeout: 30000 })
  if (!res.ok) throw new Error(`Product Search falhou para ${clube.nome}: ${res.status} ${await res.text()}`)

  return parseProdutosXml(await res.text())
}

async function buscarProdutosClube(clube) {
  const produtosPorChave = new Map()
  const buscas = termosBuscaClube(clube)

  for (const termoBusca of buscas) {
    const produtos = await buscarProdutosPorTermo(clube, termoBusca)
    logDiagnosticoProdutos(clube, termoBusca, produtos)
    produtos
      .filter(produto => produto.link_produto && produto.titulo && pareceCamisaOficial(produto, clube))
      .forEach(produto => produtosPorChave.set(chaveProduto(produto), produto))

    await sleep(250)
  }

  const produtosNetshoes = await buscarProdutosNetshoes(clube).catch(error => {
    console.warn(`  Aviso: fallback Netshoes falhou para ${clube.nome}: ${error.message}`)
    return []
  })
  produtosNetshoes
    .filter(produto => produto.link_produto && produto.titulo && pareceCamisaOficial(produto, clube))
    .forEach(produto => produtosPorChave.set(chaveProduto(produto), produto))

  const ordenados = Array.from(produtosPorChave.values())
    .sort((a, b) => pontuar(b) - pontuar(a))

  if (diagnosticoAtivoParaClube(clube)) {
    console.log(`  Diagnóstico final: ${ordenados.length} únicos aprovados antes do corte; limite ${MAX_POR_CLUBE}`)
    const matchesFinais = ordenados
      .map((produto, indice) => ({ produto, indice }))
      .filter(({ produto }) => produtoBateDiagnostico(produto))
    matchesFinais.slice(0, diagnosticoAmostras).forEach(({ produto, indice }) => {
      console.log(`    [FINAL #${indice + 1}${indice >= MAX_POR_CLUBE ? ' FORA DO CORTE' : ''}] ${produto.titulo} | ${produto.link_produto}`)
    })
    if (diagnosticoBusca && matchesFinais.length === 0) {
      console.log(`    Nenhum aprovado final bateu a busca "${diagnosticoBusca}".`)
    }
  }

  return ordenados.slice(0, MAX_POR_CLUBE)
}

function termosBuscaClube(clube) {
  const termos = new Set(clube.buscas || [clube.busca || clube.nome])
  const nomesClube = [clube.nome, ...(clube.termos || [])]
    .map(termo => normalizarTexto(termo))
    .filter(Boolean)
  const marcas = clube.marcas?.length ? clube.marcas : ['']

  for (const nomeClube of nomesClube) {
    for (const marca of marcas) {
      for (const tipo of TIPOS_PRODUTOS_BUSCA) {
        termos.add([tipo, nomeClube, marca].filter(Boolean).join(' '))
      }
    }
  }

  return Array.from(termos)
}

function slugBuscaNetshoes(clube) {
  const termo = clube.buscas?.find(busca => !MARCAS_OFICIAIS.some(marca => normalizarTexto(busca).includes(marca)))
    || clube.busca
    || clube.nome

  return normalizarTexto(termo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function produtosJsonLd(html) {
  const $ = cheerio.load(html)
  const produtos = []

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raiz = JSON.parse($(el).text())
      const fila = Array.isArray(raiz) ? [...raiz] : [raiz]

      while (fila.length) {
        const item = fila.shift()
        if (!item || typeof item !== 'object') continue
        if (Array.isArray(item)) {
          fila.push(...item)
          continue
        }

        if (item['@type'] === 'Product') {
          produtos.push(item)
          continue
        }

        if (Array.isArray(item.itemListElement)) {
          item.itemListElement.forEach(elemento => {
            if (elemento?.item) fila.push(elemento.item)
          })
        }
        if (Array.isArray(item['@graph'])) fila.push(...item['@graph'])
      }
    } catch {
      // Ignora scripts que não sejam JSON-LD válido.
    }
  })

  return produtos
}

function imagemProdutoJsonLd(produto) {
  if (Array.isArray(produto.image)) return produto.image[0] || null
  return produto.image || null
}

function precoProdutoJsonLd(produto) {
  const offers = Array.isArray(produto.offers) ? produto.offers[0] : produto.offers
  return preco(offers?.price)
}

function slugTermoNetshoes(termo) {
  return normalizarTexto(termo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function termosBuscaNetshoes(clube) {
  const termos = new Set()
  const adicionar = termo => {
    const termoNormalizado = normalizarTexto(termo)
    if (termoNormalizado) termos.add(termoNormalizado)
  }
  const nomesClube = [clube.nome, ...(clube.termos || [])]
    .map(termo => normalizarTexto(termo))
    .filter(Boolean)
  const marcas = clube.marcas?.length ? clube.marcas : ['']
  const nomePrincipal = nomesClube[0] || normalizarTexto(clube.nome)

  adicionar(`camisa ${slugBuscaNetshoes(clube).replace(/-/g, ' ')}`)

  for (const marca of marcas) {
    adicionar(['camisa', nomePrincipal, marca].filter(Boolean).join(' '))

    for (const temporada of TEMPORADAS_PRIORITARIAS) {
      adicionar(['camisa', nomePrincipal, marca, temporada].filter(Boolean).join(' '))
    }

    for (const temporada of TEMPORADAS_PRIORITARIAS) {
      for (const linha of LINHAS_OFICIAIS_BUSCA) {
        adicionar(['camisa', nomePrincipal, linha, temporada, marca].filter(Boolean).join(' '))
      }

      if (temporada.includes('/')) {
        adicionar(['camisa', nomePrincipal, temporada, 'treino', marca].filter(Boolean).join(' '))
        adicionar(['camisa', nomePrincipal, temporada, 'goleiro', marca].filter(Boolean).join(' '))

        for (const linha of LINHAS_OFICIAIS_BUSCA) {
          adicionar(['camisa', nomePrincipal, linha, temporada, 'manga longa', marca].filter(Boolean).join(' '))
        }
      }
    }
  }

  for (const nomeClube of nomesClube.slice(1)) {
    for (const marca of marcas) {
      adicionar(['camisa', nomeClube, marca].filter(Boolean).join(' '))
    }
  }

  // Mantém o fallback controlado para não transformar a rotina diária em um crawler amplo.
  return Array.from(termos).slice(0, 24)
}

async function buscarProdutosNetshoesPorTermo(clube, termoBusca) {
  const url = `${NETSHOES_URL}/busca/${slugTermoNetshoes(termoBusca)}`
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (compatible; AguanteAfiliados/1.0)',
    },
    timeout: 30000,
  })

  if (!res.ok) throw new Error(`Netshoes respondeu ${res.status}`)

  const produtos = produtosJsonLd(await res.text()).map(produto => {
    const linkProduto = produto.url ? new URL(produto.url, NETSHOES_URL).toString() : null
    const marca = typeof produto.brand === 'object' ? produto.brand?.name : produto.brand

    return {
      titulo: produto.name || '',
      preco: precoProdutoJsonLd(produto),
      imagem_url: urlAbsoluta(imagemProdutoJsonLd(produto)),
      link_produto: linkProduto,
      descricao: [produto.description, marca].filter(Boolean).join(' '),
      external_id: `rakuten-netshoes:${canonicalizarUrlProduto(linkProduto) || produto.sku || produto.name}`,
    }
  })

  logDiagnosticoProdutos(clube, `Netshoes fallback ${termoBusca}`, produtos)
  return produtos
}

async function buscarProdutosNetshoes(clube) {
  const produtosPorChave = new Map()

  for (const termoBusca of termosBuscaNetshoes(clube)) {
    try {
      const produtos = await buscarProdutosNetshoesPorTermo(clube, termoBusca)
      produtos.forEach(produto => produtosPorChave.set(chaveProduto(produto), produto))
      await sleep(250)
    } catch (error) {
      console.warn(`  Aviso: fallback Netshoes falhou para "${termoBusca}": ${error.message}`)
    }
  }

  return Array.from(produtosPorChave.values())
}

function extrairCodigoCupom(textoCupom) {
  const match = String(textoCupom || '').match(/\b[A-Z0-9][A-Z0-9_-]{3,20}\b/)
  return match?.[0] || null
}

function extrairPercentualCupom(textoCupom) {
  const percentuais = [...String(textoCupom || '').matchAll(/(\d{1,3})(?:[,.]\d+)?\s*%/g)]
    .map(match => Number(match[1]))
    .filter(valor => Number.isFinite(valor) && valor > 0 && valor <= 100)

  if (percentuais.length === 0) return null
  return Math.max(...percentuais)
}

function percentualCupomVariavel(textoCupom) {
  const textoNormalizado = normalizarTexto(textoCupom || '')
  const percentuais = [...String(textoCupom || '').matchAll(/(\d{1,3})(?:[,.]\d+)?\s*%/g)]
    .map(match => Number(match[1]))
    .filter(valor => Number.isFinite(valor) && valor > 0 && valor <= 100)

  return percentuais.length > 1 || /\bate\b|de\s+\d{1,3}%\s+a\s+\d{1,3}%/.test(textoNormalizado)
}

function parseCuponsXml(xml) {
  const $ = cheerio.load(xml, { xmlMode: true })
  return $('link').map((_, el) => {
    const descricao = texto($, el, 'offerdescription')
    const codigo = texto($, el, 'couponcode') || extrairCodigoCupom(descricao)
    const percentual = extrairPercentualCupom(descricao)
    const percentualVariavel = percentualCupomVariavel(descricao)
    return {
      store_name: texto($, el, 'advertisername') || LOJA,
      code: codigo,
      discount_label: percentual ? `${percentual}% OFF` : descricao || 'Cupom Netshoes',
      description: descricao || null,
      rules: null,
      valid_from: texto($, el, 'offerstartdate') || null,
      valid_until: texto($, el, 'offerenddate') || null,
      is_active: true,
      campaign: 'rakuten-netshoes',
      percentual,
      percentual_variavel: percentualVariavel,
    }
  }).get().filter(cupom => cupom.code)
}

async function buscarCuponsRakuten() {
  const mid = netshoesMid()
  if (!mid) return []

  const url = new URL(COUPON_URL)
  url.searchParams.set('mid', mid)
  url.searchParams.set('resultsperpage', '500')

  const res = await fetch(url, { headers: await authHeaders(), timeout: 30000 })
  if (!res.ok) {
    console.warn(`  Aviso: Coupon API falhou (${res.status}). Usando cupom padrão.`)
    return []
  }

  return parseCuponsXml(await res.text())
}

function cupomPrincipal(cupons) {
  const codigoPadrao = normalizarTexto(DEFAULT_CUPOM_CODIGO)
  const cupomApi = cupons.find(cupom => normalizarTexto(cupom.code) === codigoPadrao && cupom.percentual)
  if (cupomApi) {
    return {
      cupom_codigo: DEFAULT_CUPOM_CODIGO,
      cupom_percentual: cupomApi.percentual,
      cupom_desconto_maximo: DEFAULT_CUPOM_DESCONTO_MAXIMO,
      cupom_percentual_variavel: cupomApi.percentual_variavel,
      cupom_descricao: cupomApi.description || DEFAULT_CUPOM_DESCRICAO,
      cupom_origem: 'coupon-api',
    }
  }

  return {
    cupom_codigo: DEFAULT_CUPOM_CODIGO,
    cupom_percentual: DEFAULT_CUPOM_PERCENTUAL,
    cupom_desconto_maximo: DEFAULT_CUPOM_DESCONTO_MAXIMO,
    cupom_percentual_variavel: DEFAULT_CUPOM_VARIAVEL,
    cupom_descricao: DEFAULT_CUPOM_DESCRICAO,
    cupom_origem: 'config',
  }
}

function combinarCupomComBanco(cupom, cupomBanco) {
  if (!cupomBanco) return cupom

  const usarPercentualBanco = cupom.cupom_origem !== 'coupon-api' && cupomBanco.cupom_percentual
  return {
    ...cupom,
    cupom_codigo: cupomBanco.cupom_codigo || cupom.cupom_codigo,
    cupom_percentual: usarPercentualBanco ? Number(cupomBanco.cupom_percentual) : cupom.cupom_percentual,
    cupom_desconto_maximo: valorDinheiro(cupomBanco.cupom_desconto_maximo) ?? cupom.cupom_desconto_maximo,
    cupom_percentual_variavel: cupom.cupom_origem === 'coupon-api'
      ? cupom.cupom_percentual_variavel
      : Boolean(cupomBanco.cupom_percentual_variavel ?? cupom.cupom_percentual_variavel),
    cupom_descricao: cupomBanco.cupom_descricao || cupom.cupom_descricao,
    cupom_origem: `${cupom.cupom_origem}+painel`,
  }
}

async function cupomSalvoNetshoes(supabase) {
  const { data, error } = await supabase
    .from('ofertas_afiliadas')
    .select('cupom_codigo,cupom_percentual,cupom_desconto_maximo,cupom_percentual_variavel,cupom_descricao')
    .eq('loja', LOJA)
    .not('cupom_codigo', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn(`  Aviso: não foi possível consultar cupom salvo da Netshoes: ${mensagemErroSupabase(error)}`)
    return null
  }

  return data || null
}

function precoComCupom(valor, percentual, percentualVariavel, cupomAplicavel, descontoMaximo = null) {
  if (!valor || !percentual || percentualVariavel || !cupomAplicavel) return null
  const descontoPercentual = valor * (percentual / 100)
  const desconto = descontoMaximo ? Math.min(descontoPercentual, descontoMaximo) : descontoPercentual
  return Math.max(0, Math.round((valor - desconto) * 100) / 100)
}

function produtoTemTagSelecaoHtml(html) {
  const textoNormalizado = normalizarTexto(html || '')
  return /promotionflags["']?\s*:\s*["'][^"']*selecao/.test(textoNormalizado)
    || /"stamps"\s*:\s*\[[^\]]*"name"\s*:\s*"selecao"/.test(textoNormalizado)
    || /"name"\s*:\s*"selecao"[^}]*"style"\s*:\s*\{/.test(textoNormalizado)
}

function produtoTemTagLancamentoHtml(html) {
  const textoNormalizado = normalizarTexto(html || '')
  return /promotionflags["']?\s*:\s*["'][^"']*lancamento/.test(textoNormalizado)
    || /"stamps"\s*:\s*\[[^\]]*"name"\s*:\s*"lancamento"/.test(textoNormalizado)
    || /"name"\s*:\s*"lancamento"[^}]*"style"\s*:\s*\{/.test(textoNormalizado)
}

function extrairPrimeiroCentavos(html, padroes) {
  for (const padrao of padroes) {
    const match = html.match(padrao)
    const valor = match?.[1] ? Number(match[1]) : null
    if (Number.isFinite(valor) && valor > 0) return Math.round(valor) / 100
  }

  return null
}

function precoPixProdutoHtml(html) {
  const precoAtual = precoAtualProdutoHtml(html)
  if (precoAtual?.precoPix) return precoAtual.precoPix

  const trechosPix = html.match(/.{0,1400}paymentMethod["']?\s*:\s*["']PIX["'].{0,900}/gi) || []

  for (const trecho of trechosPix) {
    const valorCheio = trecho.match(/fullAmountInCents["']?\s*:\s*(\d+)/i)?.[1]
    const descontoPix = trecho.match(/paymentBenefit["']?\s*:\s*\{[^}]*totalDiscountInCents["']?\s*:\s*(\d+)/i)?.[1]
      || trecho.match(/type["']?\s*:\s*["']PAYMENT_METHOD_DISCOUNT["'][^}]*discountInCents["']?\s*:\s*(\d+)/i)?.[1]
    if (valorCheio && descontoPix) {
      const precoPix = (Number(valorCheio) - Number(descontoPix)) / 100
      if (Number.isFinite(precoPix) && precoPix > 0) return Math.round(precoPix * 100) / 100
    }

    const saleInCents = extrairPrimeiroCentavos(trecho, [/saleInCents["']?\s*:\s*(\d+)/i])
    if (saleInCents) return saleInCents
  }

  return extrairPrimeiroCentavos(html, [
    /saleInCents["']?\s*:\s*(\d+)/i,
    /minSalePrice["']?\s*:\s*(\d+)/i,
  ])
}

function precoCheioProdutoHtml(html) {
  const precoAtual = precoAtualProdutoHtml(html)
  if (precoAtual?.preco) return precoAtual.preco

  return extrairPrimeiroCentavos(html, [
    /finalPriceWithoutPaymentBenefitDiscount["']?\s*:\s*(\d+)/i,
    /fullAmountInCents["']?\s*:\s*(\d+)/i,
    /listInCents["']?\s*:\s*(\d+)/i,
    /ncardInCents["']?\s*:\s*(\d+)/i,
  ])
}

function extrairArrayJson(html, marcador) {
  const inicioMarcador = html.indexOf(marcador)
  if (inicioMarcador === -1) return null
  const inicioArray = html.indexOf('[', inicioMarcador)
  if (inicioArray === -1) return null

  let profundidade = 0
  let emString = false
  let escapado = false
  for (let i = inicioArray; i < html.length; i += 1) {
    const char = html[i]
    if (escapado) {
      escapado = false
      continue
    }
    if (char === '\\') {
      escapado = true
      continue
    }
    if (char === '"') {
      emString = !emString
      continue
    }
    if (emString) continue
    if (char === '[') profundidade += 1
    if (char === ']') profundidade -= 1
    if (profundidade === 0) return html.slice(inicioArray, i + 1)
  }

  return null
}

function precoAtualProdutoHtml(html) {
  const arrayPrecos = extrairArrayJson(html, '"prices"')
  if (!arrayPrecos) return null

  try {
    const precos = JSON.parse(arrayPrecos)
    if (!Array.isArray(precos)) return null
    const disponiveis = precos.filter(precoItem => precoItem?.available !== false)
    const precosBase = disponiveis.length > 0 ? disponiveis : precos

    const normalizados = precosBase.map(precoItem => {
      const precoCheioCentavos = disponiveis.length > 0
        ? Number(precoItem.finalPriceWithoutPaymentBenefitDiscount || precoItem.fullAmountInCents || precoItem.saleInCents || precoItem.listInCents)
        : Number(precoItem.listInCents || precoItem.finalPriceWithoutPaymentBenefitDiscount || precoItem.fullAmountInCents || precoItem.saleInCents)
      const descontoPixCentavos = disponiveis.length > 0 ? Number(precoItem.paymentBenefit?.totalDiscountInCents || 0) : 0
      const precoPixCentavos = disponiveis.length > 0
        ? Number(precoItem.saleInCents || (precoCheioCentavos && descontoPixCentavos ? precoCheioCentavos - descontoPixCentavos : 0))
        : precoCheioCentavos
      const precoCheio = Number.isFinite(precoCheioCentavos) && precoCheioCentavos > 0 ? Math.round(precoCheioCentavos) / 100 : null
      const precoPix = Number.isFinite(precoPixCentavos) && precoPixCentavos > 0 ? Math.round(precoPixCentavos) / 100 : null
      return {
        preco: precoCheio,
        precoPix: precoCheio && precoPix && precoPix > precoCheio ? precoCheio : precoPix,
      }
    }).filter(precoItem => precoItem.preco || precoItem.precoPix)

    if (normalizados.length === 0) return { disponivel: false, preco: null, precoPix: null }
    return normalizados.sort((a, b) => (a.precoPix || a.preco || Infinity) - (b.precoPix || b.preco || Infinity))[0]
  } catch {
    return null
  }
}

async function metadadosProdutoNetshoes(linkProduto) {
  if (!linkProduto) return { tagSelecao: false, precoPix: null }

  try {
    const res = await fetch(linkProduto, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; AguanteAfiliados/1.0)',
      },
      timeout: 30000,
    })

    if (!res.ok) return { tagSelecao: false, precoPix: null }
    const html = await res.text()
    const precoAtual = precoAtualProdutoHtml(html)
    const precoCheio = precoAtual?.preco || precoCheioProdutoHtml(html)
    const precoPix = precoAtual?.precoPix || precoPixProdutoHtml(html)
    return {
      tagSelecao: produtoTemTagSelecaoHtml(html),
      disponivel: true,
      preco: precoCheio,
      precoPix: precoCheio && precoPix && precoPix > precoCheio ? precoCheio : precoPix,
    }
  } catch {
    return { tagSelecao: false, preco: null, precoPix: null }
  }
}

async function produtoNetshoesPorUrl(linkProduto) {
  const res = await fetch(linkProduto, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (compatible; AguanteAfiliados/1.0)',
    },
    timeout: 30000,
  })

  if (!res.ok) throw new Error(`Netshoes respondeu ${res.status} para a URL informada.`)

  const html = await res.text()
  const produto = produtosJsonLd(html)[0] || {}
  const marca = typeof produto.brand === 'object' ? produto.brand?.name : produto.brand
  const precoAtual = precoAtualProdutoHtml(html)
  const precoCheio = precoAtual?.preco || precoCheioProdutoHtml(html) || precoProdutoJsonLd(produto)
  const precoPix = precoAtual?.precoPix || precoPixProdutoHtml(html)
  const $ = cheerio.load(html)
  const tituloFallback = $('h1').first().text().trim() || $('title').first().text().trim()
  const linkProdutoFinal = produto.url ? new URL(produto.url, NETSHOES_URL).toString() : linkProduto

  return {
    titulo: produto.name || tituloFallback || '',
    preco: precoCheio,
    preco_pix: precoCheio && precoPix && precoPix > precoCheio ? precoCheio : precoPix,
    imagem_url: urlAbsoluta(imagemProdutoJsonLd(produto)),
    link_produto: linkProdutoFinal,
    descricao: [produto.description, marca].filter(Boolean).join(' '),
    external_id: `rakuten-netshoes:${canonicalizarUrlProduto(linkProdutoFinal) || produto.sku || produto.name || linkProduto}`,
    tag_selecao: produtoTemTagSelecaoHtml(html),
    tag_lancamento: produtoTemTagLancamentoHtml(html),
  }
}

async function diagnosticarUrlProduto() {
  if (!diagnosticoUrl) return

  console.log(`\nDiagnóstico por URL: ${diagnosticoUrl}`)
  const produto = await produtoNetshoesPorUrl(diagnosticoUrl).catch(error => {
    console.warn(`  Aviso: não foi possível ler a URL informada: ${error.message}`)
    return null
  })
  if (!produto) return

  console.log(`  Produto: ${produto.titulo || '(sem título)'}`)
  console.log(`  Preço: ${produto.preco || '(não encontrado)'} | Pix: ${produto.preco_pix || '(não encontrado)'}`)
  console.log(`  Tags detectadas: seleção=${produto.tag_selecao ? 'sim' : 'não'}; lançamento=${produto.tag_lancamento ? 'sim' : 'não'}`)

  const clubes = CLUBES.filter(diagnosticoAtivoParaClube)
  for (const clube of clubes) {
    const avaliacao = avaliarProduto(produto, clube)
    console.log(`  ${clube.nome}: ${avaliacao.aprovado ? 'passaria no filtro' : `cortado por ${avaliacao.motivos.join(', ')}`}`)
  }
}

async function gerarDeepLink(linkProduto, u1) {
  const res = await fetch(DEEP_LINK_URL, {
    method: 'POST',
    headers: {
      ...await authHeaders(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      url: linkProduto,
      advertiser_id: Number(netshoesMid()),
      u1,
    }),
    timeout: 30000,
  })

  const body = await res.text()
  if (!res.ok) throw new Error(`Deep Link falhou (${res.status}): ${body}`)

  const json = JSON.parse(body)
  return json?.advertiser?.deep_link?.deep_link_url || json?.deep_link_url || null
}

async function sincronizarCupons(supabase, cupons) {
  if (cupons.length === 0 || dryRun) return 0

  let salvos = 0
  for (const cupom of cupons) {
    const { percentual, percentual_variavel, ...cupomParaSalvar } = cupom
    void percentual
    void percentual_variavel

    const { error } = await supabase
      .from('store_coupons')
      .upsert(cupomParaSalvar, { onConflict: 'store_name,code', ignoreDuplicates: false })

    if (error) {
      console.warn(`  Aviso: não foi possível salvar cupom ${cupom.code}: ${error.message}`)
      continue
    }
    salvos += 1
  }
  return salvos
}

async function desativarOfertasAntigas(supabase, externalIdsVistos) {
  if (semDesativar || dryRun) return 0
  if (externalIdsVistos.length === 0) {
    console.warn('  Aviso: nenhuma oferta vista; não vou ocultar ofertas antigas nesta rodada.')
    return 0
  }

  const { data: ofertasAtivas, error: buscaError } = await supabase
    .from('ofertas_afiliadas')
    .select('id,external_id')
    .eq('loja', LOJA)
    .eq('automacao_origem', ORIGEM)
    .eq('ativo', true)

  if (buscaError) {
    console.warn(`  Aviso: não foi possível consultar ofertas antigas: ${mensagemErroSupabase(buscaError)}`)
    return 0
  }

  const vistos = new Set(externalIdsVistos)
  const idsParaDesativar = (ofertasAtivas || [])
    .filter(oferta => oferta.external_id && !vistos.has(oferta.external_id))
    .map(oferta => oferta.id)

  if (idsParaDesativar.length === 0) return 0

  let total = 0
  for (const loteIds of dividirEmLotes(idsParaDesativar)) {
    const { data, error } = await supabase
    .from('ofertas_afiliadas')
    .update({ ativo: false, inactivated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in('id', loteIds)
    .select('id')

    if (error) {
      console.warn(`  Aviso: não foi possível desativar um lote de ofertas antigas: ${mensagemErroSupabase(error)}`)
      continue
    }

    total += data?.length || 0
  }

  return total
}

async function salvarOfertas(supabase, ofertas, opcoes = {}) {
  if (ofertas.length === 0 || dryRun) return 0
  const ofertasUnicas = Array.from(new Map(ofertas.map(oferta => [oferta.external_id, oferta])).values())
  const externalIds = ofertasUnicas.map(oferta => oferta.external_id)

  const ofertasAtuais = []
  for (const loteExternalIds of dividirEmLotes(externalIds)) {
    const { data, error: buscaError } = await supabase
      .from('ofertas_afiliadas')
      .select('external_id,cupom_codigo,cupom_percentual,cupom_desconto_maximo,cupom_percentual_variavel,cupom_descricao')
      .eq('loja', LOJA)
      .eq('automacao_origem', ORIGEM)
      .in('external_id', loteExternalIds)

    if (buscaError) throw new Error(`Erro ao consultar ofertas atuais: ${mensagemErroSupabase(buscaError)}`)
    ofertasAtuais.push(...(data || []))
  }

  const cuponsAtuais = new Map((ofertasAtuais || []).map(oferta => [oferta.external_id, oferta]))
  const ofertasParaSalvar = ofertasUnicas.map(oferta => {
    const atual = cuponsAtuais.get(oferta.external_id)
    if (!atual) return oferta

    const cupomPercentual = opcoes.atualizarCupomExistente ? oferta.cupom_percentual : (atual.cupom_percentual ?? oferta.cupom_percentual)
    const cupomDescontoMaximo = opcoes.atualizarCupomExistente ? oferta.cupom_desconto_maximo : (atual.cupom_desconto_maximo ?? oferta.cupom_desconto_maximo)
    const cupomPercentualVariavel = opcoes.atualizarCupomExistente ? oferta.cupom_percentual_variavel : (atual.cupom_percentual_variavel ?? oferta.cupom_percentual_variavel)
    const precoBase = oferta.preco_pix || oferta.preco

    return {
      ...oferta,
      cupom_codigo: opcoes.atualizarCupomExistente ? oferta.cupom_codigo : (atual.cupom_codigo ?? oferta.cupom_codigo),
      cupom_percentual: cupomPercentual,
      cupom_desconto_maximo: cupomDescontoMaximo,
      cupom_percentual_variavel: cupomPercentualVariavel,
      cupom_descricao: opcoes.atualizarCupomExistente ? oferta.cupom_descricao : (atual.cupom_descricao ?? oferta.cupom_descricao),
      preco_com_cupom: precoComCupom(precoBase, Number(cupomPercentual), cupomPercentualVariavel, oferta.cupom_aplicavel, valorDinheiro(cupomDescontoMaximo)),
    }
  })

  const { data, error } = await supabase
    .from('ofertas_afiliadas')
    .upsert(ofertasParaSalvar, { onConflict: 'external_id', ignoreDuplicates: false })
    .select('id')

  if (error) throw new Error(`Erro ao salvar ofertas afiliadas: ${error.message}`)
  return data?.length || 0
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const destinoBanco = supabaseUrl ? new URL(supabaseUrl).hostname : 'Supabase não identificado'
  const modoAuth = tokenRakutenInformado()
    ? 'access token informado'
    : rakutenTokenKey()
      ? 'token-key OAuth'
      : 'não configurado'

  console.log(`Destino Supabase: ${destinoBanco}`)
  console.log(`Autenticação Rakuten: ${modoAuth}`)
  if (dryRun) console.log('Modo dry-run ativo: nada será gravado.')
  if (diagnostico) {
    console.log('Modo diagnóstico ativo: nada será gravado.')
    if (diagnosticoClube) console.log(`Filtro de clube: ${diagnosticoClube}`)
    if (diagnosticoBusca) console.log(`Busca destacada: ${diagnosticoBusca}`)
    if (diagnosticoUrl) await diagnosticarUrlProduto()

    const clubesDiagnostico = CLUBES.filter(diagnosticoAtivoParaClube)
    if (clubesDiagnostico.length === 0) {
      console.warn('Nenhum clube bateu o filtro de diagnóstico.')
      return
    }

    for (const clube of clubesDiagnostico) {
      console.log(`\n${clube.nome}`)
      const produtos = await buscarProdutosClube(clube).catch(error => {
        console.warn(`  Aviso: ${error.message}`)
        return []
      })
      console.log(`  ${produtos.length} ofertas candidatas após corte`)
      if (listarProdutos) {
        produtos.forEach(produto => console.log(`    - ${produto.titulo}`))
      }
    }
    return
  }

  const supabase = criarSupabase()
  const cupons = await buscarCuponsRakuten()
  const cupom = combinarCupomComBanco(cupomPrincipal(cupons), await cupomSalvoNetshoes(supabase))
  const tetoCupom = cupom.cupom_desconto_maximo ? `, teto R$ ${cupom.cupom_desconto_maximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''
  console.log(`Cupom principal: ${cupom.cupom_codigo} ${cupom.cupom_percentual}%${tetoCupom} (${cupom.cupom_origem})`)
  const cuponsSalvos = await sincronizarCupons(supabase, cupons)

  if (somenteCupons) {
    console.log(`Cupons encontrados: ${cupons.length}. Salvos: ${cuponsSalvos}.`)
    return
  }

  const agora = new Date().toISOString()
  const ofertas = []

  for (const [indiceClube, clube] of CLUBES.entries()) {
    console.log(`\n${clube.nome}`)
    const produtos = await buscarProdutosClube(clube).catch(error => {
      console.warn(`  Aviso: ${error.message}`)
      return []
    })
    console.log(`  ${produtos.length} ofertas candidatas`)
    if (listarProdutos) {
      produtos.forEach(produto => console.log(`    - ${produto.titulo}`))
    }

    for (const [indiceProduto, produto] of produtos.entries()) {
      const u1 = `aguante_${normalizarTexto(clube.nome).replace(/\s+/g, '_')}_${indiceProduto + 1}`
      const metadadosProduto = await metadadosProdutoNetshoes(produto.link_produto)
      const tagSelecao = metadadosProduto.tagSelecao
      const cupomAplicavel = !tagSelecao
      const linkAfiliado = dryRun ? produto.link_produto : await gerarDeepLink(produto.link_produto, u1)
      const precoCheio = metadadosProduto.preco || produto.preco
      const precoBase = metadadosProduto.precoPix || precoCheio

      if (!linkAfiliado) {
        console.warn(`  Aviso: sem deep link para ${produto.titulo}`)
        continue
      }

      ofertas.push({
        loja: LOJA,
        titulo: produto.titulo,
        preco: precoCheio,
        preco_pix: metadadosProduto.precoPix,
        preco_com_cupom: precoComCupom(precoBase, cupom.cupom_percentual, cupom.cupom_percentual_variavel, cupomAplicavel, cupom.cupom_desconto_maximo),
        imagem_url: produto.imagem_url,
        link_afiliado: linkAfiliado,
        link_produto: produto.link_produto,
        cupom_codigo: cupom.cupom_codigo,
        cupom_percentual: cupom.cupom_percentual,
        cupom_desconto_maximo: cupom.cupom_desconto_maximo,
        cupom_percentual_variavel: cupom.cupom_percentual_variavel,
        cupom_descricao: cupom.cupom_descricao,
        cupom_aplicavel: cupomAplicavel,
        netshoes_tag_selecao: tagSelecao,
        clube: clube.nome,
        automacao_origem: ORIGEM,
        external_id: produto.external_id,
        ativo: true,
        ordem: indiceClube * MAX_POR_CLUBE + indiceProduto,
        last_seen_at: agora,
        inactivated_at: null,
        updated_at: agora,
      })

      await sleep(DELAY_MS)
    }

    await sleep(DELAY_MS)
  }

  const ofertasUnicas = Array.from(new Map(ofertas.map(oferta => [oferta.external_id, oferta])).values())
  const salvas = await salvarOfertas(supabase, ofertasUnicas, { atualizarCupomExistente: cupom.cupom_origem === 'coupon-api' })
  const desativadas = await desativarOfertasAntigas(supabase, ofertasUnicas.map(oferta => oferta.external_id))

  console.log(`\nResumo Netshoes/Rakuten`)
  console.log(`  Ofertas encontradas: ${ofertas.length}`)
  console.log(`  Ofertas únicas: ${ofertasUnicas.length}`)
  console.log(`  Ofertas salvas: ${salvas}`)
  console.log(`  Ofertas antigas ocultadas: ${desativadas}`)
  console.log(`  Cupons Rakuten encontrados: ${cupons.length}`)
  if (dryRun) console.log('  Dry-run: nada foi gravado.')
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
