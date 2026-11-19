'use client'
import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { produtosExemplo } from '@/lib/loja-propria-catalogo'
import { lerCarrinho, salvarCarrinho } from '@/components/loja/CompraSimulada'

const formatar = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function CarrinhoPage() {
  const carregado = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [alteracoes, setAlteracoes] = useState<Record<string, number> | null>(null)
  const carrinho = alteracoes ?? (carregado ? lerCarrinho() : {})
  const [concluido, setConcluido] = useState(false)
  const itens = produtosExemplo.filter(p => p.disponivelSimulacao && carrinho[p.sku])
  const total = itens.reduce((soma, p) => soma + p.precoPdv * carrinho[p.sku], 0)
  function atualizar(sku: string, quantidade: number) {
    const proximo = { ...carrinho }
    if (quantidade <= 0) delete proximo[sku]
    else proximo[sku] = Math.min(quantidade, 99)
    setAlteracoes(proximo); salvarCarrinho(proximo)
  }
  function finalizar() { salvarCarrinho({}); setAlteracoes({}); setConcluido(true) }
  return <main className="loja-page loja-inner-page"><div className="ag-container"><Link className="loja-back" href="/loja/colecionaveis">← Continuar explorando</Link><span className="loja-kicker">LOJA AGUANTE / SIMULAÇÃO</span><h1>Carrinho <em>de teste.</em></h1><p className="loja-preview-notice">Esta é uma demonstração: não há pagamento, pedido real ou reserva de estoque.</p>
    {!carregado ? <p>Carregando carrinho...</p> : concluido ? <div className="loja-waitlist" role="status"><strong>Simulação concluída!</strong><p>Nenhum pedido foi criado e nenhuma cobrança foi feita.</p><Link className="loja-text-link" href="/loja/colecionaveis">Voltar aos produtos ↗</Link></div> : itens.length === 0 ? <div className="loja-empty"><h2>Seu carrinho está vazio.</h2><p>Escolha um produto com estoque simulado para experimentar.</p><Link className="loja-text-link" href="/loja/colecionaveis">Explorar produtos ↗</Link></div> : <div className="loja-cart"><div>{itens.map(p => <article className="loja-cart-item" key={p.sku}><Image src={`/assets/loja/iconyx/${p.sku.toLowerCase()}.webp`} alt="" width={100} height={90} /><div><strong>{p.clube} — {p.categoriaNome}</strong><p>{formatar(p.precoPdv)} · preço sugerido</p><div className="loja-quantity"><button type="button" aria-label={`Diminuir quantidade de ${p.nome}`} onClick={() => atualizar(p.sku, carrinho[p.sku]-1)}>−</button><span>{carrinho[p.sku]}</span><button type="button" aria-label={`Aumentar quantidade de ${p.nome}`} onClick={() => atualizar(p.sku, carrinho[p.sku]+1)}>+</button><button type="button" onClick={() => atualizar(p.sku, 0)}>Remover</button></div></div></article>)}</div><aside className="loja-cart-summary"><h2>Resumo da simulação</h2><p>Subtotal <strong>{formatar(total)}</strong></p><p>Frete <span>Não calculado</span></p><p>Total dos produtos <strong>{formatar(total)}</strong></p><button type="button" className="loja-button" onClick={finalizar}>Finalizar simulação ↗</button><small>Sem cobrança ou criação de pedido.</small></aside></div>}
  </div></main>
}
