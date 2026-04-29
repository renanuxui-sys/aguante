# Aguante — Guia de Scrapers

## Stack utilizada em todos os scrapers
- **node-fetch** — requisições HTTP
- **cheerio** — leitura e extração de HTML
- **@supabase/supabase-js** — salvar dados no banco
- **dotenv** — lê variáveis do `.env`

## Configuração necessária (uma vez só)
```bash
npm install node-fetch cheerio dotenv
```

Adicionar no `package.json`:
```json
"type": "module"
```

Criar `.env` na raiz (cópia do `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Rodar qualquer scraper com:
```bash
node nome-do-scraper.js
```

---

## Ajustes feitos no banco (necessários antes do primeiro scraper)

```sql
-- Coluna que faltava na tabela produtos
ALTER TABLE produtos ADD COLUMN fonte_url TEXT;

-- Constraint para o upsert funcionar sem duplicar
ALTER TABLE produtos ADD CONSTRAINT produtos_link_original_unique UNIQUE (link_original);

-- Desativar RLS em produtos (dados públicos)
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;

-- Leitura pública de produtos
CREATE POLICY "leitura publica de produtos"
ON produtos FOR SELECT TO anon USING (true);

-- Leitura pública de clubes
CREATE POLICY "leitura publica de clubes"
ON clubes FOR SELECT TO anon USING (true);

-- Escrita pública em alertas
CREATE POLICY "permitir insert alertas"
ON alertas FOR INSERT TO anon WITH CHECK (true);
```

---

## Scraper 1 — Memórias do Esporte (WooCommerce)

### Arquivos
- `scraper-memorias.js` — categorias gerais (clubes brasileiros)
- `scraper-memorias-inter-gremio.js` — Inter e Grêmio (categorias separadas)
- `fix-imagens.js` — corrige imagens que vieram como placeholder

### URLs rastreadas
| Arquivo | URL | Páginas | Produtos |
|---|---|---|---|
| scraper-memorias.js | `/categoria-produto/futebol/brasil/` | 107 | 962 |
| scraper-memorias-inter-gremio.js | `/categoria-produto/futebol/internacional/` | 19 | ~150 |
| scraper-memorias-inter-gremio.js | `/categoria-produto/futebol/gremio/` | 14 | ~141 |
| **Total** | | | **~1.253** |

### Paginação WooCommerce
```
Página 1: /categoria-produto/futebol/brasil/
Página 2: /categoria-produto/futebol/brasil/page/2/
Página N: /categoria-produto/futebol/brasil/page/N/
```

### Seletores HTML que funcionaram
```js
$('ul.products li.product').each((_, el) => {
  titulo  = $el.find('h2').text().trim()
  link    = $el.find('a.woocommerce-loop-product__link').attr('href')
  imagem  = $el.find('img').attr('src') || $el.find('img').attr('data-src')
  preco   = $el.find('.price ins .amount, .price .amount').first().text()
})
```

### Problema de imagens (lazy loading)
O site usa lazy loading — muitas imagens chegam como `data:image/svg+xml` no `src`.
**Solução:** `fix-imagens.js` visita a página individual de cada produto sem imagem e extrai o `src` real:
```js
// Seletores da página de produto individual
$('div.woocommerce-product-gallery__image img').attr('src')
$('figure.woocommerce-product-gallery__wrapper img').attr('src')
$('.wp-post-image').attr('src')
```
**Resultado:** 830 de 831 imagens corrigidas.

### Identificação automática de clube
```js
const CLUBES_MAP = [
  { clube: 'Flamengo',      termos: ['flamengo'] },
  { clube: 'Corinthians',   termos: ['corinthians'] },
  { clube: 'Palmeiras',     termos: ['palmeiras'] },
  { clube: 'São Paulo',     termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Grêmio',        termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', termos: ['internacional', 'inter '] },
  { clube: 'Santos',        termos: ['santos'] },
  { clube: 'Atlético-MG',   termos: ['atlético-mg', 'atletico-mg', 'atlético mineiro', 'galo'] },
  { clube: 'Botafogo',      termos: ['botafogo'] },
  { clube: 'Fluminense',    termos: ['fluminense'] },
  { clube: 'Vasco',         termos: ['vasco'] },
  { clube: 'Cruzeiro',      termos: ['cruzeiro'] },
  { clube: 'Athletico-PR',  termos: ['athletico', 'atlético-pr', 'paranaense', 'furacão'] },
  { clube: 'Fortaleza',     termos: ['fortaleza'] },
  { clube: 'Bahia',         termos: ['bahia'] },
  { clube: 'Vitória',       termos: ['vitória', 'vitoria'] },
]
```

### Extração de ano
```js
titulo.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
// Captura anos de 1950 a 2029
```

### Configurações
```js
DELAY_MS = 1500   // pausa entre páginas (respeita o servidor)
timeout  = 15000  // timeout por requisição
```

### Upsert — evita duplicatas
```js
supabase.from('produtos').upsert(produtos, {
  onConflict: 'link_original',
  ignoreDuplicates: false  // atualiza preço e imagem se já existir
})
```

### Quando rodar novamente
- O upsert garante que não duplica — pode rodar a qualquer momento
- Produtos existentes terão preço e imagem atualizados
- Novos produtos serão inseridos automaticamente

---

## Próximos scrapers planejados

### Mercado Livre → API oficial
**Abordagem recomendada:** API pública gratuita

```
GET https://api.mercadolibre.com/sites/MLB/search?q=camisa+futebol+retro&category=MLB1276
```
Retorna JSON com título, preço, imagem, link e vendedor.

**Passos:**
1. Criar conta em developers.mercadolivre.com.br
2. Criar app gratuito → obter `access_token`
3. Usar endpoint de busca com filtros por categoria

---

### OLX → Playwright (navegador headless)
A OLX renderiza via JavaScript — `node-fetch` retorna página vazia.

```bash
npm install playwright
npx playwright install chromium
```

```js
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('https://www.olx.com.br/esporte-e-lazer?q=camisa+futebol')
await page.waitForSelector('.olx-ad-card')
const html = await page.content()
// aí usa cheerio normalmente
```

---

## Checklist para novo scraper

- [ ] O site renderiza no servidor (HTML estático) ou no cliente (JavaScript)?
  - Estático → `node-fetch` + `cheerio`
  - JavaScript → `playwright`
- [ ] O site tem API oficial? → usar a API
- [ ] Qual o padrão de paginação?
- [ ] Quais seletores CSS identificam cada produto? (inspecionar com F12)
- [ ] O site tem proteção anti-bot (Cloudflare, CAPTCHA)?
- [ ] Testar com 1-2 páginas antes de rodar completo

---

## Sites cadastrados como fonte

| Site | Tipo | Abordagem | Arquivo | Status |
|---|---|---|---|---|
| memoriasdoesporteoficial.com.br | WooCommerce | node-fetch + cheerio | scraper-memorias.js | ✅ Ativo |
| memoriasdoesporteoficial.com.br | WooCommerce | node-fetch + cheerio | scraper-memorias-inter-gremio.js | ✅ Ativo |
| mercadolivre.com.br | Marketplace | API oficial | — | 🔜 Próximo |
| olx.com.br | Classificados | Playwright | — | 📋 Planejado |
| enjoei.com.br | Marketplace | A verificar | — | 📋 Backlog |
