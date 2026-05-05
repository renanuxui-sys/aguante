'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TODOS_CLUBES } from './Navbar'
import { supabase } from '@/lib/supabase'

const imgLogo = '/assets/logo.svg'
const imgChevronDown = '/assets/chevron-down.svg'

const STORAGE_KEY = 'aguante_clube_preferencia'

export default function ClubePreferenceModal() {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [clubes, setClubes] = useState<string[]>([])
  const [clube, setClube] = useState('')

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (!salvo) setAberto(true)
  }, [pathname])

  useEffect(() => {
    async function carregarClubes() {
      const { data } = await supabase
        .from('clubes')
        .select('nome')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      const nomes = data?.map(c => c.nome).filter(Boolean) || TODOS_CLUBES
      const unicos = Array.from(new Set(nomes)).filter(nome => nome !== 'Outro').sort((a, b) => a.localeCompare(b, 'pt-BR'))
      setClubes([...unicos, 'Outro'])
    }

    carregarClubes()
  }, [])

  function salvar(valor: string) {
    localStorage.setItem(STORAGE_KEY, valor)
    setAberto(false)
  }

  if (!aberto) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.84)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 620, position: 'relative' }}>
        <button onClick={() => setAberto(false)} aria-label="Fechar" style={{ position: 'absolute', top: -42, right: -12, width: 36, height: 36, border: 'none', background: 'transparent', color: '#fff', fontSize: 36, lineHeight: 1, cursor: 'pointer', fontWeight: 300 }}>
          ×
        </button>
        <div style={{ background: '#f8f8f8', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 22, padding: '44px 56px 34px', boxShadow: '0 48px 90px rgba(255,255,255,0.24)', textAlign: 'center' }}>
          <img src={imgLogo} alt="Aguante" style={{ width: 124, height: 'auto', marginBottom: 26 }} />
          <p style={{ fontWeight: 300, fontSize: 34, color: '#000', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 22 }}>Qual seu clube do coração?</p>
          <p style={{ fontWeight: 300, fontSize: 20, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 28 }}>
            Gostaríamos de saber somente para<br />
            <strong style={{ fontWeight: 700 }}>personalizar a sua experiência</strong> em nosso site.
          </p>
          <div style={{ position: 'relative', marginBottom: 22 }}>
            <select value={clube} onChange={e => setClube(e.target.value)} style={{ width: '100%', height: 56, border: '1px solid #e0dee7', background: '#fff', borderRadius: 16, padding: '0 54px 0 24px', color: clube ? '#000' : '#282828', fontSize: 16, fontFamily: 'Onest, sans-serif', outline: 'none', appearance: 'none', boxShadow: '0px 3.52px 4.4px rgba(183,181,203,0.1)', cursor: 'pointer' }}>
              <option value="">Selecione seu time</option>
              {clubes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <img src={imgChevronDown} alt="" style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, pointerEvents: 'none' }} />
          </div>
          <button onClick={() => salvar(clube || 'nao_escolheu')} style={{ width: '100%', height: 56, border: 'none', borderRadius: 16, background: '#550fed', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'Onest, sans-serif', cursor: 'pointer', marginBottom: 26 }}>
            entrar
          </button>
          <button onClick={() => salvar('nao_escolheu')} style={{ border: 'none', background: 'transparent', color: '#000', fontSize: 18, fontFamily: 'Onest, sans-serif', cursor: 'pointer' }}>
            Prefiro não escolher
          </button>
        </div>
      </div>
    </div>
  )
}
