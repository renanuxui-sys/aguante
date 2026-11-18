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
const clubes = Array.from(new Set(produtosExemplo.map(produto => produto.clube))).sort((a, b) => a.localeCompare(b, 'pt-BR'))
const ordem = { standard: 0, premium: 1, mascotes: 2 }

function linkFiltros(categoria: string, clube: string) {
  const params = new URLSearchParams()
  if (categoria) params.set('categoria', categoria)
  if (clube) params.set('clube', clube)
  const query = params.toString()
  return `/loja/colecionaveis${query ? `?${query}` : ''}`
}

export default async function ColecionaveisPage({ searchParams }: { searchParams: Promise<{ categoria?: string; clube?: string }> }) {
  const { categoria = '', clube = '' } = await searchParams
  const selecionada = categorias.some(item => item.valor === categoria) ? categoria : ''
  const clubeSelecionado = clubes.includes(clube) ? clube : ''
  const grupos = clubes.map(nome => ({ nome, produtos: produtosExemplo.filter(produto => produto.clube === nome && (!selecionada || produto.categoria === selecionada) && (!clubeSelecionado || produto.clube === clubeSelecionado)).sort((a, b) => ordem[a.categoria] - ordem[b.categoria]) })).filter(grupo => grupo.produtos.length > 0)
  return <main className="loja-page loja-inner-page"><div className="ag-container">
    <Link className="loja-back" href="/loja">← Loja Aguante</Link>
    <span className="loja-kicker">LOJA AGUANTE / COLECIONÁVEIS</span>
    <h1>Colecionáveis <em>de futebol.</em></h1>
    <p className="loja-page-description">Para montar, exibir e guardar um pedaço da sua paixão.</p>
    <nav className="loja-filters" aria-label="Categorias de colecionáveis">{categorias.map(item => <Link key={item.label} href={linkFiltros(item.valor, clubeSelecionado)} aria-current={selecionada === item.valor ? 'page' : undefined}>{item.label}</Link>)}</nav>
    <nav className="loja-club-filters" aria-label="Filtrar por clube"><Link href={linkFiltros(selecionada, '')} aria-current={!clubeSelecionado ? 'page' : undefined}>Todos os clubes</Link>{clubes.map(nome => <Link key={nome} href={linkFiltros(selecionada, nome)} aria-current={clubeSelecionado === nome ? 'page' : undefined}>{nome}</Link>)}</nav>
    <p className="loja-preview-notice">Prévia ilustrativa do catálogo. Preços sugeridos pelo fornecedor; produtos e disponibilidade ainda não estão confirmados.</p>
    {grupos.length ? grupos.map(grupo => <section className="loja-club-group" key={grupo.nome}><h2>{grupo.nome}</h2><ProdutosExemplo produtos={grupo.produtos} /></section>) : <div className="loja-empty"><h2>Nenhum exemplo nesta categoria.</h2><p>Experimente outro clube ou categoria.</p></div>}
  </div></main>
}
