import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const revalidate = 300

export default function CuponsPage() {
  return (
    <main style={{ background: '#f5f5f5', fontFamily: 'Onest, sans-serif', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ padding: '144px 0 72px' }}>
        <div style={{ margin: '0 auto', maxWidth: 1140, padding: '0 24px', width: '100%' }}>
          <div style={{ maxWidth: 640 }}>
            <p style={{ color: '#550fed', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>
              Cupons Aguante
            </p>
            <h1 style={{ color: '#282828', fontSize: 44, fontWeight: 300, letterSpacing: '-0.06em', lineHeight: 1.08, margin: 0 }}>
              Cupons de lojas parceiras.
            </h1>
            <p style={{ color: '#62748c', fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.5, marginTop: 18 }}>
              Em breve, reuniremos aqui cupons ativos das lojas parceiras do Aguante.
            </p>
            <a
              href="/ofertas-netshoes"
              style={{ background: '#550fed', borderRadius: 8, color: '#fff', display: 'inline-flex', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', marginTop: 28, padding: '12px 16px', textDecoration: 'none' }}
            >
              Ver ofertas Netshoes
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
