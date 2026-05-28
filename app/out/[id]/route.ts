import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

type ProdutoSaida = {
  id: string
  titulo: string | null
  link_original: string | null
  fonte_nome: string | null
  fonte_url: string | null
  clube: string | null
  tipo_camisa: string | null
  tags: string[] | null
  cliques_anuncio: number | null
}

const UTM_SOURCE = process.env.OUTBOUND_UTM_SOURCE || 'aguante'
const UTM_MEDIUM = process.env.OUTBOUND_UTM_MEDIUM || 'referral'

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

function campanhaPadrao(produto: ProdutoSaida) {
  const partes = ['produto', produto.fonte_nome, produto.clube]
    .filter((parte): parte is string => Boolean(parte))
    .map(criarSlug)
    .filter(Boolean)

  return partes.join('-') || `produto-${produto.id}`
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

function destinoComUtms(linkOriginal: string, produto: ProdutoSaida, params: URLSearchParams) {
  const destino = new URL(linkOriginal)
  const campanha = limitarTexto(params.get('campanha') || params.get('utm_campaign'), 120) || campanhaPadrao(produto)
  const utms: Record<string, string> = {
    utm_source: UTM_SOURCE,
    utm_medium: UTM_MEDIUM,
    utm_campaign: campanha,
    utm_content: criarSlug(produto.titulo || produto.id).slice(0, 120),
  }

  if (produto.clube) utms.utm_term = criarSlug(produto.clube).slice(0, 120)

  Object.entries(utms).forEach(([chave, valor]) => {
    if (!destino.searchParams.has(chave)) destino.searchParams.set(chave, valor)
  })

  return { destino, campanha }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await ctx.params
  const id = idParam.replace(/^produto-/, '')
  const supabase = criarSupabaseAdmin()

  const { data: produto, error } = await supabase
    .from('produtos')
    .select('id,titulo,link_original,fonte_nome,fonte_url,clube,tipo_camisa,tags,cliques_anuncio')
    .eq('id', id)
    .eq('ativo', true)
    .maybeSingle<ProdutoSaida>()

  if (error || !produto?.link_original) {
    const fallback = new URL(`/produto/${encodeURIComponent(id)}`, req.url)
    fallback.searchParams.set('saida', 'indisponivel')
    return NextResponse.redirect(fallback)
  }

  let saida: URL
  let campanha: string

  try {
    const destino = destinoComUtms(produto.link_original, produto, req.nextUrl.searchParams)
    saida = destino.destino
    campanha = destino.campanha
  } catch {
    const fallback = new URL(`/produto/${encodeURIComponent(id)}`, req.url)
    fallback.searchParams.set('saida', 'url-invalida')
    return NextResponse.redirect(fallback)
  }

  const proximoTotal = Number(produto.cliques_anuncio || 0) + 1
  const agora = new Date().toISOString()
  const cupomRevelado = ['1', 'true', 'sim'].includes((req.nextUrl.searchParams.get('cupom_revelado') || '').toLowerCase())
  const statusUsuario = 'anonimo'

  const [{ error: updateError }, { error: eventoError }] = await Promise.all([
    supabase
      .from('produtos')
      .update({ cliques_anuncio: proximoTotal, updated_at: agora })
      .eq('id', produto.id),
    supabase
      .from('cliques_saida')
      .insert({
        produto_id: produto.id,
        produto_titulo: produto.titulo,
        loja_nome: produto.fonte_nome,
        loja_url: produto.fonte_url,
        clicked_at: agora,
        origem_usuario: origemUsuario(req, req.nextUrl.searchParams),
        pagina_origem: paginaOrigem(req, req.nextUrl.searchParams),
        clube: produto.clube,
        categoria: produto.tipo_camisa || produto.tags?.[0] || null,
        campanha,
        usuario_status: statusUsuario,
        usuario_id: null,
        cupom_revelado: cupomRevelado,
        destino_original: produto.link_original,
        destino_com_utm: saida.toString(),
        user_agent: limitarTexto(req.headers.get('user-agent'), 1000),
        referer: limitarTexto(req.headers.get('referer'), 1000),
        utm_source: saida.searchParams.get('utm_source'),
        utm_medium: saida.searchParams.get('utm_medium'),
        utm_campaign: saida.searchParams.get('utm_campaign'),
        utm_content: saida.searchParams.get('utm_content'),
        utm_term: saida.searchParams.get('utm_term'),
      }),
  ])

  if (updateError) console.warn('Não foi possível atualizar cliques_anuncio:', updateError.message)
  if (eventoError) console.warn('Não foi possível registrar cliques_saida:', eventoError.message)

  return NextResponse.redirect(saida)
}
