import type { Metadata } from 'next'
import Link from 'next/link'

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
    <div className="loja-empty"><span aria-hidden="true">✳</span><h2>A coleção está sendo preparada.</h2><p>Em breve, você vai encontrar nossos colecionáveis por aqui.</p><Link href="/loja/iconyx" className="loja-text-link">Conheça a coleção ICONYX ↗</Link></div>
  </div></main>
}
