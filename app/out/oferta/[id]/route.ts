import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

type OfertaSaida = {
  id: string
  loja: string | null
  titulo: string | null
  link_afiliado: string | null
  link_produto: string | null
  cupom_codigo: string | null
  cupom_percentual: number | null
}

const UTM_SOURCE = process.env.OUTBOUND_UTM_SOURCE || 'aguante'
const UTM_MEDIUM = process.env.OUTBOUND_UTM_MEDIUM || 'referral'
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

function paginaOrigem(req: NextRequest, params: URLSearchParams) {
  return limitarTexto(params.get('pagina')) || limitarTexto(req.headers.get('referer'))
}

function origemUsuario(req: NextRequest, params: URLSearchParams) {
  const origemInformada = limitarTexto(params.get('origem') || params.get('utm_source') || params.get('source'), 120)
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

function sessionIdClique(params: URLSearchParams) {
  return limitarTexto(params.get(CLICK_SESSION_PARAM) || params.get('session_id'), 200)
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
    console.warn('Não foi possível verificar clique duplicado de oferta:', error.message)
    return true
  }

  return Boolean(data?.length)
}

function destinoComUtms(linkAfiliado: string, oferta: OfertaSaida, params: URLSearchParams) {
  const destino = new URL(linkAfiliado)
  const campanha = limitarTexto(params.get('campanha') || params.get('utm_campaign'), 120)
    || ['oferta', oferta.loja, oferta.cupom_codigo].filter(Boolean).map(parte => criarSlug(String(parte))).join('-')
    || `oferta-${oferta.id}`

  const utms: Record<string, string> = {
    utm_source: UTM_SOURCE,
    utm_medium: UTM_MEDIUM,
    utm_campaign: campanha,
    utm_content: criarSlug(oferta.titulo || oferta.id).slice(0, 120),
  }

  Object.entries(utms).forEach(([chave, valor]) => {
    if (!destino.searchParams.has(chave)) destino.searchParams.set(chave, valor)
  })

  return { destino, campanha }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = criarSupabaseAdmin()

  const { data: oferta, error } = await supabase
    .from('ofertas_afiliadas')
    .select('id,loja,titulo,link_afiliado,link_produto,cupom_codigo,cupom_percentual')
    .eq('id', id)
    .eq('ativo', true)
    .maybeSingle<OfertaSaida>()

  if (error || !oferta?.link_afiliado) {
    const fallback = new URL('/', req.url)
    fallback.searchParams.set('saida', 'oferta-indisponivel')
    return NextResponse.redirect(fallback)
  }

  let saida: URL
  let campanha: string

  try {
    const destino = destinoComUtms(oferta.link_afiliado, oferta, req.nextUrl.searchParams)
    saida = destino.destino
    campanha = destino.campanha
  } catch {
    const fallback = new URL('/', req.url)
    fallback.searchParams.set('saida', 'url-invalida')
    return NextResponse.redirect(fallback)
  }

  const agora = new Date().toISOString()
  const cupomParam = (req.nextUrl.searchParams.get('cupom_revelado') || '').toLowerCase()
  const cupomRevelado = Boolean(oferta.cupom_codigo) || ['1', 'true', 'sim'].includes(cupomParam)
  const sessionId = sessionIdClique(req.nextUrl.searchParams)

  if (!sessionId || acessoAutomatico(req) || await cliqueOfertaRecenteExiste(supabase, oferta.link_afiliado, sessionId)) {
    return NextResponse.redirect(saida)
  }

  const { error: eventoError } = await supabase
    .from('cliques_saida')
    .insert({
      produto_id: null,
      produto_titulo: oferta.titulo,
      loja_nome: oferta.loja,
      loja_url: oferta.link_produto,
      clicked_at: agora,
      origem_usuario: origemUsuario(req, req.nextUrl.searchParams),
      pagina_origem: paginaOrigem(req, req.nextUrl.searchParams),
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

  if (eventoError) console.warn('Não foi possível registrar clique de oferta:', eventoError.message)

  return NextResponse.redirect(saida)
}
