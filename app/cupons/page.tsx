import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CuponsPage() {
  return (
    <main style={{ background: '#f5f5f5', fontFamily: 'Onest, sans-serif', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '55vh', padding: '160px 24px 96px', textAlign: 'center' }}>
        <h1 style={{ color: '#282828', fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.08, margin: 0 }}>
          Em breve.
        </h1>
      </section>

      <Footer />
    </main>
  )
}
