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
        .ag-newsletter-spacer { height: 128px; }
        .ag-newsletter-netshoes {
          position: fixed;
          left: 50%;
          bottom: 18px;
          z-index: 70;
          width: min(940px, calc(100% - 32px));
          transform: translateX(-50%);
        }
        .ag-newsletter-form {
          position: relative;
          display: grid;
          grid-template-columns: minmax(170px, 1fr) minmax(280px, 420px) auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(232, 230, 223, 0.96);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 44px rgba(40, 40, 40, 0.14);
          backdrop-filter: blur(16px);
        }
        .ag-newsletter-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ag-newsletter-copy strong { color: #282828; font-size: 14px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
        .ag-newsletter-copy span { color: #62748c; font-size: 12px; font-weight: 500; letter-spacing: -0.01em; line-height: 1.25; }
        .ag-newsletter-actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
        .ag-newsletter-actions input {
          width: 100%;
          height: 40px;
          padding: 0 13px;
          border: 1px solid #E8E6DF;
          border-radius: 8px;
          background: #f8f8f8;
          color: #282828;
          font: 500 13px Onest, sans-serif;
          outline: none;
        }
        .ag-newsletter-actions button {
          height: 40px;
          padding: 0 15px;
          border: none;
          border-radius: 8px;
          background: #282828;
          color: #fff;
          cursor: pointer;
          font: 800 12px Onest, sans-serif;
          white-space: nowrap;
          transition: background 160ms ease, transform 160ms ease;
        }
        .ag-newsletter-actions button:hover { background: #550fed; transform: translateY(-1px); }
        .ag-newsletter-actions button:disabled { cursor: default; opacity: 0.68; transform: none; }
        .ag-newsletter-clubes-toggle {
          height: 40px;
          padding: 0 13px;
          border: 1px solid #E8E6DF;
          border-radius: 8px;
          background: #fff;
          color: #282828;
          cursor: pointer;
          font: 800 12px Onest, sans-serif;
          white-space: nowrap;
        }
        .ag-newsletter-status {
          grid-column: 1 / -1;
          margin: -2px 0 0;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.25;
        }
        .ag-newsletter-status-success { color: #087443; }
        .ag-newsletter-status-error { color: #b42318; }
        .ag-newsletter-clubes {
          grid-column: 1 / -1;
          display: grid;
          gap: 10px;
          padding-top: 4px;
        }
        .ag-newsletter-clubes label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #282828;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        .ag-newsletter-clubes input { accent-color: #550fed; }
        .ag-newsletter-clubes-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px 12px;
          padding-top: 2px;
        }
        .ag-newsletter-clubes-grid[aria-disabled="true"] { opacity: 0.42; }
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
          .ag-newsletter-spacer { height: 210px; }
          .ag-newsletter-netshoes { bottom: 82px; width: calc(100% - 24px); }
          .ag-newsletter-form { grid-template-columns: 1fr; gap: 9px; padding: 10px; }
          .ag-newsletter-copy { display: none; }
          .ag-newsletter-actions { grid-template-columns: minmax(0, 1fr) auto; }
          .ag-newsletter-actions button { padding: 0 12px; }
          .ag-newsletter-clubes-toggle { width: 100%; }
          .ag-newsletter-clubes-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 190px; overflow: auto; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .ag-newsletter-form { grid-template-columns: 1fr; }
          .ag-newsletter-clubes-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
              Camisas oficiais na etiqueta, com desconto.
            </h1>
            <p style={{ color: '#62748c', fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.5, marginTop: 18 }}>
              Use cupom AGUANTE e garanta desconto especial nas ofertas elegíveis. Cupom não é válido para produtos com tag Seleção.
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
