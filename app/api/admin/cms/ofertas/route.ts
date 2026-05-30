import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { importarOferta, type LojaOferta } from '@/lib/oferta-metadata'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const LOJAS = new Set<LojaOferta>(['Mercado Livre', 'Netshoes'])

async function sessaoAdminValida() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

function lojaValida(valor: unknown): valor is LojaOferta {
  return typeof valor === 'string' && LOJAS.has(valor as LojaOferta)
}

function textoOpcional(valor: unknown, limite = 180) {
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  return limpo ? limpo.slice(0, limite) : null
}

function percentualOpcional(valor: unknown) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return null
  return Math.min(numero, 100)
}

function precoComCupom(preco: number | null | undefined, percentual: number | null) {
  if (typeof preco !== 'number' || !Number.isFinite(preco) || !percentual) return null
  return Math.round(preco * (1 - percentual / 100) * 100) / 100
}

function cupomDaOferta(body: Record<string, unknown>, loja: LojaOferta, preco: number | null | undefined) {
  const codigoPadrao = loja === 'Netshoes' ? 'AGUANTE' : null
  const percentualPadrao = loja === 'Netshoes' ? 15 : null
  const descricaoPadrao = loja === 'Netshoes' ? 'Cupom não válido para produtos com tag SELEÇÃO' : null

  const cupomCodigo = textoOpcional(body.cupom_codigo, 40) ?? codigoPadrao
  const cupomPercentual = percentualOpcional(body.cupom_percentual) ?? percentualPadrao
  const cupomDescricao = textoOpcional(body.cupom_descricao) ?? descricaoPadrao

  return {
    cupom_codigo: cupomCodigo,
    cupom_percentual: cupomPercentual,
    cupom_descricao: cupomDescricao,
    preco_com_cupom: precoComCupom(preco, cupomPercentual),
  }
}

export async function GET() {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { data, error } = await criarSupabaseAdmin()
      .from('ofertas_afiliadas')
      .select('*')
      .order('ativo', { ascending: false })
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ofertas: data || [] })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao carregar ofertas.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    if (!lojaValida(body.loja)) return Response.json({ error: 'Escolha Mercado Livre ou Netshoes.' }, { status: 400 })

    const linkAfiliado = String(body.link_afiliado || '').trim()
    const importada = await importarOferta(linkAfiliado, body.loja)
    const cupom = cupomDaOferta(body, body.loja, importada.preco)
    const { data, error } = await criarSupabaseAdmin()
      .from('ofertas_afiliadas')
      .insert({
        ...importada,
        ...cupom,
        link_afiliado: linkAfiliado,
        ordem: Math.max(0, Number(body.ordem || 0) || 0),
        ativo: true,
      })
      .select('*')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ oferta: data }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao importar oferta.' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return Response.json({ error: 'Oferta não informada.' }, { status: 400 })

    const atualizacao: Record<string, unknown> = {}
    if (typeof body.ativo === 'boolean') atualizacao.ativo = body.ativo
    if (body.ordem !== undefined) atualizacao.ordem = Math.max(0, Number(body.ordem) || 0)
    if (body.cupom_codigo !== undefined) atualizacao.cupom_codigo = textoOpcional(body.cupom_codigo, 40)
    if (body.cupom_percentual !== undefined) atualizacao.cupom_percentual = percentualOpcional(body.cupom_percentual)
    if (body.cupom_descricao !== undefined) atualizacao.cupom_descricao = textoOpcional(body.cupom_descricao)

    if (body.reimportar === true) {
      const { data: ofertaAtual, error: buscaError } = await criarSupabaseAdmin()
        .from('ofertas_afiliadas')
        .select('loja,link_afiliado,cupom_percentual')
        .eq('id', id)
        .single()

      if (buscaError) return Response.json({ error: buscaError.message }, { status: 500 })
      if (!lojaValida(ofertaAtual?.loja)) return Response.json({ error: 'Loja inválida.' }, { status: 400 })

      const importada = await importarOferta(String(ofertaAtual.link_afiliado || ''), ofertaAtual.loja)
      Object.assign(atualizacao, importada)
      atualizacao.preco_com_cupom = precoComCupom(importada.preco, percentualOpcional(atualizacao.cupom_percentual ?? ofertaAtual.cupom_percentual))
    }

    if (!body.reimportar && body.cupom_percentual !== undefined) {
      const { data: ofertaAtual, error: buscaError } = await criarSupabaseAdmin()
        .from('ofertas_afiliadas')
        .select('preco')
        .eq('id', id)
        .single()

      if (buscaError) return Response.json({ error: buscaError.message }, { status: 500 })
      atualizacao.preco_com_cupom = precoComCupom(ofertaAtual?.preco, atualizacao.cupom_percentual as number | null)
    }

    if (Object.keys(atualizacao).length === 0) return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
    atualizacao.updated_at = new Date().toISOString()

    const { data, error } = await criarSupabaseAdmin()
      .from('ofertas_afiliadas')
      .update(atualizacao)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ oferta: data })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar oferta.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'Oferta não informada.' }, { status: 400 })

    const { error } = await criarSupabaseAdmin().from('ofertas_afiliadas').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao remover oferta.' }, { status: 500 })
  }
}
