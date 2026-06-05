import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OfertasNetshoesClient from '@/app/ofertas-netshoes/OfertasNetshoesClient'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import type { OfertaAfiliada } from '@/types'

const imgBgHero = '/assets/bg-hero.png'

export const revalidate = 60

async function carregarOfertas() {
  try {
    const { data, error } = await criarSupabaseAdmin()
      .from('ofertas_afiliadas')
      .select('*')
      .eq('loja', 'Netshoes')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })
      .returns<OfertaAfiliada[]>()

    if (error) throw new Error(error.message)
    return (data || []).filter(oferta => {
      const precos = [oferta.preco_pix, oferta.preco].map(Number)
      return precos.some(preco => Number.isFinite(preco) && preco > 0)
    })
  } catch (error) {
    console.warn('Não foi possível carregar cupons:', error instanceof Error ? error.message : error)
    return []
  }
}

export default async function OfertasNetshoesPage() {
  const ofertas = await carregarOfertas()

  return (
    <main className="ag-ofertas-page" style={{ fontFamily: 'Onest, sans-serif', minHeight: '100vh' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-ofertas-page {
          background:
            linear-gradient(to bottom, transparent 60%, #f5f5f5 100%) top center / 100% 700px no-repeat,
            url('${imgBgHero}') top center / 100% 700px no-repeat,
            #f5f5f5;
        }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); column-gap: 12px; row-gap: 42px; align-items: stretch; }
        .ag-oferta-card { width: 100%; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-oferta-card:hover { transform: translateY(-3px); }
        .ag-ofertas-kicker {
          display: inline-flex;
          align-items: center;
          min-height: 31px;
          padding: 5px 13px 6px;
          border: 1px solid rgba(255, 255, 255, 0.48);
          border-radius: 999px;
          background: rgba(200, 196, 213, 0.58);
          color: #15151a;
          font-size: 14px;
          font-weight: 400;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          box-shadow: 0 12px 28px rgba(115, 110, 128, 0.08);
          margin-bottom: 23px;
        }
        @media (max-width: 768px) {
          .ag-ofertas-hero { padding-top: 28px !important; }
          .ag-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 34px; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
      <Navbar />

      <section className="ag-ofertas-hero ag-mobile-keep-top" style={{ padding: '144px 0 48px' }}>
        <div className="ag-container">
          <div style={{ maxWidth: 640 }}>
            <span className="ag-ofertas-kicker">
              Ofertas Netshoes
            </span>
            <h1 style={{ color: '#282828', fontSize: 44, fontWeight: 300, letterSpacing: '-0.06em', lineHeight: 1.08, margin: 0 }}>
              Camisas oficiais na etiqueta com desconto.
            </h1>
            <p style={{ color: '#62748c', fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.5, marginTop: 18 }}>
              Use AGUANTE para 15% OFF nas ofertas elegíveis. O desconto não vale para produtos com tag Seleção.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 72px' }}>
        <div className="ag-container">
          <OfertasNetshoesClient ofertas={ofertas} />
        </div>
      </section>

      <Footer />
    </main>
  )
}
