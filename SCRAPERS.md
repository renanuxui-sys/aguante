# Aguante — Guia de Scrapers

> Última atualização: Abril 2026

## Stack utilizada em todos os scrapers

- **node-fetch** — requisições HTTP
- **cheerio** — leitura e extração de HTML
- **playwright** — browser headless para sites com JavaScript
- **@supabase/supabase-js** — salvar dados no banco
- **dotenv** — lê variáveis do `.env`
- **scraper-utils.js** — utilitários compartilhados (ciclo de vida, funções comuns)

## Configuração necessária (uma vez só)

```bash
npm install node-fetch cheerio dotenv playwright
npx playwright install chromium
```

`package.json` deve ter:
```json
"type": "module"
```

`.env` na raiz (cópia do `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Rodar qualquer scraper:
```bash
node nome-do-scraper.js
```

Explorar Mercado Livre sem salvar no banco (experimental):
```bash
node scraper-mercadolivre.js --clubes=Flamengo,Internacional --max-paginas=1 --dry-run
```

Explorar Mercado Livre via Apify sem salvar no banco (experimental; gera custo):
```bash
node scraper-apify-mercadolivre.js --clubes=Flamengo --max-paginas=1
```

Salvar só alguns clubes do Mercado Livre, sem desativar anúncios antigos da fonte (experimental):
```bash
node scraper-mercadolivre.js --clubes=Palmeiras,Corinthians,Santos --max-paginas=2 --sem-desativar
```

---

## Ciclo de vida dos scrapers (padrão v2)

Todo scraper segue este fluxo para manter o banco atualizado:

1. **Desativa** todos os produtos da fonte (`ativo = false`)
2. **Raspa** o site e faz upsert com `ativo = true`
3. Produtos não encontrados ficam inativos (vendidos/removidos do site de origem)
4. Views, likes e histórico são **preservados** mesmo para produtos inativos

Funções do `scraper-utils.js`:
- `criarSupabase()` — cria cliente Supabase a partir do `.env`
- `desativarProdutosDaFonte(supabase, fonteNome)` — etapa 1
- `salvarProdutos(supabase, produtos)` — etapa 2 (upsert com ativo: true)
- `relatorioFinal(supabase, fonteNome, total)` — mostra ativos vs inativos
- `extrairAno(titulo)` — extrai ano do título (1950–2029)
- `identificarClube(titulo)` — identifica clube pelo título via CLUBES_MAP
- `sleep(ms)` — pausa entre requisições

---

## Ajustes de banco necessários (feitos uma vez)

```sql
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS fonte_url TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cliques_anuncio INTEGER DEFAULT 0;

ALTER TABLE produtos ADD CONSTRAINT produtos_link_original_unique UNIQUE (link_original);
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_produtos_fonte_ativo ON produtos(fonte_nome, ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_views ON produtos(views DESC);

CREATE OR REPLACE FUNCTION incrementar_views(produto_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE produtos SET views = COALESCE(views, 0) + 1 WHERE id = produto_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ajustar_likes(produto_id UUID, delta INTEGER)
RETURNS INTEGER AS $$
DECLARE novo_total INTEGER;
BEGIN
  UPDATE produtos SET likes = GREATEST(0, COALESCE(likes, 0) + delta)
  WHERE id = produto_id RETURNING likes INTO novo_total;
  RETURN novo_total;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION incrementar_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION ajustar_likes(UUID, INTEGER) TO anon;
```

---

## Ordem recomendada de execução (rotina diária)

```bash
node scraper-memorias.js                # Memórias — Brasil (desativa todos da fonte)
node scraper-memorias-inter-gremio.js   # Memórias — Inter e Grêmio (complemento)
node scraper-brecho.js                  # Brechó do Futebol
node scraper-jaiminho.js                # Jaiminho Camisas
node scraper-meiuka.js                  # Meiuka
node scraper-atrox.js                   # Atrox Casual Club (Playwright)
node scraper-futclassics.js             # Fut Classics (Playwright)
node scraper-brechofc.js                # Brechó FC
# node scraper-mercadolivre.js          # Mercado Livre (experimental; API oficial bloqueada no teste)
# node scraper-apify-mercadolivre.js    # Mercado Livre via Apify (experimental; gera custo por resultado)
```

**Tempo estimado total:** ~45–60 minutos

**Atenção — Memórias do Esporte:** rodar sempre o `scraper-memorias.js` antes do `scraper-memorias-inter-gremio.js`. O primeiro desativa todos os produtos da fonte. O segundo complementa sem desativar novamente.

---

## Fontes ativas

### 1. Memórias do Esporte (WooCommerce)
**Site:** `memoriasdoesporteoficial.com.br`
**Arquivos:** `scraper-memorias.js`, `scraper-memorias-inter-gremio.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** ~1.253

**URLs rastreadas:**
| Arquivo | Categoria | Páginas |
|---|---|---|
| `scraper-memorias.js` | `/categoria-produto/futebol/brasil/` | 107 |
| `scraper-memorias-inter-gremio.js` | `/categoria-produto/futebol/internacional/` | 19 |
| `scraper-memorias-inter-gremio.js` | `/categoria-produto/futebol/gremio/` | 14 |

**Paginação:** `/{categoria}/page/N/`

**Seletores:**
```js
$('ul.products li.product').each((_, el) => {
  titulo  = $el.find('h2').text()
  link    = $el.find('a.woocommerce-loop-product__link').attr('href')
  imagem  = $el.find('img').attr('src') || $el.find('img').attr('data-src')
  preco   = $el.find('.price ins .amount, .price .amount').first().text()
})
```

**Problema conhecido:** Lazy loading — imagens chegam como `data:image/svg+xml`. Usar `data-src` como fallback. O `fix-imagens.js` corrigiu 830/831 imagens na primeira rodada.

---

### 2. Brechó do Futebol (Shopify)
**Site:** `brechodofutebol.com`
**Arquivo:** `scraper-brecho.js`
**Abordagem:** API JSON nativa do Shopify (sem scraping de HTML)
**Produtos:** ~1.846

**Endpoint:**
```
GET /collections/{slug}/products.json?limit=250&page=N
```

**Coleções rastreadas:**
- Clubes principais: flamengo, botafogo, fluminense, vasco-da-gama, corinthians, palmeiras, santos, sao-paulo, gremio, internacional, atletico-mineiro, cruzeiro, athletico-paranaense, fortaleza, bahia, vitoria
- Demais: demais-clubes-da-bahia, demais-clubes-do-rio-de-janeiro, demais-clubes-gauchos, demais-clubes-de-minas-gerais, demais-clubes-parana, demais-clubes-sao-paulo

**Conversão:**
```js
titulo  = produto.title
link    = `${FONTE_URL}/products/${produto.handle}`
imagem  = produto.images?.[0]?.src
preco   = parseFloat(produto.variants?.[0]?.price)
```

---

### 3. Jaiminho Camisas (Nuvemshop)
**Site:** `jaiminhocamisas.lojavirtualnuvem.com.br`
**Arquivo:** `scraper-jaiminho.js`
**Abordagem:** node-fetch + cheerio (HTML renderizado no servidor)
**Produtos:** ~500+

**Paginação:** `/{slug}/?page=N`

**Seletores (padrão Nuvemshop):**
```js
$('.js-product-container').each((_, el) => {
  const variants = JSON.parse($el.attr('data-variants'))
  preco  = variants[0].price_number
  imagem = `https:${variants[0].image_url.replace('-1024-1024', '-480-0')}`
  titulo = $el.find('a.item-link').attr('title')
  link   = $el.find('a.item-link').attr('href')
})
```

**Coleções:** internacional, gremio, flamengo, botafogo, fluminense, vasco, corinthians, palmeiras, santos, sao-paulo, atletico-mg, cruzeiro, atletico-pr, fortaleza, bahia, vitoria, + regionais (chapecoense, avai, criciuma, coritiba, america-mg, goias, atletico-go, nautico, santa-cruz, sport, ceara, selecoes, times-gauchos-interior, times-argentinos, times-aleatorios)

---

### 4. Meiuka (API Supabase pública)
**Site:** `meiukabr.com`
**Arquivo:** `scraper-meiuka.js`
**Abordagem:** API REST do Supabase deles (interceptada do Network)
**Produtos:** ~189

**Endpoint:**
```
GET https://uhpdwmkqmzbobiuscinm.supabase.co/rest/v1/shirts
  ?select=*
  &status=eq.a_venda
  &or=(club.ilike.%{query}%,...,tags.cs.{query})
  &limit=50&offset=N
```

**Chave anon pública** (sem segredo — visível no Network do Chrome):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocGR3bWtxbXpib2JpdXNjaW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTQ4MjgsImV4cCI6MjA3NTk3MDgyOH0._nu4px9HG79zwAdt3YhlVkrRDEBjyxint1IT7_IuvGQ
```

**Campos:** `front_image_url`, `back_image_url`, `min_price`, `club`, `season`, `name`, `model_type`, `tags`

**Nota:** Volume baixo — marketplace com anúncios que vendem e saem constantemente.

---

### 5. Atrox Casual Club (Nuvemshop + Playwright)
**Site:** `atroxcasualclub.com`
**Arquivo:** `scraper-atrox.js`
**Abordagem:** Playwright (scroll devagar para ativar lazy loading)
**Produtos:** ~305

**URL:** `/clubes/sulamericanos/brasileiros/?page=N`

**Comportamento:**
- Página 1 carrega ~60 produtos com scroll devagar
- Páginas 2+ carregam apenas 12 (limitação do site, não tem como contornar)
- Para automaticamente após 2 páginas vazias consecutivas

**Seletores:** padrão Nuvemshop — `data-variants` com JSON embutido (igual Jaiminho).

---

### 6. Fut Classics (Wix + Playwright)
**Site:** `futclassics.com.br`
**Arquivo:** `scraper-futclassics.js`
**Abordagem:** Playwright — clica em "ver mais" repetidamente
**Produtos:** ~792 (ignora esgotados)

**URL:** `https://www.futclassics.com.br/clubes-brasileiros` (página única com todos)

**Fluxo:**
1. Abre a página
2. Clica em `[data-hook="load-more-button"]` até sumir (~50 cliques)
3. Filtra esgotados: `[data-hook="product-item-out-of-stock"]`
4. Deduplica por link via `Set` antes de salvar
5. Salva em lotes de 100 para evitar conflito no upsert

**Seletores:**
```js
titulo  = $el.find('[data-hook="product-item-name"]').text()
link    = $el.find('[data-hook="product-item-container"]').attr('href')
preco   = $el.find('[data-hook="product-item-price-to-pay"]').attr('data-wix-price')
// Imagem via JSON no atributo data-image-info da wow-image
uri     = JSON.parse(wowImage.attr('data-image-info')).imageData.uri
imagem  = `https://static.wixstatic.com/media/${uri}/v1/fill/w_480,h_480,al_c,q_85,.../${uri}`
```

---

### 7. Brechó FC (Shopify)
**Site:** `brechofc.com`
**Arquivo:** `scraper-brechofc.js`
**Abordagem:** API JSON nativa do Shopify
**Produtos:** ~206

**Endpoint:**
```
GET /collections/todos-os-produtos/products.json?limit=250&page=N
```

**Filtros aplicados:**
- `variants[0].available === false` → ignora esgotados
- Tags contendo `internacionais`, `seleção`, `seleções`, `selecoes` → ignora

**Conversão:** igual ao Brechó do Futebol (padrão Shopify).

---

## Fontes experimentais / pausadas

Estas fontes ficam documentadas, mas não entram na rotina inicial enquanto o custo/qualidade não for validado.

### Mercado Livre (API oficial)
**Site:** `mercadolivre.com.br`
**Arquivo:** `scraper-mercadolivre.js`
**Abordagem:** API oficial do Mercado Livre

**Variáveis necessárias no `.env`:**
```bash
ML_ACCESS_TOKEN=...
```

Ou, para renovar automaticamente um token gerado via Authorization Code:

```bash
ML_CLIENT_ID=...
ML_CLIENT_SECRET=...
ML_REFRESH_TOKEN=...
```

Ou, se a aplicação tiver permissão para gerar token por credenciais:

```bash
ML_CLIENT_ID=...
ML_CLIENT_SECRET=...
```

**Clubes rastreados:** Flamengo, Corinthians, Palmeiras, São Paulo, Grêmio, Internacional, Santos, Atlético-MG, Botafogo, Fluminense, Vasco, Cruzeiro, Athletico-PR, Fortaleza, Bahia e Vitória.

**Filtro de condição:** somente camisas usadas. O scraper envia `condition=used` para a API e ainda descarta qualquer item retornado com outra condição.

**Execução completa:**
```bash
node scraper-mercadolivre.js
```

**Exploração segura, sem salvar no Supabase:**
```bash
node scraper-mercadolivre.js --clubes=Flamengo,Grêmio --max-paginas=1 --dry-run
```

**Execução parcial salvando no banco:**
```bash
node scraper-mercadolivre.js --clubes=Internacional,Grêmio,Palmeiras --max-paginas=3 --sem-desativar
```

**Flags:**
- `--clubes=` limita a execução a uma lista separada por vírgula.
- `--max-paginas=` controla quantas páginas buscar por clube; cada página tem até 50 itens.
- `--dry-run` mostra resultados no terminal e não salva nada.
- `--sem-desativar` evita marcar produtos antigos do Mercado Livre como inativos. Use em execuções parciais.

**Observação:** em Maio/2026, chamadas feitas deste ambiente para `api.mercadolibre.com` retornaram `403` com bloqueio de política na borda. O código está preparado para a API oficial, mas a aplicação/ambiente precisa ter permissão para consultar esse recurso.

---

### Mercado Livre via Apify
**Site:** `mercadolivre.com.br`
**Arquivo:** `scraper-apify-mercadolivre.js`
**Actor:** `karamelo/mercadolivre-scraper-brasil-portugues`
**Abordagem:** Apify Actor com cobrança por resultado

**Variável necessária no `.env`:**
```bash
APIFY_TOKEN=...
```

**Execução de teste, sem salvar no Supabase:**
```bash
node scraper-apify-mercadolivre.js
```

**Execução salvando no banco:**
```bash
node scraper-apify-mercadolivre.js --salvar
```

**Desativar falsos positivos já salvos pela Apify:**
```bash
node scraper-apify-mercadolivre.js --limpar-invalidos
```

**Clubes do recorte inicial:** Internacional, Grêmio, São Paulo, Corinthians, Santos, Palmeiras, Atlético-MG, Cruzeiro, Fluminense, Flamengo, Vasco e Botafogo. O padrão é buscar somente 1 página por clube para controlar custo.

**Observação:** o actor não mostra no formulário um filtro explícito para condição usada. O scraper busca por termos com "usada/usado", valida clube e tipo de produto, e por padrão confia que os resultados retornados por essa busca são usados. Para ativar uma validação local mais rígida por palavra "usado/usada", use `--filtrar-usados`.

## Checklist para novo scraper

- [ ] O site renderiza no servidor (HTML) ou no cliente (JavaScript)?
  - HTML → node-fetch + cheerio
  - JavaScript → Playwright
- [ ] Tem API JSON oficial? (Shopify → `.json`, Nuvemshop → `data-variants`, Supabase → REST)
- [ ] Qual o padrão de paginação? (`?page=N`, cursor, botão "ver mais")
- [ ] Quais seletores identificam título, preço, imagem e link?
- [ ] O site tem produtos esgotados? Como identificar no HTML ou API?
- [ ] Importar funções do `scraper-utils.js`
- [ ] Testar com 1–2 páginas antes de rodar completo
- [ ] Cadastrar a fonte na tabela `fontes` via painel admin ou SQL

---

## Fontes planejadas

| Site | Tipo | Abordagem | Status |
|---|---|---|---|
| mercadolivre.com.br | Marketplace | API oficial | ⚠️ Código pronto; validar permissão/API |
| olx.com.br | Classificados | Portal oficial cobre anúncios/leads; busca pública bloqueia requisições diretas | 📋 Complexo |
| mundodabolaloja.com.br | Própria | node-fetch + cheerio | 📋 Quando tiver mais categorias |
| enjoei.com.br | Marketplace | A verificar | 📋 Backlog |
