'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ProdutoExemplo } from '@/lib/loja-propria-catalogo'

const CHAVE = 'aguante-loja-carrinho-simulacao'
export function lerCarrinho(): Record<string, number> {
  try {
    const dados: unknown = JSON.parse(localStorage.getItem(CHAVE) || '{}')
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {}
    return Object.fromEntries(Object.entries(dados).filter(([, qtd]) => typeof qtd === 'number' && Number.isSafeInteger(qtd) && qtd > 0 && qtd <= 99))
  } catch { return {} }
}
export function salvarCarrinho(carrinho: Record<string, number>) { localStorage.setItem(CHAVE, JSON.stringify(carrinho)) }

export default function CompraSimulada({ produto }: { produto: ProdutoExemplo }) {
  const [adicionado, setAdicionado] = useState(false)
  if (!produto.disponivelSimulacao) return <div className="loja-waitlist"><strong>Lista de espera</strong><p>Prévia: o cadastro de interesse ainda não está disponível.</p></div>
  function adicionar() {
    const carrinho = lerCarrinho()
    carrinho[produto.sku] = Math.min((carrinho[produto.sku] || 0) + 1, 99)
    salvarCarrinho(carrinho)
    setAdicionado(true)
  }
  return <div className="loja-simulation"><strong>Em estoque · simulação</strong><p>Disponibilidade fictícia para testar a experiência.</p><button type="button" className="loja-button" onClick={adicionar}>Adicionar ao carrinho <span aria-hidden="true">↗</span></button>{adicionado && <p role="status">Adicionado ao carrinho de simulação. <Link href="/loja/carrinho">Ver carrinho →</Link></p>}</div>
}
