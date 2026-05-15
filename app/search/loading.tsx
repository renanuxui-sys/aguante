export default function SearchLoading() {
  return (
    <main style={{ fontFamily: 'Onest, sans-serif', background: '#f5f5f5', minHeight: '100vh', paddingTop: 180 }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ width: 280, height: 36, borderRadius: 10, background: '#ecebf0', marginBottom: 48 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ height: 325, borderRadius: 16, background: '#ecebf0' }} />
          ))}
        </div>
      </div>
    </main>
  )
}
