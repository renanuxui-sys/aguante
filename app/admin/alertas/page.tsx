'use client'
import { useEffect, useState, useCallback } from 'react'

type Alerta = {
  id: string
  nome?: string | null
  email: string
  clube?: string | null
  ano?: string | null
  palavra_chave?: string | null
  produto_titulo?: string | null
  fonte_nome?: string | null
  ativo?: boolean | null
  created_at?: string | null
}

const POR_PAGINA = 50

export default function AdminAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')

    const params = new URLSearchParams({ pagina: String(pagina), busca })
    const res = await fetch(`/api/admin/cms/alertas?${params}`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok) setErro(json.error || 'Erro ao carregar alertas.')
    setAlertas(json.data || [])
    setTotal(json.total || 0)
    setCarregando(false)
  }, [pagina, busca])

  useEffect(() => { carregar() }, [carregar])

  function formatarData(iso?: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Alertas</h1>
          <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>{total.toLocaleString('pt-BR')} alertas cadastrados</p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por nome, e-mail, clube, ano..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(0) }}
          style={{ padding: '9px 14px', border: '1.5px solid #E8E6DF', borderRadius: 9, fontSize: 14, fontFamily: 'Onest, sans-serif', background: '#fff', color: '#1A1A1A', outline: 'none', width: 360 }}
        />
      </div>

      {erro ? (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 24, color: '#8A8880', fontSize: 14 }}>
          Não foi possível carregar alertas. Verifique se a tabela `alertas` tem os campos novos.
        </div>
      ) : carregando ? (
        <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Nome', 'E-mail', 'Clube / Ano', 'Produto', 'Status', 'Criado em'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertas.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#B0AEA8', fontSize: 14 }}>Nenhum alerta encontrado</td></tr>
              ) : alertas.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < alertas.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{a.nome || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#4A4845' }}>
                    <a href={`mailto:${a.email}`} style={{ color: '#550fed', textDecoration: 'none' }}>{a.email}</a>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{a.clube || '—'}{a.ano ? ` · ${a.ano}` : ''}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966', maxWidth: 280 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1A1A1A', fontWeight: 500 }}>{a.produto_titulo || a.palavra_chave || '—'}</div>
                    <div style={{ fontSize: 11, color: '#8A8880', marginTop: 2 }}>{a.fonte_nome || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: a.ativo === false ? '#B0AEA8' : '#1A1A1A', fontWeight: 600 }}>{a.ativo === false ? 'Inativo' : 'Ativo'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{formatarData(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
