import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { senha } = await req.json()
  const senhaCorreta = process.env.ADMIN_PASSWORD

  if (!senhaCorreta) {
    return NextResponse.json({ erro: 'ADMIN_PASSWORD não configurada' }, { status: 500 })
  }

  if (senha !== senhaCorreta) {
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })

  return res
}
