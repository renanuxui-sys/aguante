'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setErro('Senha incorreta.')
      setCarregando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Onest, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #E8E6DF',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#1A1A1A',
            marginBottom: 6,
          }}>
            aguante
          </div>
          <div style={{ fontSize: 13, color: '#8A8880', fontWeight: 500 }}>
            Painel Administrativo
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: '#4A4845',
              marginBottom: 6,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>
              Senha de acesso
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                border: `1.5px solid ${erro ? '#E53E3E' : '#E8E6DF'}`,
                borderRadius: 10,
                fontSize: 15,
                fontFamily: 'Onest, sans-serif',
                background: '#FAFAF8',
                color: '#1A1A1A',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
            />
            {erro && (
              <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 6 }}>
                {erro}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={carregando || !senha}
            style={{
              width: '100%',
              padding: '12px',
              background: carregando || !senha ? '#C8C6BF' : '#1A1A1A',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Onest, sans-serif',
              cursor: carregando || !senha ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
