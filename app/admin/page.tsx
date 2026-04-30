'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ProdutoMetrica = {
  id: string
  titulo: string
  clube: string
  imagem_url: string | null
  views: number
  likes: number
  cliques_anuncio: number
  fonte_nome: string
}

type ClubeContagem = {
  clube: string
  total: number
}

export default function AdminDashboard() {
  const [maisVistos, setMaisVistos] = useState<ProdutoMetrica[]>([])
  const [maisClicados, setMaisClicados] = useState<ProdutoMetrica[]>([])
  const [maisCurtidos, setMaisCurtidos] = useState<ProdutoMetrica[]>([])
  const [clubesRanking, setClubesRanking] = useState<ClubeContagem[]>([])
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [totalFontes, setTotalFontes] = useState(0)
  const [totalCadastros, setTotalCadastros] = useState(0)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [
        { data: vistos },
        { data: clicados },
        { data: curtidos },
        { count: totProd },
        { count: totFontes },
        { count: totCad },
      ] = await Promise.all([
        supabase
          .from('produtos')
          .select('id,titulo,clube,imagem_url,views,likes,cliques_anuncio,fonte_nome')
          .order('views', { ascending: false })
          .limit(5),
        supabase
          .from('produtos')
          .select('id,titulo,clube,imagem_url,views,likes,cliques_anuncio,fonte_nome')
          .order('cliques_anuncio', { ascending: false })
          .limit(5),
        supabase
          .from('produtos')
          .select('id,titulo,clube,imagem_url,views,likes,cliques_anuncio,fonte_nome')
          .order('likes', { ascending: false })
          .limit(5),
        supabase.from('produtos').select('*', { count: 'exact', head: true }),
        supabase.from('fontes').select('*', { count: 'exact', head: true }).eq('ativa', true),
        supabase.from('cadastros_cta').select('*', { count: 'exact', head: true }),
      ])

      // Ranking de clubes por total de produtos
      const { data: prodClube } = await supabase
        .from('produtos')
        .select('clube')
        .eq('ativo', true)
        .not('clube', 'is', null)

      if (prodClube) {
        const contagem: Record<string, number> = {}
        prodClube.forEach(p => {
          if (p.clube) contagem[p.clube] = (contagem[p.clube] || 0) + 1
        })
        const ranking = Object.entries(contagem)
          .map(([clube, total]) => ({ clube, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8)
        setClubesRanking(ranking)
      }

      setMaisVistos(vistos || [])
      setMaisClicados(clicados || [])
      setMaisCurtidos(curtidos || [])
      setTotalProdutos(totProd || 0)
      setTotalFontes(totFontes || 0)
      setTotalCadastros(totCad || 0)
      setCarregando(false)
    }

    carregar()
  }, [])

  if (carregando) {
    return (
      <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 40 }}>
        Carregando dados...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#1A1A1A',
          margin: 0,
        }}>
          Dashboard
        </h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          Visão geral do Aguante
        </p>
      </div>

      {/* Cards de totais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 40,
      }}>
        {[
          { label: 'Produtos indexados', valor: totalProdutos.toLocaleString('pt-BR'), icon: '◈' },
          { label: 'Fontes ativas', valor: totalFontes.toLocaleString('pt-BR'), icon: '⊕' },
          { label: 'Cadastros CTA', valor: totalCadastros.toLocaleString('pt-BR'), icon: '✉' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '1px solid #E8E6DF',
            borderRadius: 14,
            padding: '24px 28px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 10, color: '#4A4845' }}>{card.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A' }}>
              {card.valor}
            </div>
            <div style={{ fontSize: 13, color: '#8A8880', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Mais acessados */}
        <TabelaMetrica
          titulo="Mais acessados"
          subtitulo="por views na página"
          dados={maisVistos}
          campo="views"
          label="views"
        />

        {/* Mais clicados no anúncio */}
        <TabelaMetrica
          titulo="Mais clicados"
          subtitulo="cliques em &quot;ir para o anúncio&quot;"
          dados={maisClicados}
          campo="cliques_anuncio"
          label="cliques"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Mais curtidos */}
        <TabelaMetrica
          titulo="Mais curtidos"
          subtitulo="likes anônimos"
          dados={maisCurtidos}
          campo="likes"
          label="likes"
        />

        {/* Clubes com mais produtos */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8E6DF',
          borderRadius: 14,
          padding: '24px 28px',
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
              Clubes com mais produtos
            </div>
            <div style={{ fontSize: 12, color: '#8A8880', marginTop: 2 }}>
              total de camisas indexadas
            </div>
          </div>
          {clubesRanking.length === 0 ? (
            <Vazio />
          ) : (
            <div>
              {clubesRanking.map((item, i) => {
                const max = clubesRanking[0].total
                const pct = Math.round((item.total / max) * 100)
                return (
                  <div key={item.clube} style={{ marginBottom: 14 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                      alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: i === 0 ? '#1A1A1A' : '#8A8880',
                          width: 16,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>
                          {item.clube}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B6966', fontWeight: 600 }}>
                        {item.total.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div style={{
                      height: 4,
                      background: '#F0EFEB',
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: '#1A1A1A',
                        borderRadius: 99,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ——— Componente reutilizável de tabela de métricas ———

function TabelaMetrica({
  titulo,
  subtitulo,
  dados,
  campo,
  label,
}: {
  titulo: string
  subtitulo: string
  dados: ProdutoMetrica[]
  campo: keyof ProdutoMetrica
  label: string
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E8E6DF',
      borderRadius: 14,
      padding: '24px 28px',
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{titulo}</div>
        <div
          style={{ fontSize: 12, color: '#8A8880', marginTop: 2 }}
          dangerouslySetInnerHTML={{ __html: subtitulo }}
        />
      </div>
      {dados.length === 0 ? (
        <Vazio />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dados.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 0',
              borderBottom: i < dados.length - 1 ? '1px solid #F0EFEB' : 'none',
            }}>
              {/* Posição */}
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: i === 0 ? '#1A1A1A' : '#B0AEA8',
                width: 16,
                flexShrink: 0,
              }}>
                {i + 1}
              </span>

              {/* Imagem */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: '#F0EFEB',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {p.imagem_url && (
                  <img
                    src={p.imagem_url}
                    alt={p.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1A1A1A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {p.titulo}
                </div>
                <div style={{ fontSize: 11, color: '#8A8880', marginTop: 1 }}>
                  {p.clube || '—'} · {p.fonte_nome}
                </div>
              </div>

              {/* Métrica */}
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#1A1A1A',
                flexShrink: 0,
              }}>
                {Number(p[campo] || 0).toLocaleString('pt-BR')}
                <span style={{ fontSize: 10, fontWeight: 400, color: '#8A8880', marginLeft: 3 }}>
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Vazio() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '24px 0',
      color: '#B0AEA8',
      fontSize: 13,
    }}>
      Sem dados ainda
    </div>
  )
}
