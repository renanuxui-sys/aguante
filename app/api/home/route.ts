import { NextResponse } from 'next/server'
import { carregarHomeDataServidor } from '@/lib/home-data'

export async function GET() {
  try {
    return NextResponse.json(await carregarHomeDataServidor())
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar a home.' },
      { status: 500 }
    )
  }
}
