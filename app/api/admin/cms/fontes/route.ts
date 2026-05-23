import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

type ProdutoFonte = {
  fonte_nome: string | null
  fonte_url: string | null
  ativo: boolean | null
  last_seen_at: string | null
  updated_at: string | null
  created_at: string | null
}

type FonteExistente = {
  id: string
  nome: string
  url: string
}

async function sessaoAdminValida() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

function normalizarUrlFonte(nome: string) {
  return `https://aguante.com.br/fontes/${nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
}

function dataMaisRecente(...datas: Array<string | null | undefined>) {
  return datas
    .filter((data): data is string => Boolean(data))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null
}

async function carregarTodosProdutosFonte() {
  const supabase = criarSupabaseAdmin()
  const produtos: ProdutoFonte[] = []
  const tamanhoPagina = 1000
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('fonte_nome,fonte_url,ativo,last_seen_at,updated_at,created_at')
      .not('fonte_nome', 'is', null)
      .range(offset, offset + tamanhoPagina - 1)

    if (error) throw error
    produtos.push(...((data || []) as ProdutoFonte[]))
    if (!data || data.length < tamanhoPagina) break
    offset += tamanhoPagina
  }

  return produtos
}

async function sincronizarFontes() {
  const supabase = criarSupabaseAdmin()
  const produtos = await carregarTodosProdutosFonte()
  const agregadas = new Map<string, { nome: string; url: string; total: number; ultimo: string | null }>()

  produtos.forEach(produto => {
    const nome = produto.fonte_nome?.trim()
    if (!nome) return

    const atual = agregadas.get(nome) || {
      nome,
      url: produto.fonte_url?.trim() || normalizarUrlFonte(nome),
      total: 0,
      ultimo: null,
    }

    if (produto.fonte_url?.trim() && atual.url.startsWith('https://aguante.com.br/fontes/')) {
      atual.url = produto.fonte_url.trim()
    }
    if (produto.ativo) atual.total += 1
    atual.ultimo = dataMaisRecente(atual.ultimo, produto.last_seen_at, produto.updated_at, produto.created_at)
    agregadas.set(nome, atual)
  })

  const { data: existentes, error } = await supabase
    .from('fontes')
    .select('id,nome,url')

  if (error) throw error

  const porNome = new Map((existentes || []).map((fonte: FonteExistente) => [fonte.nome, fonte]))
  const porUrl = new Map((existentes || []).map((fonte: FonteExistente) => [fonte.url, fonte]))
  const agora = new Date().toISOString()

  for (const fonte of agregadas.values()) {
    const existente = porNome.get(fonte.nome) || porUrl.get(fonte.url)
    const url = fonte.url.startsWith('https://aguante.com.br/fontes/') && existente?.url
      ? existente.url
      : fonte.url
    const dados = {
      nome: fonte.nome,
      url,
      total_produtos: fonte.total,
      ultimo_scraping: fonte.ultimo,
      updated_at: agora,
    }

    if (existente) {
      await supabase.from('fontes').update(dados).eq('id', existente.id)
    } else {
      await supabase.from('fontes').insert({
        ...dados,
        ativa: true,
        visivel_site: true,
      })
    }
  }
}

export async function GET() {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const supabase = criarSupabaseAdmin()
    await sincronizarFontes()

    const { data, error } = await supabase
      .from('fontes')
      .select('*')
      .order('nome', { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ fontes: data || [] })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao carregar fontes.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const nome = String(body.nome || '').trim()
    const url = String(body.url || '').trim()

    if (!nome || !url) return Response.json({ error: 'Nome e URL são obrigatórios.' }, { status: 400 })

    const { data, error } = await criarSupabaseAdmin()
      .from('fontes')
      .insert({
        nome,
        url,
        ativa: body.ativa !== false,
        visivel_site: body.visivel_site !== false,
        seletor_produto: body.seletor_produto || null,
        seletor_titulo: body.seletor_titulo || null,
        seletor_preco: body.seletor_preco || null,
        seletor_imagem: body.seletor_imagem || null,
        seletor_link: body.seletor_link || null,
        observacoes: body.observacoes || null,
      })
      .select('*')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ fonte: data }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao criar fonte.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return Response.json({ error: 'Fonte não informada.' }, { status: 400 })

    const atualizacao: Record<string, unknown> = {}
    ;['nome', 'url', 'seletor_produto', 'seletor_titulo', 'seletor_preco', 'seletor_imagem', 'seletor_link', 'observacoes'].forEach(campo => {
      if (campo in body) atualizacao[campo] = body[campo] || null
    })
    if (typeof body.ativa === 'boolean') atualizacao.ativa = body.ativa
    if (typeof body.visivel_site === 'boolean') atualizacao.visivel_site = body.visivel_site

    if (Object.keys(atualizacao).length === 0) {
      return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    atualizacao.updated_at = new Date().toISOString()

    const { data, error } = await criarSupabaseAdmin()
      .from('fontes')
      .update(atualizacao)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ fonte: data })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar fonte.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'Fonte não informada.' }, { status: 400 })

    const { error } = await criarSupabaseAdmin().from('fontes').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao remover fonte.' }, { status: 500 })
  }
}
