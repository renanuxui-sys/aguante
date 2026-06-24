import { NextRequest, NextResponse } from 'next/server'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

function respostaHtml(titulo: string, texto: string, status = 200) {
  return new NextResponse(`<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${titulo}</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f5f5; color: #282828; font-family: Arial, sans-serif; }
          main { width: min(520px, calc(100% - 32px)); background: #fff; border: 1px solid #e8e6df; border-radius: 12px; padding: 32px; text-align: center; }
          h1 { margin: 0 0 12px; font-size: 24px; }
          p { margin: 0 0 22px; color: #62748c; line-height: 1.5; }
          a { color: #550fed; font-weight: 700; text-decoration: none; }
        </style>
      </head>
      <body>
        <main>
          <h1>${titulo}</h1>
          <p>${texto}</p>
          <a href="/ofertas-netshoes">Voltar para ofertas</a>
        </main>
      </body>
    </html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status,
  })
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params

  if (!token) {
    return respostaHtml('Link inválido', 'Não encontramos esse cadastro.', 404)
  }

  const { error } = await criarSupabaseAdmin()
    .from('newsletter_netshoes')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)

  if (error) {
    console.error('Erro ao descadastrar newsletter Netshoes:', error)
    return respostaHtml('Não foi possível descadastrar', 'Tente novamente em alguns minutos.', 500)
  }

  return respostaHtml('Cadastro removido', 'Você não receberá mais alertas de ofertas Netshoes por e-mail.')
}
