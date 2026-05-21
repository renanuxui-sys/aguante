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
    const { data, error } = await criarSupabaseAdmin()
      .from('ofertas_afiliadas')
      .insert({
        ...importada,
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
