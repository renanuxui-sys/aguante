import type { Metadata } from 'next'
import Link from 'next/link'
import ProdutosExemplo from '@/components/loja/ProdutosExemplo'
import { produtosExemplo } from '@/lib/loja-propria-catalogo'

export const metadata: Metadata = { title: 'ICONYX — Loja Aguante', alternates: { canonical: '/loja/iconyx' } }

export default function IconyxPage() {
  return <main className="loja-page loja-inner-page"><div className="ag-container">
    <Link className="loja-back" href="/loja">← Loja Aguante</Link>
    <span className="loja-kicker">LOJA AGUANTE / COLEÇÃO</span>
    <div className="loja-collection-hero"><div><h1>Futebol para montar. <em>Paixão para guardar.</em></h1><p className="loja-page-description">Estamos preparando a chegada da coleção ICONYX à Loja Aguante, com estádios e mascotes de futebol em blocos de montar.</p><Link className="loja-button" href="/loja/colecionaveis">Explorar categorias <span aria-hidden="true">↗</span></Link></div><div className="loja-collection-art" aria-hidden="true"><span>✳</span><p>UMA PEÇA<br />DE CADA VEZ.</p></div></div>
    <div className="loja-collection-products"><p className="loja-preview-notice">Prévia ilustrativa do catálogo. Produtos, preços e disponibilidade ainda não estão confirmados.</p><ProdutosExemplo produtos={produtosExemplo} /></div>
  </div></main>
}
