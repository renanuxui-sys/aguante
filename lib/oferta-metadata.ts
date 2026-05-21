export type LojaOferta = 'Mercado Livre' | 'Netshoes'

type OfertaImportada = {
  loja: LojaOferta
  titulo: string
  preco: number | null
  imagem_url: string | null
  link_produto: string
}

type MercadoLivreItem = {
  title?: string
  price?: number
  permalink?: string
  pictures?: Array<{ secure_url?: string; url?: string }>
  thumbnail?: string
}

const HOSTS_LOJA: Record<LojaOferta, RegExp> = {
  'Mercado Livre': /(^|\.)mercadolivre\.com(\.br)?$|^meli\.la$/i,
  Netshoes: /(^|\.)netshoes\.com\.br$/i,
}

function urlPermitida(url: URL, loja: LojaOferta) {
  return url.protocol === 'https:' && HOSTS_LOJA[loja].test(url.hostname)
}

function validarUrlLoja(valor: string, loja: LojaOferta) {
  const url = new URL(valor)
  if (!urlPermitida(url, loja)) {
    throw new Error(`Use um link https de ${loja}.`)
  }
  return url
}

function meta(html: string, chave: string) {
  const escaped = chave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const padraoDireto = new RegExp(`<meta\\s+[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')
  const padraoInvertido = new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
  return html.match(padraoDireto)?.[1] || html.match(padraoInvertido)?.[1] || ''
}

function textoHtml(texto: string) {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function parsePreco(valor: unknown) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (typeof valor !== 'string') return null

  const limpo = valor
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  const preco = Number(limpo)
  return Number.isFinite(preco) ? preco : null
}

function primeiroProdutoJsonLd(html: string): Record<string, unknown> | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || []

  for (const script of scripts) {
    const conteudo = script
      .replace(/^<script[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim()

    try {
      const raiz = JSON.parse(conteudo)
      const fila = Array.isArray(raiz) ? [...raiz] : [raiz]

      while (fila.length) {
        const item = fila.shift()
        if (!item || typeof item !== 'object') continue
        const objeto = item as Record<string, unknown>
        const tipo = objeto['@type']
        if (tipo === 'Product' || (Array.isArray(tipo) && tipo.includes('Product'))) return objeto
        if (Array.isArray(objeto['@graph'])) fila.push(...objeto['@graph'])
      }
    } catch {
      continue
    }
  }

  return null
}

async function buscarPaginaInicial(link: string, loja: LojaOferta) {
  let url = validarUrlLoja(link, loja)

  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const resposta = await fetch(url, {
      redirect: 'manual',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'AguanteOfertas/1.0',
      },
      cache: 'no-store',
    })

    if (resposta.status >= 300 && resposta.status < 400) {
      const location = resposta.headers.get('location')
      if (!location) throw new Error('O link redirecionou sem destino.')
      url = new URL(location, url)
      if (!urlPermitida(url, loja)) throw new Error('O link redirecionou para um domínio não permitido.')
      continue
    }

    if (!resposta.ok) throw new Error(`Não foi possível ler o link (${resposta.status}).`)
    return { html: await resposta.text(), url: url.toString() }
  }

  throw new Error('O link redirecionou muitas vezes.')
}

function mercadoLivreId(url: string) {
  return url.match(/\b(MLB-?\d{6,})\b/i)?.[1]?.replace('-', '').toUpperCase() || ''
}

async function importarItemMercadoLivre(url: string) {
  const itemId = mercadoLivreId(url)
  if (!itemId || !process.env.ML_ACCESS_TOKEN) return null

  const resposta = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
    headers: {
      Authorization: `Bearer ${process.env.ML_ACCESS_TOKEN}`,
      Accept: 'application/json',
      'User-Agent': 'AguanteOfertas/1.0',
    },
    cache: 'no-store',
  })
  if (!resposta.ok) return null

  const item = await resposta.json() as MercadoLivreItem
  return {
    titulo: item.title || '',
    preco: parsePreco(item.price),
    imagem_url: item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || item.thumbnail || null,
    link_produto: item.permalink || url,
  }
}

function importarMetas(html: string, linkProduto: string) {
  const produto = primeiroProdutoJsonLd(html)
  const offers = Array.isArray(produto?.offers) ? produto.offers[0] : produto?.offers
  const ofertaJson = offers && typeof offers === 'object'
    ? offers as Record<string, unknown>
    : null
  const imagemJson = Array.isArray(produto?.image) ? produto.image[0] : produto?.image

  return {
    titulo: textoHtml(String(produto?.name || meta(html, 'og:title') || meta(html, 'twitter:title'))),
    preco: parsePreco(ofertaJson?.price || meta(html, 'product:price:amount')),
    imagem_url: textoHtml(String(imagemJson || meta(html, 'og:image') || meta(html, 'twitter:image'))) || null,
    link_produto: meta(html, 'og:url') || linkProduto,
  }
}

export async function importarOferta(linkAfiliado: string, loja: LojaOferta): Promise<OfertaImportada> {
  const link = linkAfiliado.trim()
  if (!link) throw new Error('Informe o link afiliado.')

  const pagina = await buscarPaginaInicial(link, loja)
  const apiMercadoLivre = loja === 'Mercado Livre'
    ? await importarItemMercadoLivre(pagina.url)
    : null
  const metadadosPagina = importarMetas(pagina.html, pagina.url)

  const importada = {
    loja,
    titulo: apiMercadoLivre?.titulo || metadadosPagina.titulo,
    preco: apiMercadoLivre?.preco ?? metadadosPagina.preco,
    imagem_url: apiMercadoLivre?.imagem_url || metadadosPagina.imagem_url,
    link_produto: apiMercadoLivre?.link_produto || metadadosPagina.link_produto,
  }

  if (!importada.titulo || !importada.imagem_url) {
    throw new Error('Não consegui buscar título e foto deste link. Tente o link direto do produto.')
  }

  return importada
}
