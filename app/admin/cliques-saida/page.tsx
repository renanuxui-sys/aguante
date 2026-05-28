'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type CliqueSaida = {
  id: string
  produto_id: string | null
  produto_titulo: string | null
  loja_nome: string | null
  clicked_at: string
  origem_usuario: string | null
  pagina_origem: string | null
  clube: string | null
  categoria: string | null
  campanha: string | null
  usuario_status: string | null
  cupom_revelado: boolean | null
  destino_original: string
  destino_com_utm: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

type RankingItem = { nome: string; total: number }

type ResumoCliques = {
  total: number
  totalCupom: number
  totalLogados: number
  porLoja: RankingItem[]
  porCampanha: RankingItem[]
  porOrigem: RankingItem[]
  porClube: RankingItem[]
}

const POR_PAGINA = 50

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function textoCurto(valor: string | null | undefined, fallback = '-') {
  return valor?.trim() || fallback
}

export default function AdminCliquesSaida() {
  const [cliques, setCliques] = useState<CliqueSaida[]>([])
  const [resumo, setResumo] = useState<ResumoCliques | null>(null)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [loja, setLoja] = useState('')
  const [campanha, setCampanha] = useState('')
  const [origem, setOrigem] = useState('')
  const [clube, setClube] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')

  const filtros = useMemo(() => ({
    busca,
    loja,
    campanha,
    origem,
    clube,
    de,
    ate,
  }), [busca, loja, campanha, origem, clube, de, ate])

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')

    const params = new URLSearchParams({
      limit: String(POR_PAGINA),
      offset: String(pagina * POR_PAGINA),
    })

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor) params.set(chave, valor)
    })

    const res = await fetch(`/api/admin/cms/cliques-saida?${params}`, { cache: 'no-store' })
    const json = await res.json().catch(() => null)

    if (!res.ok) {
      setCliques([])
      setResumo(null)
      setTotal(0)
      setErro(json?.error || 'Não foi possível carregar os cliques.')
      setCarregando(false)
      return
    }

    setCliques(json.cliques || [])
    setResumo(json.resumo || null)
    setTotal(json.total || 0)
    setCarregando(false)
  }, [filtros, pagina])

  useEffect(() => {
    const timer = window.setTimeout(() => { carregar() }, 0)
    return () => window.clearTimeout(timer)
  }, [carregar])

  function aplicarFiltroRapido(tipo: 'loja' | 'campanha' | 'origem' | 'clube', valor: string) {
    setPagina(0)
    if (tipo === 'loja') setLoja(valor)
    if (tipo === 'campanha') setCampanha(valor)
    if (tipo === 'origem') setOrigem(valor)
    if (tipo === 'clube') setClube(valor)
  }

  function limparFiltros() {
    setPagina(0)
    setBusca('')
    setLoja('')
    setCampanha('')
    setOrigem('')
    setClube('')
    setDe('')
    setAte('')
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Cliques de saída</h1>
          <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
            Histórico detalhado dos cliques que passam pelo link intermediário.
          </p>
        </div>
        <button onClick={carregar} style={{ padding: '9px 14px', background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#4A4845', fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: 'pointer' }}>
          Atualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <ResumoCard label="Cliques filtrados" valor={(resumo?.total || 0).toLocaleString('pt-BR')} />
        <ResumoCard label="Com cupom revelado" valor={(resumo?.totalCupom || 0).toLocaleString('pt-BR')} />
        <ResumoCard label="Usuários logados" valor={(resumo?.totalLogados || 0).toLocaleString('pt-BR')} />
        <ResumoCard label="Campanhas" valor={(resumo?.porCampanha.length || 0).toLocaleString('pt-BR')} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <Campo label="Busca" value={busca} onChange={v => { setPagina(0); setBusca(v) }} placeholder="Produto, loja, clube ou campanha" />
          <Campo label="Loja" value={loja} onChange={v => { setPagina(0); setLoja(v) }} placeholder="Ex: Mercado Livre" />
          <Campo label="Campanha" value={campanha} onChange={v => { setPagina(0); setCampanha(v) }} placeholder="utm_campaign" />
          <Campo label="Origem" value={origem} onChange={v => { setPagina(0); setOrigem(v) }} placeholder="direto, google..." />
          <Campo label="Clube" value={clube} onChange={v => { setPagina(0); setClube(v) }} placeholder="Clube" />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Campo label="De" type="date" value={de} onChange={v => { setPagina(0); setDe(v) }} />
          <Campo label="Até" type="date" value={ate} onChange={v => { setPagina(0); setAte(v) }} />
          <button onClick={limparFiltros} style={{ height: 38, padding: '0 14px', border: '1px solid #E8E6DF', borderRadius: 8, background: '#F8F7F4', color: '#4A4845', fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: 'pointer' }}>
            Limpar filtros
          </button>
        </div>
      </div>

      {resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <Ranking titulo="Lojas" dados={resumo.porLoja} onClick={valor => aplicarFiltroRapido('loja', valor)} />
          <Ranking titulo="Campanhas" dados={resumo.porCampanha} onClick={valor => aplicarFiltroRapido('campanha', valor)} />
          <Ranking titulo="Origens" dados={resumo.porOrigem} onClick={valor => aplicarFiltroRapido('origem', valor)} />
          <Ranking titulo="Clubes" dados={resumo.porClube} onClick={valor => aplicarFiltroRapido('clube', valor)} />
        </div>
      )}

      {erro && (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 24, color: '#A33', fontSize: 14, marginBottom: 24 }}>
          {erro}
        </div>
      )}

      {carregando ? <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div> : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Data', 'Produto', 'Loja', 'Origem', 'Página', 'Clube/categoria', 'Campanha', 'UTMs', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cliques.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 28, textAlign: 'center', color: '#B0AEA8', fontSize: 13 }}>Sem cliques para os filtros atuais</td>
                </tr>
              ) : cliques.map((clique, i) => (
                <tr key={clique.id} style={{ borderBottom: i < cliques.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: '#4A4845', whiteSpace: 'nowrap' }}>{formatarData(clique.clicked_at)}</td>
                  <td style={{ padding: '13px 14px', maxWidth: 240 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{textoCurto(clique.produto_titulo)}</div>
                    <div style={{ fontSize: 11, color: '#8A8880', marginTop: 2 }}>{clique.usuario_status === 'logado' ? 'logado' : 'anônimo'} · cupom {clique.cupom_revelado ? 'sim' : 'não'}</div>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 13, color: '#4A4845' }}>{textoCurto(clique.loja_nome)}</td>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: '#4A4845', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{textoCurto(clique.origem_usuario)}</td>
                  <td style={{ padding: '13px 14px', maxWidth: 180 }}>
                    <span title={clique.pagina_origem || ''} style={{ display: 'block', fontSize: 12, color: '#4A4845', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {textoCurto(clique.pagina_origem)}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: '#4A4845' }}>
                    <div>{textoCurto(clique.clube)}</div>
                    <div style={{ color: '#8A8880', marginTop: 2 }}>{textoCurto(clique.categoria)}</div>
                  </td>
                  <td style={{ padding: '13px 14px', maxWidth: 160 }}>
                    <span title={clique.campanha || ''} style={{ display: 'block', fontSize: 12, color: '#4A4845', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {textoCurto(clique.campanha)}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 11, color: '#6B6966', lineHeight: 1.5, maxWidth: 220 }}>
                    <div>source: {textoCurto(clique.utm_source)}</div>
                    <div>medium: {textoCurto(clique.utm_medium)}</div>
                    <div title={clique.utm_content || ''} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>content: {textoCurto(clique.utm_content)}</div>
                    <div>term: {textoCurto(clique.utm_term)}</div>
                  </td>
                  <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                    <a href={clique.destino_com_utm} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#550fed', textDecoration: 'none', fontWeight: 700 }}>Abrir</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 13, color: '#6B6966' }}>
          <span>Mostrando {pagina * POR_PAGINA + 1}-{Math.min((pagina + 1) * POR_PAGINA, total)} de {total.toLocaleString('pt-BR')}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} style={{ padding: '7px 14px', background: pagina === 0 ? '#F0EFEB' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: pagina === 0 ? 'not-allowed' : 'pointer', color: '#4A4845' }}>Anterior</button>
            <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1} style={{ padding: '7px 14px', background: pagina >= totalPaginas - 1 ? '#F0EFEB' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer', color: '#4A4845' }}>Próxima</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumoCard({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A' }}>{valor}</div>
      <div style={{ fontSize: 12, color: '#8A8880', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (valor: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#6B6966', fontWeight: 600 }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ height: 38, border: '1px solid #E8E6DF', borderRadius: 8, padding: '0 11px', fontSize: 13, fontFamily: 'Onest, sans-serif', color: '#1A1A1A', background: '#fff' }}
      />
    </label>
  )
}

function Ranking({ titulo, dados, onClick }: { titulo: string; dados: RankingItem[]; onClick: (valor: string) => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>{titulo}</div>
      {dados.length === 0 ? (
        <div style={{ fontSize: 12, color: '#B0AEA8' }}>Sem dados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {dados.slice(0, 5).map((item, index) => (
            <button key={item.nome} onClick={() => onClick(item.nome)} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Onest, sans-serif', textAlign: 'left' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#4A4845' }}>{index + 1}. {item.nome}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>{item.total.toLocaleString('pt-BR')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
