'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react'

type RankingItem = {
  chave: string
  label: string
  total: number
  precoMedio: number
  diasMedio: number
  diasMediano: number
  ticketEstimado: number
  cliques: number
  likes: number
  estoqueAtivo?: number
  alertas?: number
  preferencias?: number
  score?: number
  velocidade?: number
}

type ProdutoEncalhado = {
  id: string
  titulo: string
  clube: string | null
  ano: string | null
  preco: number | null
  fonte_nome: string | null
  created_at: string
  diasAtivo: number
}

type MercadoResponse = {
  filtros: {
    inicio: string
    fim: string
    lojas: string[]
    clubes: string[]
    anos: string[]
    categorias: string[]
  }
  resumo: {
    vendasEstimadas: number
    precoMedio: number
    ticketEstimado: number
    diasMedio: number
    diasMediano: number
    estoqueAtivo: number
    encalhados: number
    clubeMaisLiquido: string | null
    lojaMaisVendas: string | null
  }
  rankings: {
    lojas: RankingItem[]
    clubes: RankingItem[]
    clubeAnos: RankingItem[]
    rapidos: RankingItem[]
    precoPorLoja: RankingItem[]
    precoPorClube: RankingItem[]
    demanda: RankingItem[]
    oportunidades: RankingItem[]
  }
  graficos: {
    porMes: RankingItem[]
    liquidez: RankingItem[]
  }
  encalhados: ProdutoEncalhado[]
  aviso: string
}

type Filtros = {
  inicio: string
  fim: string
  loja: string
  clube: string
  categoria: string
  ano: string
  precoMin: string
  precoMax: string
}

const hoje = new Date()
const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

const FILTROS_INICIAIS: Filtros = {
  inicio: dataInput(inicioMes),
  fim: dataInput(hoje),
  loja: '',
  clube: '',
  categoria: '',
  ano: '',
  precoMin: '',
  precoMax: '',
}

function dataInput(data: Date) {
  return data.toISOString().slice(0, 10)
}

