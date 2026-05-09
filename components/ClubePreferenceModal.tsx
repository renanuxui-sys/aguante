'use client'
import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TODOS_CLUBES } from './Navbar'
import { supabase } from '@/lib/supabase'

const imgLogo = '/assets/logo.svg'
const imgChevronDown = '/assets/chevron-down.svg'

const STORAGE_KEY = 'aguante_clube_preferencia'
const STORAGE_RECORDED_KEY = 'aguante_clube_preferencia_registrada'
const STORAGE_EVENT = 'aguante:clube-preferencia'

export default function ClubePreferenceModal() {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [clubes, setClubes] = useState<string[]>([])
  const [clube, setClube] = useState('')

  const registrarEscolha = useCallback(async (valor: string, acao: 'escolheu' | 'prefiro_nao_escolher' | 'entrou_sem_escolher') => {
    await supabase.from('clubes_preferencias').insert({
      clube: valor === 'nao_escolheu' ? null : valor,
      acao,
      origem: 'modal_abertura',
      path: pathname || '/',
    })
  }, [pathname])

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    let ativo = true

    queueMicrotask(() => {
      if (!ativo) return
      const salvo = localStorage.getItem(STORAGE_KEY)
      const registrado = localStorage.getItem(STORAGE_RECORDED_KEY)
      if (!salvo) {
        setAberto(true)
        return
      }
      if (!registrado) {
        const acao = salvo === 'nao_escolheu' ? 'entrou_sem_escolher' : 'escolheu'
        registrarEscolha(salvo, acao)
          .then(() => localStorage.setItem(STORAGE_RECORDED_KEY, '1'))
          .catch(error => console.warn('Não foi possível registrar a preferência de clube:', error))
      }
    })

    return () => { ativo = false }
  }, [pathname, registrarEscolha])

  useEffect(() => {
    async function carregarClubes() {
      const { data } = await supabase
        .from('clubes')
        .select('nome')
        .eq('ativo', true)
        .eq('categoria', 'Clubes Brasileiros')
        .order('nome', { ascending: true })

      const nomes = data?.map(c => c.nome).filter(Boolean) || TODOS_CLUBES
      const unicos = Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
      setClubes(unicos)
    }

    carregarClubes()
  }, [])

  async function salvar(valor: string, acao?: 'escolheu' | 'prefiro_nao_escolher' | 'entrou_sem_escolher') {
    localStorage.setItem(STORAGE_KEY, valor)
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: valor }))
    setAberto(false)
    const acaoRegistro = acao || (valor === 'nao_escolheu'
      ? 'entrou_sem_escolher'
      : 'escolheu'
    )
    registrarEscolha(valor, acaoRegistro)
      .then(() => localStorage.setItem(STORAGE_RECORDED_KEY, '1'))
      .catch(error => console.warn('Não foi possível registrar a preferência de clube:', error))
  }

  if (!aberto) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.84)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        .ag-clube-modal-wrap { width: 100%; max-width: 620px; position: relative; }
        .ag-clube-modal-card { background: #f8f8f8; border: 1px solid rgba(255,255,255,0.8); border-radius: 22px; padding: 44px 56px 34px; box-shadow: 0 48px 90px rgba(255,255,255,0.24); text-align: center; }
        .ag-clube-modal-logo { display: block; width: 124px; height: auto; margin: 0 auto 26px; }
        .ag-clube-modal-title { font-weight: 300; font-size: 34px; color: #000; letter-spacing: -0.04em; line-height: 1.15; margin-bottom: 22px; }
        .ag-clube-modal-text { font-weight: 300; font-size: 20px; color: #000; letter-spacing: -0.02em; line-height: 1.25; margin-bottom: 28px; }
        .ag-clube-modal-field { position: relative; width: 100%; margin-bottom: 22px; }
        .ag-clube-modal-select { width: 100%; height: 56px; border: 1px solid #e0dee7; background: #fff; border-radius: 16px; padding: 0 54px 0 24px; font-size: 16px; font-family: Onest, sans-serif; outline: none; appearance: none; box-shadow: 0px 3.52px 4.4px rgba(183,181,203,0.1); cursor: pointer; }
        @media (max-width: 768px) {
          .ag-clube-modal-wrap { max-width: 100%; }
          .ag-clube-modal-card { padding: 34px 24px 28px; border-radius: 20px; }
          .ag-clube-modal-logo { width: 112px; margin-left: auto; margin-right: auto; margin-bottom: 22px; }
          .ag-clube-modal-title { font-size: 27px; line-height: 1.12; margin-bottom: 18px; }
          .ag-clube-modal-text { font-size: 16px; line-height: 1.28; margin-bottom: 24px; }
          .ag-clube-modal-select { width: 100%; height: 54px; font-size: 15px; }
        }
      `}</style>
      <div className="ag-clube-modal-wrap">
        <button onClick={() => setAberto(false)} aria-label="Fechar" style={{ position: 'absolute', top: -42, right: -12, width: 36, height: 36, border: 'none', background: 'transparent', color: '#fff', fontSize: 36, lineHeight: 1, cursor: 'pointer', fontWeight: 300 }}>
          ×
        </button>
        <div className="ag-clube-modal-card">
          <img src={imgLogo} alt="Aguante" className="ag-clube-modal-logo" />
          <p className="ag-clube-modal-title">Qual o clube de sua preferência?</p>
          <p className="ag-clube-modal-text">
            Queremos personalizar a sua experiência em nossa plataforma.
          </p>
          <div className="ag-clube-modal-field">
            <select value={clube} onChange={e => setClube(e.target.value)} className="ag-clube-modal-select" style={{ color: clube ? '#000' : '#282828' }}>
              <option value="">Selecione seu time</option>
              {clubes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <img src={imgChevronDown} alt="" style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, pointerEvents: 'none' }} />
          </div>
          <button onClick={() => salvar(clube || 'nao_escolheu')} style={{ width: '100%', height: 56, border: 'none', borderRadius: 16, background: '#550fed', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'Onest, sans-serif', cursor: 'pointer', marginBottom: 26 }}>
            entrar
          </button>
          <button onClick={() => salvar('nao_escolheu', 'prefiro_nao_escolher')} style={{ border: 'none', background: 'transparent', color: '#000', fontSize: 14, fontFamily: 'Onest, sans-serif', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Prefiro não escolher
          </button>
        </div>
      </div>
    </div>
  )
}
