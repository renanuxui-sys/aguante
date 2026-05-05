'use client'
import { useEffect, useState } from 'react'

type Preferencia = {
  id: string
  clube: string | null
  acao: string | null
  origem: string | null
  path: string | null
  created_at: string | null
}

type Ranking = { clube: string; total: number; pct: number }

export default function AdminPreferenciasClubes() {
  const [ranking, setRanking] = useState<Ranking[]>([])
  const [recentes, setRecentes] = useState<Preferencia[]>([])
  const [totalEscolhas, setTotalEscolhas] = useState(0)
  const [totalSemEscolha, setTotalSemEscolha] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      setErro('')

      const res = await fetch('/api/admin/cms/preferencias-clubes', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok) {
        setErro(json.error || 'Erro ao carregar escolhas.')
        setCarregando(false)
        return
      }

      setRanking(json.ranking || [])
      setRecentes(json.recentes || [])
      setTotalEscolhas(json.totalEscolhas || 0)
      setTotalSemEscolha(json.totalSemEscolha || 0)
      setCarregando(false)
    }

    carregar()
  }, [])

  function formatarData(iso?: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function labelAcao(acao?: string | null) {
    if (acao === 'escolheu') return 'Escolheu clube'
    if (acao === 'prefiro_nao_escolher') return 'Preferiu não escolher'
    if (acao === 'entrou_sem_escolher') return 'Entrou sem escolher'
    return acao || '—'
  }

  if (carregando) return <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 40 }}>Carregando ranking...</div>

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Escolhas de Clube</h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          {totalEscolhas.toLocaleString('pt-BR')} escolhas de clubes · {totalSemEscolha.toLocaleString('pt-BR')} sem escolha
        </p>
      </div>

      {erro ? (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 24, color: '#8A8880', fontSize: 14 }}>
          Não foi possível carregar escolhas. Verifique se a tabela `clubes_preferencias` existe.
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>Ranking de clubes escolhidos</div>
            {ranking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#B0AEA8', fontSize: 13 }}>Sem escolhas ainda</div>
            ) : ranking.map((item, i) => (
              <div key={item.clube} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#1A1A1A' : '#8A8880', width: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>{item.clube}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#6B6966', fontWeight: 600 }}>{item.total.toLocaleString('pt-BR')} · {item.pct}%</span>
                </div>
                <div style={{ height: 5, background: '#F0EFEB', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(item.pct, 3)}%`, height: '100%', background: '#550fed', borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                  {['Clube', 'Ação', 'Origem', 'Página', 'Criado em'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentes.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#B0AEA8', fontSize: 14 }}>Nenhum registro encontrado</td></tr>
                ) : recentes.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < recentes.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{item.clube || '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{labelAcao(item.acao)}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{item.origem || '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{item.path || '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{formatarData(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
