import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardOferta from '@/components/CardOferta'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import type { OfertaAfiliada } from '@/types'

export const revalidate = 60

async function carregarOfertas() {
  const { data, error } = await criarSupabaseAdmin()
    .from('ofertas_afiliadas')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
    .returns<OfertaAfiliada[]>()

  if (error) throw new Error(error.message)
  return data || []
}

export default async function CuponsPage() {
  const ofertas = await carregarOfertas()

  return (
    <main style={{ background: '#f5f5f5', fontFamily: 'Onest, sans-serif', minHeight: '100vh' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
        .ag-oferta-card { width: 100%; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-oferta-card:hover { transform: translateY(-3px); }
        @media (max-width: 768px) {
          .ag-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
      <Navbar />

      <section style={{ padding: '144px 0 48px' }}>
        <div className="ag-container">
          <div style={{ maxWidth: 640 }}>
            <p style={{ color: '#550fed', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>
              Cupons Aguante
            </p>
            <h1 style={{ color: '#282828', fontSize: 44, fontWeight: 300, letterSpacing: '-0.06em', lineHeight: 1.08, margin: 0 }}>
              Camisas novas com desconto para a sua coleção.
            </h1>
            <p style={{ color: '#62748c', fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.5, marginTop: 18 }}>
              Use o cupom AGUANTE nas ofertas Netshoes selecionadas. O desconto não vale para produtos com tag Seleção.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 72px' }}>
        <div className="ag-container">
          {ofertas.length > 0 ? (
            <div className="ag-cards">
              {ofertas.map(oferta => <CardOferta key={oferta.id} oferta={oferta} />)}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
              Nenhum cupom ativo no momento.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
