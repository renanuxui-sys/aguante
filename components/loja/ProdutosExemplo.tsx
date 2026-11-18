import Link from 'next/link'
import Image from 'next/image'
import type { ProdutoExemplo } from '@/lib/loja-propria-catalogo'
import { carregarClubesAtivos } from '@/lib/clube-data'
import { gerarSlugClube } from '@/lib/clube-utils'

export default async function ProdutosExemplo({ produtos }: { produtos: ProdutoExemplo[] }) {
  const clubes = await carregarClubesAtivos().catch(() => [])
  const escudos = new Map(clubes.filter(clube => clube.escudo_url).map(clube => [gerarSlugClube(clube.nome), clube.escudo_url]))
  const aliases: Record<string, string[]> = { 'atletico-mineiro': ['atletico-mg'], 'ceara': ['ceara-sc'] }
  function escudo(nome: string) {
    const chave = gerarSlugClube(nome)
    return escudos.get(chave) || aliases[chave]?.map(alias => escudos.get(alias)).find(Boolean)
  }
  return <div className="loja-product-grid">{produtos.map(produto => <Link className="loja-product-card" href={`/loja/produto/${produto.slug}`} key={produto.sku}>
    <div className={`loja-product-art ${produto.categoria}`}><span className="loja-product-badge">{produto.disponivelSimulacao ? 'EM ESTOQUE · SIMULAÇÃO' : 'LISTA DE ESPERA'}</span>{escudo(produto.clube) && <span className="loja-club-crest"><Image src={escudo(produto.clube)!} alt={`Escudo ${produto.clube}`} width={38} height={38} unoptimized /></span>}<Image className="loja-product-image" src={`/assets/loja/iconyx/${produto.sku.toLowerCase()}.webp`} alt={produto.nome} width={540} height={440} /></div>
    <div className="loja-product-info"><span>ICONYX · {produto.pecas.toLocaleString('pt-BR')} peças</span><h3>{produto.clube} — {produto.categoriaNome}</h3><p>{produto.nome}</p><p className="loja-pdv-label">PDV sugerido</p><div className="loja-price">{produto.precoPdv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><strong>Conhecer produto <span aria-hidden="true">↗</span></strong></div>
  </Link>)}</div>
}
