'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { ProdutoExemplo } from '@/lib/loja-propria-catalogo'

export default function GaleriaProduto({ produto }: { produto: ProdutoExemplo }) {
  const [ativa, setAtiva] = useState(0)
  const base = `/assets/loja/iconyx/${produto.sku.toLowerCase()}`
  const imagens = [`${base}.webp`, ...Array.from({ length: produto.imagensExtras }, (_, i) => `${base}-${i + 2}.webp`)]
  return <div><div className={`loja-product-art loja-detail-art ${produto.categoria}`}><span className="loja-product-badge">PRÉVIA DO CATÁLOGO</span><Image className="loja-product-image" src={imagens[ativa]} alt={`${produto.nome}, vista ${ativa + 1}`} width={700} height={600} priority /></div><div className="loja-gallery-thumbs" aria-label="Fotos do produto">{imagens.map((imagem, i) => <button key={imagem} type="button" aria-label={`Ver foto ${i + 1} de ${imagens.length}`} aria-pressed={ativa === i} onClick={() => setAtiva(i)}><Image src={imagem} alt="" width={80} height={80} /></button>)}</div></div>
}
