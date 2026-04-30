'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/fontes', label: 'Fontes', icon: '⊕' },
  { href: '/admin/produtos', label: 'Produtos', icon: '◈' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    // Verifica cookie de sessão admin
    const ok = document.cookie.includes('admin_session=1')
    if (!ok && pathname !== '/admin/login') {
      router.replace('/admin/login')
    } else {
      setAutenticado(true)
    }
  }, [pathname, router])

  if (!autenticado && pathname !== '/admin/login') return null
  if (pathname === '/admin/login') return <>{children}</>

  function handleLogout() {
    document.cookie = 'admin_session=; max-age=0; path=/'
    router.push('/admin/login')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#F5F4F0',
      fontFamily: 'Onest, sans-serif',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#fff',
        borderRight: '1px solid #E8E6DF',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid #E8E6DF',
        }}>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#1A1A1A',
          }}>
            aguante
          </div>
          <div style={{ fontSize: 11, color: '#8A8880', fontWeight: 500, marginTop: 2 }}>
            Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {NAV.map(item => {
            const ativo = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  marginBottom: 2,
                  background: ativo ? '#F0EFEB' : 'transparent',
                  color: ativo ? '#1A1A1A' : '#6B6966',
                  fontWeight: ativo ? 600 : 400,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #E8E6DF' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'none',
              border: 'none',
              borderRadius: 8,
              color: '#8A8880',
              fontSize: 13,
              fontFamily: 'Onest, sans-serif',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>↩</span> Sair
          </button>
          <a
            href="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              color: '#8A8880',
              fontSize: 13,
              textDecoration: 'none',
              borderRadius: 8,
            }}
          >
            <span>↗</span> Ver site
          </a>
        </div>
      </aside>

      {/* Content */}
      <main style={{ marginLeft: 220, flex: 1, padding: '40px 48px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
