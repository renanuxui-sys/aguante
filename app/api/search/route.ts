import { NextRequest, NextResponse } from 'next/server'
import { carregarSearchData } from '@/lib/search-data'

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams
    return NextResponse.json(await carregarSearchData({
      q: params.get('q') || '',
      categoria: params.get('categoria'),
      clube: params.get('clube') || '',
      decada: params.get('decada'),
      ordenar: params.get('ordenar'),
      de_jogo: params.get('de_jogo'),
      ordem: params.get('ordem'),
      pagina: params.get('pagina'),
    }))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar produtos.' },
      { status: 500 }
    )
  }
}
