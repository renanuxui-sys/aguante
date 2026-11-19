import Link from 'next/link'
import GaleriaProduto from '@/components/loja/GaleriaProduto'
import CompraSimulada from '@/components/loja/CompraSimulada'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { produtosExemplo } from '@/lib/loja-propria-catalogo'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const produto = produtosExemplo.find(item => item.slug === slug)
  return { title: produto ? `${produto.nome} — Loja Aguante` : 'Produto não encontrado — Loja Aguante', alternates: { canonical: `/loja/produto/${slug}` } }
}

export default async function ProdutoLojaPage({ params }: Props) {
  const { slug } = await params
  const produto = produtosExemplo.find(item => item.slug === slug)
  if (!produto) notFound()
  return <main className="loja-page loja-inner-page"><div className="ag-container">
    <Link className="loja-back" href="/loja/colecionaveis">← Todos os colecionáveis</Link>
    <div className="loja-detail"><GaleriaProduto produto={produto} />
      <div className="loja-detail-copy"><span className="loja-kicker">ICONYX / {produto.categoriaNome.toUpperCase()}</span><h1>{produto.clube} — {produto.categoriaNome}</h1><p className="loja-detail-club">{produto.nome} · {produto.pecas.toLocaleString('pt-BR')} peças</p><p className="loja-pdv-label">PDV sugerido</p><p className="loja-price loja-detail-price">{produto.precoPdv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p><p className="loja-detail-disclaimer">Prévia com preço sugerido pelo fornecedor. Disponibilidade e venda ainda não estão confirmadas.</p>
      <CompraSimulada produto={produto} />
      <dl className="loja-specs"><div><dt>Código</dt><dd>{produto.sku}</dd></div><div><dt>Peças</dt><dd>{produto.pecas.toLocaleString('pt-BR')}</dd></div><div><dt>Dimensões montado</dt><dd>{produto.dimensoes}</dd></div>{produto.escala && <div><dt>Escala</dt><dd>{produto.escala}</dd></div>}</dl>
      </div></div>
  </div></main>
}
