import { NextRequest, NextResponse } from 'next/server'
import { compararValorSeguro, criarSessaoAdmin } from '@/lib/admin-auth'

const MAX_TENTATIVAS = 5
const JANELA_MS = 1000 * 60 * 15

type TentativasLogin = {
  total: number
  primeiraTentativa: number
}

const tentativasPorOrigem = new Map<string, TentativasLogin>()

function origemDaRequisicao(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

function registrarTentativaInvalida(origem: string) {
  const agora = Date.now()
  const atual = tentativasPorOrigem.get(origem)

  if (!atual || agora - atual.primeiraTentativa > JANELA_MS) {
    tentativasPorOrigem.set(origem, { total: 1, primeiraTentativa: agora })
    return
  }

  tentativasPorOrigem.set(origem, {
    total: atual.total + 1,
    primeiraTentativa: atual.primeiraTentativa,
  })
}

function estaBloqueado(origem: string) {
  const tentativa = tentativasPorOrigem.get(origem)
  if (!tentativa) return false

  if (Date.now() - tentativa.primeiraTentativa > JANELA_MS) {
    tentativasPorOrigem.delete(origem)
    return false
  }

  return tentativa.total >= MAX_TENTATIVAS
}

export async function POST(req: NextRequest) {
  const origem = origemDaRequisicao(req)

  if (estaBloqueado(origem)) {
    return NextResponse.json({ erro: 'Muitas tentativas. Tente novamente em alguns minutos.' }, { status: 429 })
  }

  const { usuario, senha } = await req.json()
  const usuarioCorreto = process.env.ADMIN_USERNAME || 'admin'
  const senhaCorreta = process.env.ADMIN_PASSWORD

  if (!senhaCorreta) {
    return NextResponse.json({ erro: 'ADMIN_PASSWORD não configurado' }, { status: 500 })
  }

  const credenciaisValidas = typeof usuario === 'string'
    && typeof senha === 'string'
    && compararValorSeguro(usuario, usuarioCorreto)
    && compararValorSeguro(senha, senhaCorreta)

  if (!credenciaisValidas) {
    registrarTentativaInvalida(origem)
    return NextResponse.json({ erro: 'Credenciais incorretas' }, { status: 401 })
  }

  tentativasPorOrigem.delete(origem)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', criarSessaoAdmin(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })

  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}
