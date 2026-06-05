/**
 * Automação Netshoes via Rakuten Advertising.
 *
 * Teste sem gravar:
 *   node netshoes-rakuten.js --dry-run
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
const DEFAULT_CUPOM_VARIAVEL = process.env.NETSHOES_DEFAULT_COUPON_VARIABLE === 'true'
const DEFAULT_CUPOM_DESCRICAO = process.env.NETSHOES_DEFAULT_COUPON_DESCRIPTION || 'Cupom não válido para produtos com tag SELEÇÃO'
const MAX_POR_CLUBE = Math.max(1, Number(process.env.NETSHOES_MAX_OFFERS_PER_CLUB || 16))
const RESULTADOS_POR_BUSCA = Math.min(100, Math.max(1, Number(process.env.NETSHOES_SEARCH_MAX || 25)))
let accessTokenCache = null

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
  { nome: 'Internacional', buscas: ['internacional adidas', 'sc internacional adidas', 'sport club internacional'], termos: ['internacional', 'sc internacional', 'sport club internacional'], marcas: ['adidas'] },
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
]

const dryRun = process.argv.includes('--dry-run')
const somenteCupons = process.argv.includes('--somente-cupons')
const semDesativar = process.argv.includes('--sem-desativar')
const listarProdutos = process.argv.includes('--listar')
const TAMANHO_LOTE_SUPABASE = 50

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

function pareceCamisaOficial(produto, clube) {
  const textoTitulo = normalizarTexto(produto.titulo || '')
  const textoProduto = normalizarTexto(`${produto.titulo} ${produto.descricao}`)
  if (!/\bcamisa|camiseta|manto\b/.test(textoTitulo)) return false
  if (!contemClube(produto, clube)) return false
  if (/\s\+\s|combo|conjunto/.test(textoTitulo)) return false
  if (/\b(kit|selecao|selecoes|infantil|juvenil|kids|bebe|bebe|regata|casual|polo|jaqueta|short|bone|bone|moletom|chuteira|calca|meiao|top|cropped)\b/.test(textoTitulo)) return false
  if (/\b(retr[oô]|vintage|personalizada|customizada|treino|training|pre jogo|pre-jogo|pre match|pre-match|concentracao|viagem|goleiro|goalkeeper|historica|hist[oó]rica|legado|epic|replica)\b/.test(textoTitulo)) return false

  const marca = contemMarcaOficial(textoProduto)
  const marcaEsperada = contemMarcaEsperada(textoProduto, clube)
  const temporada = contemTemporada(textoTitulo)
  const linha = contemLinhaOficial(textoTitulo)
  const publicoOficial = /\b(torcedor|jogador|player|authentic|fa|fã)\b/.test(textoTitulo)
  const licenca = /\b(oficial|licenciado|licenciada)\b/.test(textoTitulo)

  return (licenca && marcaEsperada) || (marca && marcaEsperada && temporada && (linha || publicoOficial))
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
  url.searchParams.set('keyword', `camisa ${termoBusca}`)
  url.searchParams.set('mid', mid)
  url.searchParams.set('max', String(RESULTADOS_POR_BUSCA))
  url.searchParams.set('sort', 'retailprice')
  url.searchParams.set('sorttype', 'asc')

  const res = await fetch(url, { headers: await authHeaders(), timeout: 30000 })
  if (!res.ok) throw new Error(`Product Search falhou para ${clube.nome}: ${res.status} ${await res.text()}`)

  return parseProdutosXml(await res.text())
}

async function buscarProdutosClube(clube) {
  const produtosPorChave = new Map()
  const buscas = clube.buscas || [clube.busca || clube.nome]

  for (const termoBusca of buscas) {
    const produtos = await buscarProdutosPorTermo(clube, termoBusca)
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

  return Array.from(produtosPorChave.values())
    .sort((a, b) => pontuar(b) - pontuar(a))
    .slice(0, MAX_POR_CLUBE)
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

async function buscarProdutosNetshoes(clube) {
  const url = `${NETSHOES_URL}/busca/camisa-${slugBuscaNetshoes(clube)}`
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (compatible; AguanteAfiliados/1.0)',
    },
    timeout: 30000,
  })

  if (!res.ok) throw new Error(`Netshoes respondeu ${res.status}`)

  return produtosJsonLd(await res.text()).map(produto => {
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

function cupomPrincipal() {
  return {
    cupom_codigo: DEFAULT_CUPOM_CODIGO,
    cupom_percentual: DEFAULT_CUPOM_PERCENTUAL,
    cupom_percentual_variavel: DEFAULT_CUPOM_VARIAVEL,
    cupom_descricao: DEFAULT_CUPOM_DESCRICAO,
  }
}

function precoComCupom(valor, percentual, percentualVariavel, cupomAplicavel) {
  if (!valor || !percentual || percentualVariavel || !cupomAplicavel) return null
  return Math.round(valor * (1 - percentual / 100) * 100) / 100
}

function produtoTemTagSelecaoHtml(html) {
  const textoNormalizado = normalizarTexto(html || '')
  return /promotionflags["']?\s*:\s*["'][^"']*selecao/.test(textoNormalizado)
    || /"stamps"\s*:\s*\[[^\]]*"name"\s*:\s*"selecao"/.test(textoNormalizado)
    || /"name"\s*:\s*"selecao"[^}]*"style"\s*:\s*\{/.test(textoNormalizado)
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

async function salvarOfertas(supabase, ofertas) {
  if (ofertas.length === 0 || dryRun) return 0
  const ofertasUnicas = Array.from(new Map(ofertas.map(oferta => [oferta.external_id, oferta])).values())
  const externalIds = ofertasUnicas.map(oferta => oferta.external_id)

  const ofertasAtuais = []
  for (const loteExternalIds of dividirEmLotes(externalIds)) {
    const { data, error: buscaError } = await supabase
      .from('ofertas_afiliadas')
      .select('external_id,cupom_codigo,cupom_percentual,cupom_percentual_variavel,cupom_descricao')
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

    const cupomPercentual = atual.cupom_percentual ?? oferta.cupom_percentual
    const cupomPercentualVariavel = atual.cupom_percentual_variavel ?? oferta.cupom_percentual_variavel
    const precoBase = oferta.preco_pix || oferta.preco

    return {
      ...oferta,
      cupom_codigo: atual.cupom_codigo ?? oferta.cupom_codigo,
      cupom_percentual: cupomPercentual,
      cupom_percentual_variavel: cupomPercentualVariavel,
      cupom_descricao: atual.cupom_descricao ?? oferta.cupom_descricao,
      preco_com_cupom: precoComCupom(precoBase, Number(cupomPercentual), cupomPercentualVariavel, oferta.cupom_aplicavel),
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
  const supabase = criarSupabase()
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

  const cupons = await buscarCuponsRakuten()
  const cupom = cupomPrincipal()
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
        preco_com_cupom: precoComCupom(precoBase, cupom.cupom_percentual, cupom.cupom_percentual_variavel, cupomAplicavel),
        imagem_url: produto.imagem_url,
        link_afiliado: linkAfiliado,
        link_produto: produto.link_produto,
        cupom_codigo: cupom.cupom_codigo,
        cupom_percentual: cupom.cupom_percentual,
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
  const salvas = await salvarOfertas(supabase, ofertasUnicas)
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