function brl(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function numero(valor: number, casas = 0) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

export default function AdminMercado() {
  const [dados, setDados] = useState<MercadoResponse | null>(null)
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function carregar() {
      setCarregando(true)
      setErro('')

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([chave, valor]) => {
        if (valor) params.set(chave, valor)
      })

      try {
        const res = await fetch(`/api/admin/cms/mercado?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados.')
        setDados(json)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setErro(error instanceof Error ? error.message : 'Erro ao carregar dados.')
        }
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }

    carregar()
    return () => controller.abort()
  }, [filtros])

  const opcoes = dados?.filtros

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
          Inteligência de mercado
        </h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          Preferências, giro, preço médio e vendas estimadas por produtos que ficaram inativos.
        </p>
      </div>

      <FiltrosMercado filtros={filtros} setFiltros={setFiltros} opcoes={opcoes} />

      {erro && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', color: '#8A4B00', borderRadius: 8, padding: '12px 14px', fontSize: 13, marginBottom: 20 }}>
          {erro}
        </div>
      )}

      {carregando && !dados ? (
        <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 20 }}>Carregando dados...</div>
      ) : dados ? (
        <Conteudo dados={dados} carregando={carregando} />
      ) : null}
    </div>
  )
}

function FiltrosMercado({ filtros, setFiltros, opcoes }: {
  filtros: Filtros
  setFiltros: Dispatch<SetStateAction<Filtros>>
  opcoes?: MercadoResponse['filtros']
}) {
  function atualizar(campo: keyof Filtros, valor: string) {
    setFiltros(atual => ({ ...atual, [campo]: valor }))
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 10 }}>
        <CampoData label="Início" value={filtros.inicio} onChange={valor => atualizar('inicio', valor)} />
        <CampoData label="Fim" value={filtros.fim} onChange={valor => atualizar('fim', valor)} />
        <Select label="Loja" value={filtros.loja} onChange={valor => atualizar('loja', valor)} options={opcoes?.lojas || []} />
        <Select label="Categoria" value={filtros.categoria} onChange={valor => atualizar('categoria', valor)} options={opcoes?.categorias || []} />
        <Select label="Clube" value={filtros.clube} onChange={valor => atualizar('clube', valor)} options={opcoes?.clubes || []} />
        <Select label="Ano" value={filtros.ano} onChange={valor => atualizar('ano', valor)} options={opcoes?.anos || []} />
        <CampoTexto label="Preço mínimo" value={filtros.precoMin} onChange={valor => atualizar('precoMin', valor)} />
        <CampoTexto label="Preço máximo" value={filtros.precoMax} onChange={valor => atualizar('precoMax', valor)} />
      </div>
    </div>
  )
}

function Conteudo({ dados, carregando }: { dados: MercadoResponse; carregando: boolean }) {
  const resumo = dados.resumo
  const cards = [
    { label: 'Vendas estimadas', valor: numero(resumo.vendasEstimadas), detalhe: 'inativos no período' },
    { label: 'Preço médio', valor: brl(resumo.precoMedio), detalhe: 'sobre produtos com preço' },
    { label: 'Ticket estimado', valor: brl(resumo.ticketEstimado), detalhe: 'soma dos preços' },
    { label: 'Tempo mediano', valor: `${numero(resumo.diasMediano, 1)} dias`, detalhe: 'até ficar inativo' },
    { label: 'Estoque ativo', valor: numero(resumo.estoqueAtivo), detalhe: `${numero(resumo.encalhados)} encalhados` },
  ]

  return (
    <div style={{ opacity: carregando ? 0.65 : 1, transition: 'opacity 0.15s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {cards.map(card => <CardResumo key={card.label} {...card} />)}
      </div>

      <div style={{ background: '#1A1A1A', color: '#fff', borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ fontSize: 13, color: '#EDEBE5' }}>{dados.aviso}</div>
        <div style={{ fontSize: 13, color: '#CFCBC1', whiteSpace: 'nowrap' }}>
          Mais rápido: {resumo.clubeMaisLiquido || '-'} · Loja líder: {resumo.lojaMaisVendas || '-'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24, marginBottom: 24 }}>
        <Painel titulo="Vendas estimadas por mês" subtitulo="produtos que ficaram inativos">
          <BarChart dados={dados.graficos.porMes} campo="total" formato={valor => numero(valor)} />
        </Painel>
        <Painel titulo="Mapa de liquidez" subtitulo="preço médio x dias medianos">
          <Liquidez dados={dados.graficos.liquidez} />
        </Painel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Ranking titulo="Vendas por loja" subtitulo="quantidade e preço médio" dados={dados.rankings.lojas} valor="total" />
        <Ranking titulo="Clubes mais vendidos" subtitulo="produtos inativados no período" dados={dados.rankings.clubes} valor="total" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Ranking titulo="Clubes que vendem mais rápido" subtitulo="mediana de dias até inativar" dados={dados.rankings.rapidos} valor="dias" menorMelhor />
        <Ranking titulo="Clubes/anos mais vendidos" subtitulo="combina clube e temporada" dados={dados.rankings.clubeAnos} valor="total" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Ranking titulo="Preço médio por loja" subtitulo="ticket estimado por origem" dados={dados.rankings.precoPorLoja} valor="preco" />
        <Ranking titulo="Preço médio por clube" subtitulo="referência dos produtos inativados" dados={dados.rankings.precoPorClube} valor="preco" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Demanda dados={dados.rankings.demanda} />
        <Encalhados dados={dados.encalhados} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Oportunidades dados={dados.rankings.oportunidades} />
      </div>
    </div>
  )
}

function CardResumo({ label, valor, detalhe }: { label: string; valor: string; detalhe: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, padding: '20px 22px' }}>
      <div style={{ fontSize: 12, color: '#8A8880', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 25, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.1 }}>{valor}</div>
      <div style={{ fontSize: 11, color: '#A7A39A', marginTop: 6 }}>{detalhe}</div>
    </div>
  )
}

function Painel({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, padding: '22px 24px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{titulo}</div>
        <div style={{ fontSize: 12, color: '#8A8880', marginTop: 2 }}>{subtitulo}</div>
      </div>
      {children}
    </div>
  )
}

function Ranking({ titulo, subtitulo, dados, valor, menorMelhor = false }: {
  titulo: string
  subtitulo: string
  dados: RankingItem[]
  valor: 'total' | 'preco' | 'dias'
  menorMelhor?: boolean
}) {
  const ordenados = useMemo(() => {
    const copia = [...dados]
    if (valor === 'dias') return copia.sort((a, b) => a.diasMediano - b.diasMediano)
    if (valor === 'preco') return copia.sort((a, b) => b.precoMedio - a.precoMedio)
    return copia.sort((a, b) => b.total - a.total)
  }, [dados, valor])

  const max = Math.max(...ordenados.map(item => valor === 'preco' ? item.precoMedio : valor === 'dias' ? item.diasMediano : item.total), 1)

  return (
    <Painel titulo={titulo} subtitulo={subtitulo}>
      {ordenados.length === 0 ? <Vazio /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ordenados.slice(0, 10).map((item, index) => {
            const valorNumerico = valor === 'preco' ? item.precoMedio : valor === 'dias' ? item.diasMediano : item.total
            const largura = menorMelhor ? Math.max(8, 100 - (valorNumerico / max) * 100) : (valorNumerico / max) * 100
            const valorTexto = valor === 'preco' ? brl(item.precoMedio) : valor === 'dias' ? `${numero(item.diasMediano, 1)} dias` : numero(item.total)
            return (
              <div key={`${item.chave}-${index}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 5 }}>
                  <div style={{ minWidth: 0, display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ width: 18, fontSize: 11, color: '#8A8880', fontWeight: 700 }}>{index + 1}</span>
                    <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#4A4845', fontWeight: 700, whiteSpace: 'nowrap' }}>{valorTexto}</div>
                </div>
                <div style={{ height: 5, background: '#F0EFEB', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(4, largura)}%`, height: '100%', background: '#1A1A1A', borderRadius: 99 }} />
                </div>
                <div style={{ marginLeft: 26, marginTop: 4, fontSize: 11, color: '#9B988F' }}>
                  {numero(item.total)} vendas estimadas · {brl(item.precoMedio)} médio
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Painel>
  )
}

function BarChart({ dados, campo, formato }: { dados: RankingItem[]; campo: keyof RankingItem; formato: (valor: number) => string }) {
  const max = Math.max(...dados.map(item => Number(item[campo]) || 0), 1)
  if (!dados.length) return <Vazio />

  return (
    <div style={{ height: 230, display: 'flex', alignItems: 'end', gap: 10, borderBottom: '1px solid #E8E6DF', paddingTop: 10 }}>
      {dados.map(item => {
        const valor = Number(item[campo]) || 0
        return (
          <div key={item.chave} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'end', alignItems: 'center', minWidth: 38 }}>
            <div style={{ fontSize: 11, color: '#4A4845', fontWeight: 700, marginBottom: 6 }}>{formato(valor)}</div>
            <div style={{ width: '100%', maxWidth: 42, height: `${Math.max(6, (valor / max) * 170)}px`, background: '#1A1A1A', borderRadius: '6px 6px 0 0' }} />
            <div style={{ fontSize: 11, color: '#8A8880', marginTop: 8, whiteSpace: 'nowrap' }}>{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

function Liquidez({ dados }: { dados: RankingItem[] }) {
  if (!dados.length) return <Vazio />
  const maxPreco = Math.max(...dados.map(item => item.precoMedio), 1)
  const maxDias = Math.max(...dados.map(item => item.diasMediano), 1)

  return (
    <div style={{ position: 'relative', height: 260, borderLeft: '1px solid #E8E6DF', borderBottom: '1px solid #E8E6DF', background: 'linear-gradient(180deg, #fff 0%, #FAF9F6 100%)' }}>
      <div style={{ position: 'absolute', left: 10, top: 8, fontSize: 11, color: '#8A8880' }}>Preço</div>
      <div style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 11, color: '#8A8880' }}>Dias</div>
      {dados.slice(0, 16).map(item => {
        const left = Math.min(88, Math.max(6, (item.diasMediano / maxDias) * 86))
        const bottom = Math.min(86, Math.max(8, (item.precoMedio / maxPreco) * 82))
        const tamanho = Math.min(28, Math.max(10, item.total * 3))
        return (
          <div
            key={item.chave}
            title={`${item.label}: ${brl(item.precoMedio)}, ${numero(item.diasMediano, 1)} dias`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              bottom: `${bottom}%`,
              width: tamanho,
              height: tamanho,
              borderRadius: '50%',
              background: '#550fed',
              opacity: 0.72,
              transform: 'translate(-50%, 50%)',
            }}
          />
        )
      })}
    </div>
  )
}

function Demanda({ dados }: { dados: RankingItem[] }) {
  return (
    <Painel titulo="Índice de demanda" subtitulo="vendas, cliques, likes, alertas e escolhas">
      {dados.length === 0 ? <Vazio /> : (
        <TabelaSimples
          dados={dados.slice(0, 10)}
          colunas={[
            { label: 'Clube', render: item => item.label },
            { label: 'Score', render: item => numero(item.score || 0) },
            { label: 'Estoque', render: item => numero(item.estoqueAtivo || 0) },
          ]}
        />
      )}
    </Painel>
  )
}

function Encalhados({ dados }: { dados: ProdutoEncalhado[] }) {
  return (
    <Painel titulo="Produtos encalhados" subtitulo="ativos há mais de 60 dias">
      {dados.length === 0 ? <Vazio /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dados.slice(0, 8).map(produto => (
            <div key={produto.id} style={{ borderBottom: '1px solid #F0EFEB', paddingBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{produto.titulo}</div>
                <div style={{ fontSize: 12, color: '#4A4845', fontWeight: 700, whiteSpace: 'nowrap' }}>{numero(produto.diasAtivo)} dias</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A8880', marginTop: 3 }}>
                {produto.clube || '-'}{produto.ano ? ` · ${produto.ano}` : ''} · {produto.fonte_nome || '-'} · {produto.preco ? brl(produto.preco) : 'sem preço'}
              </div>
            </div>
          ))}
        </div>
      )}
    </Painel>
  )
}

function Oportunidades({ dados }: { dados: RankingItem[] }) {
  return (
    <Painel titulo="Oportunidades de curadoria" subtitulo="alta demanda em relação ao estoque ativo">
      {dados.length === 0 ? <Vazio /> : (
        <TabelaSimples
          dados={dados}
          colunas={[
            { label: 'Clube', render: item => item.label },
            { label: 'Score', render: item => numero(item.score || 0) },
            { label: 'Estoque ativo', render: item => numero(item.estoqueAtivo || 0) },
            { label: 'Vendas estimadas', render: item => numero(item.total) },
            { label: 'Preço médio', render: item => brl(item.precoMedio) },
          ]}
        />
      )}
    </Painel>
  )
}

function TabelaSimples({ dados, colunas }: {
  dados: RankingItem[]
  colunas: { label: string; render: (item: RankingItem) => string }[]
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
          {colunas.map(coluna => (
            <th key={coluna.label} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: '#8A8880', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{coluna.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dados.map((item, index) => (
          <tr key={`${item.chave}-${index}`} style={{ borderBottom: index < dados.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
            {colunas.map(coluna => (
              <td key={coluna.label} style={{ padding: '11px 8px', fontSize: 13, color: coluna.label === 'Clube' ? '#1A1A1A' : '#6B6966', fontWeight: coluna.label === 'Clube' ? 600 : 500 }}>
                {coluna.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CampoData({ label, value, onChange }: { label: string; value: string; onChange: (valor: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, color: '#8A8880', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <input type="date" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </label>
  )
}

function CampoTexto({ label, value, onChange }: { label: string; value: string; onChange: (valor: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, color: '#8A8880', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} placeholder="Todos" style={inputStyle} />
    </label>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (valor: string) => void; options: string[] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, color: '#8A8880', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
        <option value="">Todos</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Vazio() {
  return <div style={{ textAlign: 'center', padding: '30px 0', color: '#B0AEA8', fontSize: 13 }}>Sem dados no período</div>
}

const inputStyle: CSSProperties = {
  height: 38,
  padding: '0 11px',
  border: '1.5px solid #E8E6DF',
  borderRadius: 7,
  background: '#fff',
  color: '#1A1A1A',
  fontSize: 13,
  fontFamily: 'Onest, sans-serif',
  outline: 'none',
  minWidth: 0,
}
