import type { Metadata } from 'next'
import Link from 'next/link'
import ProdutosExemplo from '@/components/loja/ProdutosExemplo'
import { produtosExemplo } from '@/lib/loja-propria-catalogo'

export const metadata: Metadata = { title: 'Colecionáveis — Loja Aguante', alternates: { canonical: '/loja/colecionaveis' } }

const categorias = [
  { label: 'Todos', valor: '' },
  { label: 'Estádios Premium', valor: 'premium' },
  { label: 'Estádios Standard', valor: 'standard' },
  { label: 'Mascotes', valor: 'mascotes' },
]

export default async function ColecionaveisPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria = '' } = await searchParams
  const selecionada = categorias.some(item => item.valor === categoria) ? categoria : ''
  return <main className="loja-page loja-inner-page"><div className="ag-container">
    <Link className="loja-back" href="/loja">← Loja Aguante</Link>
    <span className="loja-kicker">LOJA AGUANTE / COLECIONÁVEIS</span>
    <h1>Colecionáveis <em>de futebol.</em></h1>
    <p className="loja-page-description">Para montar, exibir e guardar um pedaço da sua paixão.</p>
    <nav className="loja-filters" aria-label="Categorias de colecionáveis">{categorias.map(item => <Link key={item.label} href={item.valor ? `/loja/colecionaveis?categoria=${item.valor}` : '/loja/colecionaveis'} aria-current={selecionada === item.valor ? 'page' : undefined}>{item.label}</Link>)}</nav>
    <p className="loja-preview-notice">Prévia ilustrativa do catálogo. Produtos, preços e disponibilidade ainda não estão confirmados.</p>
    <ProdutosExemplo produtos={produtosExemplo.filter(produto => !selecionada || produto.categoria === selecionada)} />
  </div></main>
}
