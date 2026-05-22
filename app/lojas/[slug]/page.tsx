import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CatalogoClient from '@/app/clubes/[slug]/ClubeClient'
import { carregarSearchData } from '@/lib/search-data'
import { carregarLojaPorSlug, carregarLojasAtivas } from '@/lib/loja-data'
import { descricaoCurtaLoja } from '@/lib/loja-utils'

const siteUrl = 'https://aguante.com.br'
const fallbackImage = '/assets/compartilhamento.jpg'

type LojaPageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function valor(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

export async function generateStaticParams() {
  try {
    const lojas = await carregarLojasAtivas()
    return lojas.map(loja => ({ slug: loja.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: LojaPageProps): Promise<Metadata> {
  const { slug } = await params
  const loja = await carregarLojaPorSlug(slug)

  if (!loja) {
    return {
      title: 'Loja não encontrada — Aguante',
      alternates: {
        canonical: `/lojas/${slug}`,
      },
    }
  }

  const title = `Camisas encontradas em ${loja.nome} — Aguante`
  const description = descricaoCurtaLoja(loja.nome)
  const canonical = `/lojas/${loja.slug}`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [
        {
          url: `${siteUrl}${fallbackImage}`,
          alt: 'Aguante — O buscador do colecionador',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}${fallbackImage}`],
    },
  }
}

export default async function LojaPage({ params, searchParams }: LojaPageProps) {
  const { slug } = await params
  const query = await searchParams
  const loja = await carregarLojaPorSlug(slug)

  if (!loja) notFound()

  const initialData = await carregarSearchData({
    fonte: loja.nome,
    decada: valor(query?.decada) || null,
    ordenar: valor(query?.ordenar) || null,
    de_jogo: valor(query?.de_jogo) || null,
    ordem: valor(query?.ordem) || null,
    pagina: valor(query?.pagina) || '1',
  })

  return (
    <CatalogoClient
      catalogo={{
        nome: loja.nome,
        slug: loja.slug,
        descricao: descricaoCurtaLoja(loja.nome),
        baseUrl: '/lojas',
        filtroParam: 'fonte',
        prefixoResultado: 'em',
        termoVazio: 'em',
      }}
      initialData={initialData}
    />
  )
}
