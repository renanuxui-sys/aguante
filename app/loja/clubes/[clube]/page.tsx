import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProdutosExemplo from '@/components/loja/ProdutosExemplo'
import { produtosExemplo } from '@/lib/loja-propria-catalogo'
import './clube.css'

const clubes = {
  palmeiras: {
    nome: 'Palmeiras',
    label: 'A CASA É SUA',
    headline: 'O Palestra, peça por peça.',
    introducao: 'Um pedaço da história do Verdão para montar, exibir e chamar de seu.',
    sku: 'ICFUT0076',
    mascote: 'ICFUT0013',
    estadio: 'Palestra Italia',
    destaque: 'A arquibancada. As torres. Cada detalhe.',
    outro: 'corinthians',
    outroNome: 'Corinthians',
  },
  corinthians: {
    nome: 'Corinthians',
    label: 'A CASA É SUA',
    headline: 'Sua paixão, peça por peça.',
    introducao: 'A Neo Química Arena para montar, exibir e sentir ainda mais perto.',
    sku: 'ICFUT0020',
    mascote: 'ICFUT0018',
    estadio: 'Neo Química Arena',
    destaque: 'A arena. A arquibancada. Cada detalhe.',
    outro: 'palmeiras',
    outroNome: 'Palmeiras',
  },
} as const

type Props = { params: Promise<{ clube: string }> }

function clubeValido(clube: string): clube is keyof typeof clubes { return Object.prototype.hasOwnProperty.call(clubes, clube) }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clube } = await params
  if (!clubeValido(clube)) return { title: 'Coleção não encontrada — Aguante Shop' }
  return { title: `${clubes[clube].nome} — Aguante Shop`, description: `Conheça a coleção de blocos de montar do ${clubes[clube].nome} na Aguante Shop.`, alternates: { canonical: `/loja/clubes/${clube}` } }
}

export default async function ClubeShopPage({ params }: Props) {
  const { clube } = await params
  if (!clubeValido(clube)) notFound()
  const dados = clubes[clube]
  const produto = produtosExemplo.find(item => item.sku === dados.sku)!
  const mascote = produtosExemplo.find(item => item.sku === dados.mascote)!
  const colecao = produtosExemplo.filter(item => item.clube === dados.nome).sort((a, b) => ({ premium: 0, standard: 1, mascotes: 2 }[a.categoria] - { premium: 0, standard: 1, mascotes: 2 }[b.categoria]))
  const foto = (sku: string, extra = '') => `/assets/loja/iconyx/${sku.toLowerCase()}${extra}.webp`
  return <main className={`loja-page shop-clube shop-${clube}`}>
    <div className="shop-container">
      <section className="shop-hero"><div className="shop-hero-copy"><span className="shop-kicker">AGUANTE SHOP / {dados.nome.toUpperCase()}</span><h1>{dados.headline}</h1><p>{dados.introducao}</p><div className="shop-actions"><Link className="shop-btn shop-btn-dark" href="#colecao">Explorar coleção <span aria-hidden="true">↗</span></Link><Link className="shop-btn shop-btn-outline" href={`/loja/produto/${produto.slug}`}>Ver estádio Premium</Link></div><small>Prévia da coleção · estoque e compra simulados</small></div><div className="shop-hero-image"><div className="shop-orbit" aria-hidden="true" /><Image src={foto(dados.sku)} alt={`${dados.estadio} Premium em blocos de montar`} width={900} height={600} priority /><span className="shop-image-label">{dados.label}<br /><strong>{dados.estadio}</strong></span><span className="shop-image-index">01 / 03</span></div></section>
      <section className="shop-intro"><span className="shop-kicker">PARA QUEM VIVE O FUTEBOL</span><h2>O seu clube.<br /><em>Em cada detalhe.</em></h2><p>Tem lugar que a gente reconhece de longe. Agora, você pode construir essa história com as próprias mãos.</p></section>
      <section className="shop-feature"><div className="shop-feature-image"><Image src={foto(dados.sku, '-2')} alt={`Outra vista do ${dados.estadio} Premium`} width={900} height={650} /><span>ESTÁDIO PREMIUM / ICONYX</span></div><div className="shop-feature-copy"><span className="shop-kicker">UM ÍCONE PARA MONTAR</span><h2>{dados.destaque}</h2><p>Uma versão em blocos para montar no seu ritmo e encontrar um lugar especial na coleção.</p><div className="shop-stats"><div><strong>{produto.pecas.toLocaleString('pt-BR')}</strong><span>peças</span></div><div><strong>{produto.escala}</strong><span>escala</span></div></div><Link href={`/loja/produto/${produto.slug}`} className="shop-link">Conhecer o estádio <span aria-hidden="true">↗</span></Link></div></section>
      <section className="shop-story"><div><span className="shop-kicker">COLECIONE A SUA PAIXÃO</span><h2>O futebol mora<br /><em>nos detalhes.</em></h2><p>Da primeira peça ao último encaixe, uma nova forma de ter o seu clube por perto.</p><Link className="shop-link" href={`/loja/produto/${mascote.slug}`}>Conhecer o mascote <span aria-hidden="true">↗</span></Link></div><div className="shop-mascot"><Image src={foto(dados.mascote)} alt={`Mascote do ${dados.nome} em blocos de montar`} width={520} height={580} /><span>ÍCONE / {dados.nome.toUpperCase()}</span></div></section>
      <section className="shop-collection" id="colecao"><div className="shop-section-head"><div><span className="shop-kicker">AGUANTE SHOP / {dados.nome.toUpperCase()}</span><h2>Escolha seu próximo<br /><em>item de coleção.</em></h2></div><p>Estádios e mascote, cada um com sua própria história.</p></div><p className="loja-preview-notice">Prévia com preços sugeridos. Estoque e compra são simulações.</p><ProdutosExemplo produtos={colecao} /></section>
      <section className="shop-closing"><span className="shop-kicker">O FUTEBOL NÃO TERMINA NO APITO</span><h2>O próximo capítulo<br /><em>começa por aqui.</em></h2><Link className="shop-btn shop-btn-dark" href="/loja/colecionaveis">Explorar todas as coleções ↗</Link><Link className="shop-link" href={`/loja/clubes/${dados.outro}`}>Conhecer coleção {dados.outroNome} ↗</Link></section>
    </div>
  </main>
}
