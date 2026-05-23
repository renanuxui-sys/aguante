import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

async function sessaoAdminValida() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

export async function PATCH(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return Response.json({ error: 'Produto não informado.' }, { status: 400 })

    const atualizacao: Record<string, unknown> = {}
    ;['ativo', 'de_jogo', 'novidade', 'alta_procura'].forEach(campo => {
      if (typeof body[campo] === 'boolean') atualizacao[campo] = body[campo]
    })

    if (typeof body.ativo === 'boolean') {
      atualizacao.inactivated_at = body.ativo ? null : new Date().toISOString()
      if (body.ativo) atualizacao.reactivated_at = new Date().toISOString()
    }

    if (Object.keys(atualizacao).length === 0) {
      return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    atualizacao.updated_at = new Date().toISOString()

    const { data, error } = await criarSupabaseAdmin()
      .from('produtos')
      .update(atualizacao)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ produto: data })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar produto.' }, { status: 500 })
  }
}
