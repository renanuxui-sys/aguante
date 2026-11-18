import Link from 'next/link'
import type { ProdutoExemplo } from '@/lib/loja-propria-catalogo'

export default function ProdutosExemplo({ produtos }: { produtos: ProdutoExemplo[] }) {
  return <div className="loja-product-grid">{produtos.map(produto => <Link className="loja-product-card" href={`/loja/produto/${produto.slug}`} key={produto.sku}>
    <div className={`loja-product-art ${produto.categoria}`}><span className="loja-product-badge">{produto.listaEspera ? 'LISTA DE ESPERA EM PREPARAÇÃO' : 'EM PREPARAÇÃO'}</span><span className="loja-product-art-icon" aria-hidden="true">{produto.categoria === 'mascotes' ? '✳' : '▦'}</span><span className="loja-product-art-note">IMAGEM EM BREVE</span></div>
    <div className="loja-product-info"><span>{produto.categoriaNome} · {produto.clube}</span><h3>{produto.nome}</h3><p>ICONYX · {produto.pecas.toLocaleString('pt-BR')} peças</p><strong>Conhecer produto <span aria-hidden="true">↗</span></strong></div>
  </Link>)}</div>
}
