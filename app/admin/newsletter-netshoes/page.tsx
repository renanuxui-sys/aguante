'use client'
import { useCallback, useEffect, useState } from 'react'

type AssinanteNewsletter = {
  id: string
  email: string
  clubes_interesse: string[] | null
  todos_clubes: boolean | null
  ativo: boolean | null
  origem: string | null
  created_at: string
  updated_at: string | null
}

const POR_PAGINA = 50

export default function AdminNewsletterNetshoes() {
  const [assinantes, setAssinantes] = useState<AssinanteNewsletter[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')

    try {
      const params = new URLSearchParams({ pagina: String(pagina), busca, status })
      const res = await fetch(`/api/admin/cms/newsletter-netshoes?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) setErro(json.error || 'Erro ao carregar newsletter.')
      setAssinantes(json.data || [])
      setTotal(json.total || 0)
    } catch {
      setErro('Erro ao carregar newsletter.')
      setAssinantes([])
      setTotal(0)
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca, status])

  useEffect(() => {
    queueMicrotask(() => carregar())
  }, [carregar])

  function formatarData(iso?: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function clubesLabel(assinante: AssinanteNewsletter) {
    if (assinante.todos_clubes) return 'Todos os clubes'
    const clubes = assinante.clubes_interesse || []
    if (clubes.length === 0) return 'Todos os clubes'
    return clubes.join(', ')
  }

  async function alternarStatus(assinante: AssinanteNewsletter) {
    const proximoAtivo = assinante.ativo === false
    const res = await fetch('/api/admin/cms/newsletter-netshoes', {
      body: JSON.stringify({ id: assinante.id, ativo: proximoAtivo }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErro(json.error || 'Não foi possível atualizar o status.')
      return
    }
    carregar()
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Newsletter Netshoes</h1>
          <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>{total.toLocaleString('pt-BR')} inscritos encontrados</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por e-mail..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(0) }}
          style={{ padding: '9px 14px', border: '1.5px solid #E8E6DF', borderRadius: 9, fontSize: 14, fontFamily: 'Onest, sans-serif', background: '#fff', color: '#1A1A1A', outline: 'none', width: 300 }}
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPagina(0) }}
          style={{ padding: '9px 14px', border: '1.5px solid #E8E6DF', borderRadius: 9, fontSize: 14, fontFamily: 'Onest, sans-serif', background: '#fff', color: '#1A1A1A', outline: 'none' }}
        >
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
      </div>

      {erro ? (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 24, color: '#8A8880', fontSize: 14 }}>
          Não foi possível carregar newsletter: {erro}
        </div>
      ) : carregando ? (
        <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['E-mail', 'Interesses', 'Origem', 'Status', 'Cadastrado em', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assinantes.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#B0AEA8', fontSize: 14 }}>Nenhum inscrito encontrado</td></tr>
              ) : assinantes.map((assinante, i) => (
                <tr key={assinante.id} style={{ borderBottom: i < assinantes.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#4A4845' }}>
                    <a href={`mailto:${assinante.email}`} style={{ color: '#550fed', textDecoration: 'none', fontWeight: 700 }}>{assinante.email}</a>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966', maxWidth: 320 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clubesLabel(assinante)}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{assinante.origem || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: assinante.ativo === false ? '#B0AEA8' : '#1A1A1A', fontWeight: 700 }}>
                    {assinante.ativo === false ? 'Inativo' : 'Ativo'}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{formatarData(assinante.created_at)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <button
                      onClick={() => alternarStatus(assinante)}
                      style={{ padding: '7px 12px', background: assinante.ativo === false ? '#550fed' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: assinante.ativo === false ? '#fff' : '#4A4845', cursor: 'pointer', font: '700 12px Onest, sans-serif' }}
                      type="button"
                    >
                      {assinante.ativo === false ? 'Reativar' : 'Pausar'}
                    </button>
                  </td>
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
