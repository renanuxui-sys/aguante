import { notFound } from 'next/navigation'
import ProdutoClient from './ProdutoClient'
import { carregarProdutoAtivo, carregarProdutosRelacionados } from '@/lib/produto-data'
import { carregarCupomAtivoProduto } from '@/lib/coupon-data'
import { carregarOfertasNetshoes } from '@/lib/ofertas-data'

export const dynamic = 'force-dynamic'

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const produto = await carregarProdutoAtivo(id)

  if (!produto) notFound()

  const [relacionados, cupom, ofertasNetshoes] = await Promise.all([
    carregarProdutosRelacionados(produto),
    carregarCupomAtivoProduto(produto),
    carregarOfertasNetshoes({ clube: produto.clube, limite: 5 }),
  ])

  return <ProdutoClient produtoInicial={produto} relacionadosIniciais={relacionados} cupomInicial={cupom} ofertasNetshoesIniciais={ofertasNetshoes} />
}
