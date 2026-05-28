import { notFound } from 'next/navigation'
import ProdutoClient from './ProdutoClient'
import { carregarProdutoAtivo, carregarProdutosRelacionados } from '@/lib/produto-data'
import { carregarCupomAtivoProduto } from '@/lib/coupon-data'

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const produto = await carregarProdutoAtivo(id)

  if (!produto) notFound()

  const [relacionados, cupom] = await Promise.all([
    carregarProdutosRelacionados(produto),
    carregarCupomAtivoProduto(produto),
  ])

  return <ProdutoClient produtoInicial={produto} relacionadosIniciais={relacionados} cupomInicial={cupom} />
}
