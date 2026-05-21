import type { OfertaAfiliada } from '@/types'

function formatarPreco(preco: number | null) {
  if (preco === null) return null
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CardOferta({ oferta }: { oferta: OfertaAfiliada }) {
  const preco = formatarPreco(oferta.preco)

  return (
    <a
      href={oferta.link_afiliado}
      target="_blank"
      rel="sponsored noreferrer"
      className="ag-oferta-card"
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      <div
        style={{
          aspectRatio: '1 / 1',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#ecebf0',
          backgroundImage: oferta.imagem_url ? `url(${oferta.imagem_url})` : undefined,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          position: 'relative',
        }}
      >
        <span style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 6, color: '#282828', fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1, padding: '6px 8px' }}>
          camisa nova
        </span>
        {preco && (
          <span style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 6, color: '#62748c', fontSize: 14, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, padding: '6px 8px' }}>
            {preco}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 10 }}>
        <p style={{ color: '#282828', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {oferta.titulo}
        </p>
        <p style={{ color: '#62748c', fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Oferta via {oferta.loja}
        </p>
      </div>
    </a>
  )
}
