import { NextRequest, NextResponse } from 'next/server'
import { carregarOfertasNetshoes } from '@/lib/ofertas-data'

export async function GET(req: NextRequest) {
  try {
    const clube = new URL(req.url).searchParams.get('clube')?.trim()
    if (!clube || clube === 'nao_escolheu') {
      return NextResponse.json({ ofertas: [] })
    }

    const ofertas = await carregarOfertasNetshoes({ clube, limite: 12 })
    return NextResponse.json({ ofertas })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar ofertas.' },
      { status: 500 }
    )
  }
}
