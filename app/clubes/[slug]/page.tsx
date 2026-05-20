import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ClubeClient from './ClubeClient'
import { carregarSearchData } from '@/lib/search-data'
import { carregarClubePorSlug, carregarClubesAtivos } from '@/lib/clube-data'
import { descricaoCurtaClube } from '@/lib/clube-utils'

const siteUrl = 'https://aguante.com.br'
const fallbackImage = '/assets/compartilhamento.jpg'

type ClubePageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function valor(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

export async function generateStaticParams() {
  try {
    const clubes = await carregarClubesAtivos()
    return clubes.map(clube => ({ slug: clube.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: ClubePageProps): Promise<Metadata> {
  const { slug } = await params
  const clube = await carregarClubePorSlug(slug)

  if (!clube) {
    return {
      title: 'Clube não encontrado — Aguante',
      alternates: {
        canonical: `/clubes/${slug}`,
      },
    }
  }

  const title = `Camisas do ${clube.nome} antigas e retrô — Aguante`
  const description = descricaoCurtaClube(clube.nome)
  const canonical = `/clubes/${clube.slug}`
  const image = clube.escudo_url || fallbackImage

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
          url: image.startsWith('http') ? image : `${siteUrl}${image}`,
          alt: clube.escudo_url ? `Escudo do ${clube.nome}` : 'Aguante — O buscador do colecionador',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.startsWith('http') ? image : `${siteUrl}${image}`],
    },
  }
}

export default async function ClubePage({ params, searchParams }: ClubePageProps) {
  const { slug } = await params
  const query = await searchParams
  const clube = await carregarClubePorSlug(slug)

  if (!clube) notFound()

  const initialData = await carregarSearchData({
    clube: clube.nome,
    decada: valor(query?.decada) || null,
    ordenar: valor(query?.ordenar) || null,
    de_jogo: valor(query?.de_jogo) || null,
    ordem: valor(query?.ordem) || null,
    pagina: valor(query?.pagina) || '1',
  })

  return (
    <ClubeClient
      clube={{
        nome: clube.nome,
        slug: clube.slug,
        descricao: descricaoCurtaClube(clube.nome),
      }}
      initialData={initialData}
    />
  )
}
