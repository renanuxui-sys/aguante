'use client'
import { useEffect, useState, useCallback } from 'react'

type Cadastro = {
  id: string; nome: string; email: string; clube: string | null; created_at: string
}

const POR_PAGINA = 50

export default function AdminCadastros() {
  const [cadastros, setCadastros] = useState<Cadastro[]>([])
  const [total, setTotal]         = useState(0)
  const [pagina, setPagina]       = useState(0)
  const [busca, setBusca]         = useState('')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams({ pagina: String(pagina), busca })
    const res = await fetch(`/api/admin/cms/cadastros?${params}`, { cache: 'no-store' })
    const json = await res.json()
    setCadastros(json.data || [])
    setTotal(json.total || 0)
    setCarregando(false)
  }, [pagina, busca])

  useEffect(() => { carregar() }, [carregar])

  function formatarData(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Cadastros CTA</h1>
          <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>{total.toLocaleString('pt-BR')} e-mails cadastrados</p>
        </div>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(0) }}
          style={{ padding: '9px 14px', border: '1.5px solid #E8E6DF', borderRadius: 9, fontSize: 14, fontFamily: 'Onest, sans-serif', background: '#fff', color: '#1A1A1A', outline: 'none', width: 300 }}
        />
      </div>

      {/* Tabela */}
      {carregando ? (
        <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Nome', 'E-mail', 'Clube favorito', 'Cadastrado em'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cadastros.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#B0AEA8', fontSize: 14 }}>Nenhum cadastro encontrado</td></tr>
              ) : cadastros.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < cadastros.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{c.nome}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#4A4845' }}>
                    <a href={`mailto:${c.email}`} style={{ color: '#550fed', textDecoration: 'none' }}>{c.email}</a>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{c.clube || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{formatarData(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 13, color: '#6B6966' }}>
          <span>Mostrando {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, total)} de {total.toLocaleString('pt-BR')}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} style={{ padding: '7px 14px', background: pagina === 0 ? '#F0EFEB' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: pagina === 0 ? 'not-allowed' : 'pointer', color: '#4A4845' }}>← Anterior</button>
            <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1} style={{ padding: '7px 14px', background: pagina >= totalPaginas - 1 ? '#F0EFEB' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer', color: '#4A4845' }}>Próxima →</button>
          </div>
        </div>
      )}
    </div>
  )
}
