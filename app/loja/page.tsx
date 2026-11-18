import Link from 'next/link'
import ProdutosExemplo from '@/components/loja/ProdutosExemplo'
import { produtosExemplo } from '@/lib/loja-propria-catalogo'

const categorias = [
  { numero: '01', nome: 'Estádios Premium', detalhe: 'Para olhar de perto cada detalhe.', categoria: 'premium', classe: 'premium' },
  { numero: '02', nome: 'Estádios Standard', detalhe: 'Grandes palcos em uma nova escala.', categoria: 'standard', classe: 'standard' },
  { numero: '03', nome: 'Mascotes', detalhe: 'A paixão pelo clube em cada peça.', categoria: 'mascotes', classe: 'mascotes' },
]

export default function LojaPage() {
  return (
    <main className="loja-page">
      <section className="loja-hero">
        <div className="ag-container loja-hero-inner">
          <div className="loja-hero-copy">
            <span className="loja-eyebrow"><span /> UMA NOVIDADE AGUANTE</span>
            <h1>O futebol ganha <em>um novo lugar.</em></h1>
            <p>Colecionáveis para montar, exibir e continuar vivendo a paixão pelo futebol, dentro e fora de campo.</p>
            <div className="loja-hero-actions">
              <Link className="loja-button" href="/loja/colecionaveis">Explorar colecionáveis <span aria-hidden="true">↗</span></Link>
              <span className="loja-coming"><span /> EM BREVE</span>
            </div>
          </div>
          <div className="loja-hero-art" aria-hidden="true">
            <div className="loja-art-orbit orbit-one" /><div className="loja-art-orbit orbit-two" />
            <div className="loja-art-label">FEITO PARA<br />QUEM VIVE<br /><strong>FUTEBOL.</strong></div>
            <div className="loja-art-ball">✳</div>
            <div className="loja-art-caption">UMA NOVA FORMA DE COLECIONAR <span>↗</span></div>
          </div>
        </div>
      </section>

      <section className="loja-categories ag-container">
        <div className="loja-section-heading"><div><span className="loja-kicker">ESCOLHA SEU LADO</span><h2>Paixão em cada peça.</h2></div><p>Um novo jeito de trazer para perto aquilo que faz parte da sua história com o futebol.</p></div>
        <div className="loja-category-grid">
          {categorias.map(item => <Link key={item.categoria} href={`/loja/colecionaveis?categoria=${item.categoria}`} className={`loja-category ${item.classe}`}>
            <div className="loja-category-top"><span>{item.numero} / COLECIONÁVEIS</span><span aria-hidden="true">↗</span></div>
            <div className="loja-category-symbol" aria-hidden="true">{item.categoria === 'mascotes' ? '✳' : '▦'}</div>
            <div><h3>{item.nome}</h3><p>{item.detalhe}</p></div>
          </Link>)}
        </div>
      </section>

      <section className="loja-featured ag-container">
        <div className="loja-section-heading"><div><span className="loja-kicker">UMA PRÉVIA DA COLEÇÃO</span><h2>Peça por peça, futebol.</h2></div><Link className="loja-text-link" href="/loja/colecionaveis">Ver todos os exemplos ↗</Link></div>
        <p className="loja-preview-notice">Exemplos do catálogo ICONYX. Preços sugeridos pelo fornecedor; produtos e disponibilidade ainda não estão confirmados.</p>
        <ProdutosExemplo produtos={produtosExemplo.slice(0, 4)} />
      </section>

      <section className="loja-intro ag-container">
        <div><span className="loja-kicker">A COLEÇÃO ESTÁ CHEGANDO</span><h2>O apito inicial<br /><em>está perto.</em></h2></div>
        <div className="loja-intro-copy"><p>Estamos preparando uma seleção de colecionáveis para quem carrega o futebol nos detalhes.</p><p>A seleção acima é uma prévia. Os preços exibidos são sugeridos pelo fornecedor; venda e disponibilidade ainda serão confirmadas.</p><Link href="/loja/iconyx" className="loja-text-link">Conheça a coleção ICONYX <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="loja-note"><div className="ag-container loja-note-inner"><span className="loja-note-icon" aria-hidden="true">✳</span><p>O futebol é feito de histórias.<br /><strong>A sua coleção também.</strong></p><Link href="/loja/colecionaveis">Explorar a loja <span aria-hidden="true">↗</span></Link></div></section>
    </main>
  )
}
