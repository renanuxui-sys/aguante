import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { imagemComProxy } from '@/lib/image-url'
import { formatarResumoProduto } from '@/lib/product-description'

const siteUrl = 'https://aguante.com.br'
const fallbackTitle = 'Camisa colecionável — Aguante'
const fallbackDescription = 'Veja detalhes desta camisa de futebol colecionável encontrada pela Aguante.'
const fallbackImage = '/assets/compartilhamento.jpg'

type ProdutoMetadata = {
  titulo: string | null
  clube: string | null
  ano: string | null
  tags: string[] | null
  imagem_url: string | null
  fonte_nome: string | null
}

async function buscarProduto(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data } = await supabase
    .from('produtos')
    .select('titulo, clube, ano, tags, imagem_url, fonte_nome')
    .eq('id', id)
    .eq('ativo', true)
    .single<ProdutoMetadata>()

  return data
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const produto = await buscarProduto(id)
  const canonical = `/produto/${id}`

  if (!produto) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical,
      },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: canonical,
        images: [fallbackImage],
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        images: [fallbackImage],
      },
    }
  }

  const title = `${produto.titulo || 'Camisa colecionável'} — Aguante`
  const description = [
    formatarResumoProduto(produto),
    produto.fonte_nome ? `Encontrada em ${produto.fonte_nome}.` : 'Encontrada pela Aguante.',
  ].join(' ')
  const image = imagemComProxy(produto.imagem_url) || fallbackImage

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
          alt: produto.titulo || 'Camisa colecionável na Aguante',
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

export default function ProdutoLayout({ children }: { children: React.ReactNode }) {
  return children
}
