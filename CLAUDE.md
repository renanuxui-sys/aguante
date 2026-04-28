# Aguante — CLAUDE.md

## O que é este projeto

Aguante é uma plataforma de descoberta de camisas de futebol colecionáveis. Funciona como um buscador/agregador que rastreia sites de venda (Mercado Livre, OLX, Enjoei, etc.) e centraliza os resultados em um único lugar. Não é um marketplace — os usuários são redirecionados ao anúncio original.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Linguagem:** TypeScript
- **Estilo:** CSS inline + classes `ag-*` em `app/globals.css` (Tailwind v4 instalado mas subutilizado)
- **Banco:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (ainda não implementado)
- **Deploy:** Vercel
- **Fontes:** Onest (Google Fonts, via `<link>` no layout.tsx) + Instrument Serif (itálico no hero)

## Estrutura de arquivos

```
aguante/
├── app/
│   ├── globals.css          # Estilos globais + todas as classes ag-*
│   ├── layout.tsx           # Root layout com <link> das fontes
│   ├── page.tsx             # Home
│   ├── search/
│   │   └── page.tsx         # Resultado de busca
│   └── produto/
│       └── [id]/
│           └── page.tsx     # Página do produto
├── components/
│   ├── Navbar.tsx           # Header com scroll shrink + submenu + busca
│   ├── Footer.tsx           # CTA de cadastro + footer #ecebf0
│   ├── CardProduto.tsx      # Card 218×325px reutilizável
│   └── HistoricoPreco.tsx   # Componente de variação de preço (4 estados)
├── lib/
│   └── supabase.ts          # Cliente Supabase
├── types/
│   └── index.ts             # Tipos TypeScript (Produto, Fonte)
└── supabase-schema.sql      # Schema das tabelas
```

## Design System

**Figma:** `hqtJCU3OZnaXA4uNLMePO6` (conta empresa — tem tokens disponíveis)

**Cores:**
- Primary: `#550fed` / Light: `#745cff` / XLight: `#ebe8f2`
- Secondary green: `#1beaa0` / Pink: `#f0adfc`
- Black 900: `#282828` / Gray dark: `#62748c`
- Gray light: `#e0dee7` / XLight: `#ecebf0` / Background: `#f5f5f5`
- Feedback error: `#bf2d53` / Success: `#2dbf89`

**Tipografia:**
- Família: `Onest` (300, 400, 700)
- Serifada hero: `Instrument Serif` italic — apenas em "paixão" e "coleção"
- Letter-spacing: `-0.02em` títulos / `-0.01em` corpo

**Grid:** `max-width: 1140px`, padding lateral `24px`

**Classes ag-* disponíveis no globals.css:**
`ag-container`, `ag-card`, `ag-btn-primary`, `ag-btn-outline`, `ag-btn-buscar`, `ag-btn-cadastrar`, `ag-btn-ver-anuncio`, `ag-btn-alerta`, `ag-btn-voltar`, `ag-link`, `ag-link-black`, `ag-icon-btn`, `ag-icon-heart`, `ag-clube-btn`, `ag-submenu-item`, `ag-page-btn`, `ag-mercado-card`, `ag-input`, `ag-select`, `ag-search-pill`, `ag-hamburger`, `ag-cards`, `ag-card-row`

## Componentes

### Navbar
- Estado normal: transparente, `border-bottom: 1px solid #e0dee7`, altura 76px
- Estado scrolled (após 80px): pill flutuante centralizado, `border-radius: 24px`, `backdrop-filter: blur(4px)`, altura 70px
- Submenu "Explore camisas": abre no hover, grid 4 colunas com 20 clubes
- Busca funcional: input com `onSubmit` → `/search?q=...`
- Logo: `136×55px` fixo

### Footer
- Inclui bloco CTA (cadastro) com `marginBottom: -80px` avançando no footer
- Fundo footer: `#ecebf0`, logo centralizada, email com SVG

### CardProduto
- Dimensões: `218×325px`, `border-radius: 16px`, `overflow: visible`
- Foto: `height: 193px`, `border-radius: 16px` nos 4 cantos
- Hover: `translateY(-4px)` apenas, sem sombra colorida
- Badges: "de jogo", "novidade" (fundo preto), "alta procura" (verde `#1beaa0`)

### HistoricoPreco
Aceita prop `variacao: VariacaoPreco`:
- `'negativo'` — barra vermelha `#bf2d53`, seta ↗, texto "X% acima da média"
- `'positivo'` — barra verde `#2dbf89`, seta ↘, texto "X% abaixo da média"
- `'na_media'` — barra âmbar `#f59e0b`, ícone estrela, texto "dentro da média"
- `'disable'` — sem barras, ícone info-circle, texto de dados insuficientes

## Banco de dados (Supabase)

**Tabela `produtos`:** id, titulo, ano, preco, imagem_url, link_original, fonte_id, fonte_nome, clube, tags[], de_jogo, novidade, alta_procura, created_at

**Tabela `fontes`:** id, nome, url, ativa, ultimo_scraping, total_produtos, created_at

Credenciais em `.env.local` (nunca commitar):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ADMIN_PASSWORD=...
```

## Padrões de código

- Estilos sempre inline com `style={{}}` — não usar classes Tailwind nos componentes
- Classes `ag-*` para hover e comportamentos globais (definidas no globals.css)
- Dados mock sempre presentes como fallback quando Supabase retorna vazio
- Páginas usam `'use client'` — sem Server Components por enquanto
- Assets do Figma referenciados como `const img = "https://www.figma.com/api/mcp/asset/..."`

## Clubes suportados

Flamengo, Corinthians, Palmeiras, Atlético-MG, Atlético-PR, Juventude, Cuiabá, Fortaleza, Atlético-GO, Bahia, Botafogo, Criciúma, Bragantino, Cruzeiro, Fluminense, Grêmio, Internacional, São Paulo, Vasco, Vitória

## Próximos passos previstos

- Scraper com painel admin para adicionar fontes (URLs de sites a rastrear)
- Rotina diária de scraping via Supabase Functions + cron
- Tabelas SQL para alertas e cadastros do formulário CTA
- Deploy na Vercel (GitHub já conectado)
- Página de clube (`/clube/[nome]`)
- Autenticação para área premium