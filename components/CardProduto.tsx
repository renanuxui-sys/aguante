import Link from 'next/link'
import type { Produto } from '@/types'
import { imagemComProxy } from '@/lib/image-url'

const imgLightning = "/assets/Lightning.svg"

type Props = {
  produto: Produto
}

export default function CardProduto({ produto }: Props) {
  const imagemUrl = imagemComProxy(produto.imagem_url)

  return (
    <Link
      href={`/produto/${produto.id}`}
      className="ag-card"
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
    >
      {/* Foto */}
      <div style={{
        height: 193,
        borderRadius: 16,
        overflow: 'hidden',
        flexShrink: 0,
        background: '#ecebf0',
        backgroundImage: imagemUrl ? `url(${imagemUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 12,
      }}>
        {/* Badges topo esquerdo — de jogo / novidade / alta procura */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          {produto.de_jogo && (
            <span style={{ background: '#000', color: '#fff', fontSize: 12, padding: '2px 4px', borderRadius: 4, width: 'fit-content', letterSpacing: '-0.12px', lineHeight: 1.2, fontWeight: 400 }}>
              de jogo
            </span>
          )}
          {produto.novidade && (
            <span style={{ background: '#000', color: '#fff', fontSize: 12, padding: '2px 4px', borderRadius: 4, width: 'fit-content', letterSpacing: '-0.12px', lineHeight: 1.2, fontWeight: 400 }}>
              novidade
            </span>
          )}
          {produto.alta_procura && (
            <div style={{
              background: '#1beaa0',
              borderRadius: 16,
              height: 25,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              paddingLeft: 15,
              paddingRight: 15,
              width: 'fit-content',
              boxShadow: '0px 14px 12.6px rgba(161,244,82,0.13), inset 0px -2px 28px rgba(116,216,22,0.51)',
            }}>
              <img src={imgLightning} alt="" style={{ width: 15, height: 15 }} />
              <span style={{ fontSize: 12, letterSpacing: '-0.12px', lineHeight: 1.2, fontWeight: 400, color: '#000', whiteSpace: 'nowrap' }}>
                alta procura
              </span>
            </div>
          )}
        </div>

        {/* Rodapé da foto: preço inferior esquerdo */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 4,
            padding: '2px 4px',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 4,
          }}>
            <span style={{ fontSize: 12, fontWeight: 400, color: '#62748c', letterSpacing: '-0.01em', lineHeight: 1 }}>
              R$
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#62748C', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {produto.preco?.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 0 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#282828', letterSpacing: '-0.14px', lineHeight: 1.2 }}>
          {produto.titulo}
        </p>
        <p style={{ fontSize: 12, color: '#444', letterSpacing: '-0.12px', lineHeight: 1.2 }}>
          Ano {produto.ano}
        </p>
        <p style={{ fontSize: 12, color: '#62748c', letterSpacing: '-0.12px', lineHeight: 1.2, fontWeight: 700, opacity: 0.6 }}>
          Via <span style={{ textDecoration: 'underline' }}>{produto.fonte_nome}</span>
        </p>
      </div>

    
    </Link>
  )
}