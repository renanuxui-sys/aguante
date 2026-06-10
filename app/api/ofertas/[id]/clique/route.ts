import { NextRequest } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type OfertaSaida = {
  id: string
  loja: string | null
  titulo: string | null
  link_afiliado: string | null
  link_produto: string | null
  cupom_codigo: string | null
}

type CliqueOfertaBody = Record<string, unknown>

const CLICK_SESSION_PARAM = 'sid'
const DUPLICATE_WINDOW_MINUTES = 30

function acessoAutomatico(req: NextRequest) {
  const purpose = [
    req.headers.get('purpose'),
    req.headers.get('sec-purpose'),
    req.headers.get('x-purpose'),
  ].filter(Boolean).join(' ').toLowerCase()

  if (purpose.includes('prefetch') || purpose.includes('preview')) return true
  if (req.headers.get('next-router-prefetch')) return true

  const userAgent = req.headers.get('user-agent') || ''
  if (!userAgent) return true

  return /bot|crawler|spider|preview|facebookexternalhit|whatsapp|slackbot|twitterbot|discordbot|telegrambot|linkedinbot|google-inspectiontool|lighthouse|headlesschrome|curl|wget|python|node-fetch|axios|go-http-client|uptime|monitor|vercel|bytespider|ahrefs|semrush|petalbot|bingbot|googlebot/i.test(userAgent)
}

function limitarTexto(valor: string | null | undefined, limite = 500) {
  if (!valor) return null
  const limpo = valor.trim()
  return limpo ? limpo.slice(0, limite) : null
}

function criarSlug(valor: string) {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function textoDoBody(body: CliqueOfertaBody, chave: string) {
  const valor = body[chave]
  return typeof valor === 'string' ? valor : null
}

function booleanoDoBody(body: CliqueOfertaBody, chave: string) {
  const valor = body[chave]
  if (typeof valor === 'boolean') return valor
  if (typeof valor === 'string') return ['1', 'true', 'sim'].includes(valor.toLowerCase())
  return false
}

async function lerBody(req: NextRequest): Promise<CliqueOfertaBody> {
  const texto = await req.text().catch(() => '')
  if (!texto) return {}

  try {
    const json = JSON.parse(texto)
    return json && typeof json === 'object' && !Array.isArray(json) ? json : {}
  } catch {
    return Object.fromEntries(new URLSearchParams(texto).entries())
  }
}

function paginaOrigem(req: NextRequest, body: CliqueOfertaBody) {
  return limitarTexto(textoDoBody(body, 'pagina')) || limitarTexto(req.headers.get('referer'))
}

function origemUsuario(req: NextRequest, body: CliqueOfertaBody) {
  const origemInformada = limitarTexto(textoDoBody(body, 'origem') || textoDoBody(body, 'utm_source') || textoDoBody(body, 'source'), 120)
  if (origemInformada) return origemInformada

  const referer = req.headers.get('referer')
  if (!referer) return 'direto'

  try {
    const origem = new URL(referer)
    return origem.hostname === req.nextUrl.hostname ? 'aguante' : origem.hostname
  } catch {
    return limitarTexto(referer, 120) || 'desconhecida'
  }
}

function sessionIdClique(body: CliqueOfertaBody) {
  return limitarTexto(textoDoBody(body, CLICK_SESSION_PARAM) || textoDoBody(body, 'session_id'), 200)
}

async function cliqueOfertaRecenteExiste(supabase: ReturnType<typeof criarSupabaseAdmin>, destinoOriginal: string, sessionId: string) {
  const desde = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('cliques_saida')
    .select('id')
    .eq('destino_original', destinoOriginal)
    .eq('session_id', sessionId)
    .gte('clicked_at', desde)
    .limit(1)

  if (error) {
    console.warn('Nao foi possivel verificar clique duplicado de oferta:', error.message)
    return true
  }

  return Boolean(data?.length)
}

function destinoDireto(linkAfiliado: string, oferta: OfertaSaida, body: CliqueOfertaBody) {
  const destino = new URL(linkAfiliado)
  const campanha = limitarTexto(textoDoBody(body, 'campanha') || textoDoBody(body, 'utm_campaign') || destino.searchParams.get('utm_campaign'), 120)
    || ['oferta', oferta.loja, oferta.cupom_codigo].filter(Boolean).map(parte => criarSlug(String(parte))).join('-')
    || `oferta-${oferta.id}`

  return { destino, campanha }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const body = await lerBody(req)
  const sessionId = sessionIdClique(body)

  if (!sessionId || acessoAutomatico(req)) {
    return Response.json({ ok: true, skipped: true })
  }

  const { id } = await ctx.params
  const supabase = criarSupabaseAdmin()

  const { data: oferta, error } = await supabase
    .from('ofertas_afiliadas')
    .select('id,loja,titulo,link_afiliado,link_produto,cupom_codigo')
    .eq('id', id)
    .eq('ativo', true)
    .maybeSingle<OfertaSaida>()

  if (error || !oferta?.link_afiliado) {
    return Response.json({ ok: false }, { status: 404 })
  }

  let saida: URL
  let campanha: string

  try {
    const destino = destinoDireto(oferta.link_afiliado, oferta, body)
    saida = destino.destino
    campanha = destino.campanha
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }

  if (await cliqueOfertaRecenteExiste(supabase, oferta.link_afiliado, sessionId)) {
    return Response.json({ ok: true, duplicate: true })
  }

  const cupomRevelado = Boolean(oferta.cupom_codigo) || booleanoDoBody(body, 'cupom_revelado')
  const { error: eventoError } = await supabase
    .from('cliques_saida')
    .insert({
      produto_id: null,
      produto_titulo: oferta.titulo,
      loja_nome: oferta.loja,
      loja_url: oferta.link_produto,
      clicked_at: new Date().toISOString(),
      origem_usuario: origemUsuario(req, body),
      pagina_origem: paginaOrigem(req, body),
      clube: null,
      categoria: 'oferta_afiliada',
      campanha,
      session_id: sessionId,
      usuario_status: 'anonimo',
      usuario_id: null,
      cupom_revelado: cupomRevelado,
      destino_original: oferta.link_afiliado,
      destino_com_utm: saida.toString(),
      user_agent: limitarTexto(req.headers.get('user-agent'), 1000),
      referer: limitarTexto(req.headers.get('referer'), 1000),
      utm_source: saida.searchParams.get('utm_source'),
      utm_medium: saida.searchParams.get('utm_medium'),
      utm_campaign: saida.searchParams.get('utm_campaign'),
      utm_content: saida.searchParams.get('utm_content'),
      utm_term: saida.searchParams.get('utm_term'),
    })

  if (eventoError) {
    console.warn('Nao foi possivel registrar clique direto de oferta:', eventoError.message)
    return Response.json({ ok: false }, { status: 500 })
  }

  return Response.json({ ok: true })
}
