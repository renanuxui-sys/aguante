export default function HomeLoading() {
  return (
    <main style={{ fontFamily: 'Onest, sans-serif', background: '#f5f5f5', minHeight: '100vh', paddingTop: 180 }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ width: 360, height: 52, borderRadius: 12, background: '#ecebf0', marginBottom: 24 }} />
        <div style={{ width: 520, maxWidth: '100%', height: 64, borderRadius: 24, background: '#ecebf0', marginBottom: 72 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 325, borderRadius: 16, background: '#ecebf0' }} />
          ))}
        </div>
      </div>
    </main>
  )
}
