import { notFound } from 'next/navigation'
import ProdutoClient from './ProdutoClient'
import { carregarProdutoAtivo, carregarProdutosRelacionados } from '@/lib/produto-data'

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const produto = await carregarProdutoAtivo(id)

  if (!produto) notFound()

  const relacionados = await carregarProdutosRelacionados(produto)

  return <ProdutoClient produtoInicial={produto} relacionadosIniciais={relacionados} />
}
