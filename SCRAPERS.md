# Aguante — Guia de Scrapers

> Última atualização: Maio 2026

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
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` é usada apenas pelos scripts/rotina oficial para gravar dados administrativos, como histórico de preços, sem esbarrar nas regras de segurança do app público.

Para integrações pagas/experimentais:
```
APIFY_TOKEN=...
GECKO_API_KEY=...
```

Rodar qualquer scraper:
```bash
node nome-do-scraper.js
```

Exemplo com Arara de Jogo:
```bash
node scraper-araradejogo.js --dry-run
node scraper-araradejogo.js
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
- `identificarClube(titulo, clubesMap?)` — identifica clube pelo título
- `carregarClubesMap(supabase)` — carrega clubes do banco e mescla com mapa estático
- `carregarClubesBusca(supabase)` — versão para buscas com aliases
- `normalizarTexto(texto)` — remove acentos e normaliza
- `sleep(ms)` — pausa entre requisições

## Padrão de paginação automática

**Todos os scrapers param automaticamente** quando não encontram produtos por N páginas consecutivas — sem número fixo de páginas no código. Quando o site crescer, o scraper pega as novas páginas automaticamente na próxima execução.

```js
// Padrão para HTML/API com paginação por ?page=N
let page = 1
let erros = 0
while (true) {
  const produtos = await rasparPagina(page)
  if (produtos.length > 0) { /* salvar */ erros = 0 }
  else { erros++; if (erros >= 3) break }
  page++
  await sleep(DELAY_MS)
}

// Padrão para API com offset (Shopify, Meiuka)
while (true) {
  const items = await buscarPagina(offset)
  if (items.length === 0) break
  /* salvar */
  if (items.length < LIMITE) break
  offset += LIMITE
}
```

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
CREATE INDEX IF NOT EXISTS idx_produtos_cliques_anuncio ON produtos(cliques_anuncio DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_likes ON produtos(likes DESC);

CREATE OR REPLACE FUNCTION incrementar_views(produto_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE produtos SET views = COALESCE(views, 0) + 1 WHERE id = produto_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION incrementar_cliques(produto_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE produtos SET cliques_anuncio = COALESCE(cliques_anuncio, 0) + 1 WHERE id = produto_id;
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
GRANT EXECUTE ON FUNCTION incrementar_cliques(UUID) TO anon;
GRANT EXECUTE ON FUNCTION ajustar_likes(UUID, INTEGER) TO anon;
```

---

## Ordem recomendada de execução (rotina diária)

No GitHub Actions, a rotina roda em paralelo por grupos independentes para reduzir o tempo total e evitar que uma loja trave as próximas:

- **Memórias do Esporte**: `scraper-memorias.js` e depois `scraper-memorias-inter-gremio.js` no mesmo job, porque o segundo complementa o primeiro.
- **Lojas HTTP/API**: Brechó do Futebol, Jaiminho, Brechó FC, Manto Sagrado, Mundo da Bola, Copero Brechó, Di Gordo, Xiru FC e Rill Sports em matriz paralela.
- **Lojas Playwright**: Atrox e Fut Classics em matriz paralela, com Chromium instalado apenas nesses jobs.

Para rodar localmente, a ordem abaixo continua válida:

```bash
node scraper-memorias.js                # Memórias — Brasil (desativa todos da fonte)
node scraper-memorias-inter-gremio.js   # Memórias — Inter e Grêmio (complemento)
node scraper-brecho.js                  # Brechó do Futebol
node scraper-jaiminho.js                # Jaiminho Camisas
# node scraper-meiuka.js                # Meiuka (desativado da rotina automática)
node scraper-atrox.js                   # Atrox Casual Club (Playwright)
node scraper-futclassics.js             # Fut Classics (Playwright)
node scraper-brechofc.js                # Brechó FC
node scraper-mantosagrado.js            # Manto Sagrado Camisas
node scraper-mundodabola.js             # Mundo da Bola
node scraper-copero.js                  # Copero Brechó
node scraper-digordo.js                 # Di Gordo
node scraper-xirufc.js                  # Xiru FC
node scraper-rillsports.js              # Rill Sports
# node scraper-mercadolivre.js          # Mercado Livre (experimental; API bloqueada)
# node scraper-apify-mercadolivre.js    # Mercado Livre via Apify (experimental; gera custo)
# node scraper-gecko-olx.js             # OLX via GeckoAPI (experimental; gera custo)
```

**Tempo estimado total:** ~60–90 minutos em execução local sequencial. No GitHub Actions, a matriz paralela tende a reduzir o tempo de parede para o maior job individual.

**Atenção — Memórias do Esporte:** rodar sempre o `scraper-memorias.js` antes do `scraper-memorias-inter-gremio.js`. O primeiro desativa todos os produtos da fonte. O segundo complementa sem desativar novamente.

---

## Fontes ativas

### 1. Memórias do Esporte (WooCommerce)
**Site:** `memoriasdoesporteoficial.com.br`
**Arquivos:** `scraper-memorias.js`, `scraper-memorias-inter-gremio.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** ~1.253
**Paginação automática:** ✅ para após 5 páginas vazias

**URLs rastreadas:**
| Arquivo | Categoria |
|---|---|
| `scraper-memorias.js` | `/categoria-produto/futebol/brasil/` |
| `scraper-memorias.js` | `/categoria-produto/futebol/selecoes/` |
| `scraper-memorias.js` | `/categoria-produto/futebol/europa/` |
| `scraper-memorias.js` | `/categoria-produto/futebol/americas/` |
| `scraper-memorias-inter-gremio.js` | `/categoria-produto/futebol/internacional/` |
| `scraper-memorias-inter-gremio.js` | `/categoria-produto/futebol/gremio/` |

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

**Problema conhecido:** Lazy loading — imagens chegam como `data:image/svg+xml`. Usar `data-src` como fallback.

---

### 2. Brechó do Futebol (Shopify)
**Site:** `brechodofutebol.com`
**Arquivo:** `scraper-brecho.js`
**Abordagem:** API JSON nativa do Shopify
**Produtos:** ~1.846
**Paginação automática:** ✅ para quando retornar menos que 250 itens

**Endpoint:** `/collections/{slug}/products.json?limit=250&page=N`

**Coleções:** flamengo, botafogo, fluminense, vasco-da-gama, corinthians, palmeiras, santos, sao-paulo, gremio, internacional, atletico-mineiro, cruzeiro, athletico-paranaense, fortaleza, bahia, vitoria, demais-clubes-*, selecoes-nacionais, clubes-europeus, clubes-latino-americanos

---

### 3. Jaiminho Camisas (Nuvemshop)
**Site:** `jaiminhocamisas.lojavirtualnuvem.com.br`
**Arquivo:** `scraper-jaiminho.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** ~500+
**Paginação automática:** ✅ para após 2 páginas vazias

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

**Coleções:** 16 clubes principais + regionais (chapecoense, avai, criciuma, coritiba, america-mg, goias, atletico-go, nautico, santa-cruz, sport, ceara, selecoes, times-gauchos-interior, times-argentinos, times-aleatorios)

---

### 4. Meiuka (API Supabase pública)
**Site:** `meiukabr.com`
**Arquivo:** `scraper-meiuka.js`
**Status:** desativado da rotina automática; manter apenas para execução manual se necessário.
**Abordagem:** API REST do Supabase deles (interceptada do Network)
**Produtos:** ~189
**Paginação automática:** ✅ via offset, para quando retornar menos que 50 itens

**Endpoint:**
```
GET https://uhpdwmkqmzbobiuscinm.supabase.co/rest/v1/shirts
  ?select=*&status=eq.a_venda
  &or=(club.ilike.%{query}%,...,tags.cs.{query})
  &limit=50&offset=N
```

**Chave anon pública** (visível no Network do Chrome):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nota:** Volume baixo — marketplace com anúncios que vendem e saem constantemente. O endpoint pode ter mudado de `/shirts` para `/camisetas` — verificar na próxima execução.

---

### 5. Atrox Casual Club (Nuvemshop + Playwright)
**Site:** `atroxcasualclub.com`
**Arquivo:** `scraper-atrox.js`
**Abordagem:** Playwright (scroll devagar para ativar lazy loading)
**Produtos:** ~305
**Paginação automática:** ✅ para após 2 páginas vazias

**URLs:** `/clubes/sulamericanos/brasileiros/?page=N`, `/clubes/europeus/?page=N`, `/clubes/sulamericanos/?page=N`, `/selecoes1/?page=N`

**Comportamento:**
- Página 1 carrega ~60 produtos com scroll devagar
- Páginas 2+ carregam apenas 12 (limitação do site, não tem como contornar)

**Seletores:** padrão Nuvemshop — `data-variants` com JSON embutido.

---

### 6. Fut Classics (Wix + Playwright)
**Site:** `futclassics.com.br`
**Arquivo:** `scraper-futclassics.js`
**Abordagem:** Playwright — clica em "ver mais" até sumir
**Produtos:** ~792
**Paginação automática:** ✅ clica até não ter mais botão

**URLs:** clubes brasileiros, argentinos, outros clubes da América, clubes alemães, espanhóis, franceses, ingleses, italianos, escoceses, outros clubes da Europa e seleções.

**Fluxo:**
1. Abre a página
2. Clica em `[data-hook="load-more-button"]` até sumir (~50 cliques)
3. Filtra esgotados: `[data-hook="product-item-out-of-stock"]`
4. Deduplica por link via `Set`
5. Salva em lotes de 100

**Proteções contra travamento:**
- Timeout de 8 minutos por página da Fut Classics
- Limite de 80 cliques no botão "ver mais"
- Interrompe após 3 cliques seguidos sem novos produtos
- Bloqueia imagens, mídia e fontes no Playwright para carregar menos recursos

**Seletores:**
```js
titulo  = $el.find('[data-hook="product-item-name"]').text()
link    = $el.find('[data-hook="product-item-container"]').attr('href')
preco   = $el.find('[data-hook="product-item-price-to-pay"]').attr('data-wix-price')
uri     = JSON.parse(wowImage.attr('data-image-info')).imageData.uri
imagem  = `https://static.wixstatic.com/media/${uri}/v1/fill/w_480,h_480,.../${uri}`
```

---

### 7. Brechó FC (Shopify)
**Site:** `brechofc.com`
**Arquivo:** `scraper-brechofc.js`
**Abordagem:** API JSON nativa do Shopify
**Produtos:** ~206
**Paginação automática:** ✅ para quando retornar menos que 250 itens

**Endpoints:** `/collections/todos-os-produtos/products.json?limit=250&page=N`, `/collections/times-internacionais/products.json?limit=250&page=N`

**Filtros:**
- `variants[0].available === false` → ignora esgotados
- Produtos internacionais/seleções são salvos quando o time/seleção é identificado pelo mapa compartilhado

---

### 8. Manto Sagrado Camisas (Loja Integrada)
**Site:** `mantosagradocamisas.com`
**Arquivo:** `scraper-mantosagrado.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** ~265
**Paginação automática:** ✅ para após 3 páginas vazias por coleção

**Paginação:** `/{slug}?page=N`

**Coleções:** gremio (clube fixo: Grêmio), inter (clube fixo: Internacional), nacionais/seleções, europa e estrangeiras (identificação automática; estrangeiras salva só identificados)

**Seletores:**
```js
$('div.listagem-item').each((_, el) => {
  // Ignora indisponíveis
  if ($el.hasClass('indisponivel')) return
  titulo    = $el.find('a.nome-produto').text()
  link      = $el.find('a.produto-sobrepor').attr('href')
  imagem    = $el.find('img.imagem-principal').attr('src')
  preco     = $el.find('strong.preco-promocional').attr('data-sell-price')
})
```

**Produto indisponível:** classe `indisponivel` no container + `span.bandeira-indisponivel` visível.

---

### 9. Mundo da Bola (plataforma própria)
**Site:** `mundodabolaloja.com.br`
**Arquivo:** `scraper-mundodabola.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** ~243
**Paginação automática:** ✅ para após 3 páginas sem clube identificado

**URLs:** `/futebol-nacional?pg=N`, `/futebol-europeu?pg=N`, `/clubes-latinos-americanos?pg=N`, `/camisas-de-futebol/selecoes?pg=N` (atenção: usa `pg=` não `page=`)

**Seletores:**
```js
$('div.product').each((_, el) => {
  titulo = $el.attr('data-ga4-name')
  preco  = $el.attr('data-ga4-price')
  link   = $el.find('a.space-image').attr('href')
  imagem = $el.find('img.lazyload').attr('src')
})
```

**Filtro:** só salva produtos cujo clube/seleção foi identificado no mapa compartilhado.

---

### 10. Copero Brechó (Nuvemshop HTML)
**Site:** `coperobrecho.net`
**Arquivo:** `scraper-copero.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** ~226 na coleção Grêmio
**Paginação automática:** ✅ para após 2 páginas vazias

**URLs:** `/gremio/`, `/selecao-brasileira/`, `/camisas-de-outras-selecoes/`, `/clubes-europeus/`, `/clubes-da-america-latina/` e respectivas páginas `/page/N/`

**Comandos:**
```bash
node scraper-copero.js --dry-run        # testa sem salvar no banco
node scraper-copero.js                  # desativa antigos da fonte e salva ativos
node scraper-copero.js --sem-desativar  # salva sem desativar antigos
```

**Seletores:**
```js
$('.js-item-product').each((_, el) => {
  titulo = JSON-LD name || $el.find('.js-item-name').text()
  link   = JSON-LD offers.url || $el.find('a[href*="/produtos/"]').attr('href')
  preco  = $el.find('.js-price-display').first().text()
  imagem = JSON-LD image || data-srcset/src da imagem principal
})
```

**Observação:** a loja usa imagens lazy-load; quando o `src` vem como `data:image`, o scraper usa o JSON-LD ou o maior item do `data-srcset`.

---

### 11. Xiru FC (Nuvemshop)
**Site:** `xirufc.com.br`
**Arquivo:** `scraper-xirufc.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** a verificar
**Paginação automática:** ✅ para após 2 páginas vazias

**URLs rastreadas:**
| URL | Clube |
|---|---|
| `/s-c-internacional/` | Internacional (fixo) |
| `/selecoes/` | Identificação automática |
| `/clubes-da-europa/` | Identificação automática; salva só identificados |

**Paginação:** `/{slug}/?page=N`

**Seletores (padrão Nuvemshop):**
```js
$('.js-product-container').each((_, el) => {
  const variants = JSON.parse($el.attr('data-variants'))
  // Pula esgotados: available === false || stock === 0
  preco  = variants[0].price_number
  imagem = `https:${variants[0].image_url.replace('-1024-1024', '-480-0')}`
  titulo = container.find('a.item-link').attr('title')
  link   = container.find('a.item-link').attr('href')
})
```

**Nota:** a coleção de nacionais cobre somente Internacional por enquanto. Adicionar novos slugs em `COLECOES` quando a loja expandir.

---

### 12. Di Gordo (Nuvemshop)
**Site:** `digordo.lojavirtualnuvem.com.br`
**Arquivo:** `scraper-digordo.js`
**Abordagem:** node-fetch + cheerio, usando JSON-LD de produto
**Produtos:** a verificar
**Paginação automática:** ✅ para após 2 páginas vazias por coleção

**URLs rastreadas:** `/times-nacionais/`, `/times-sul-americanos/`, `/times-europeus/`, `/selecoes/`

**Comandos:**
```bash
node scraper-digordo.js --dry-run        # testa sem salvar no banco
node scraper-digordo.js                  # desativa antigos da fonte e salva ativos
node scraper-digordo.js --sem-desativar  # salva sem desativar antigos
```

**Seletores/dados:** a página expõe cada produto em `script[type="application/ld+json"]` com `@type: Product`. O scraper usa `name`, `image`, `offers.url`, `offers.price` e salva apenas `offers.availability` com `InStock`.

---

### 13. Rill Sports (Tray Commerce)
**Site:** `rillsports.com.br`
**Arquivo:** `scraper-rillsports.js`
**Abordagem:** node-fetch + cheerio
**Produtos:** a verificar
**Paginação automática:** ✅ para quando página retornar vazia; para após 3 páginas sem clube identificado na categoria de nacionais

**URLs rastreadas:**
| URL | Conteúdo | Filtro |
|---|---|---|
| `/futebol-nacional` | Clubes nacionais | Identificação automática pelo título |
| URL filtrada por Argentina/Clubes Sul-Americanos/Colômbia/Uruguai | Clubes sul-americanos | Identificação automática pelo título; salva só identificados |
| `/futebol/camisas-de-futebol` | Seleções + clubes estrangeiros misturados | Filtra pelo slug da URL |

**Paginação:** `?pg=N` (Tray Commerce — igual ao Mundo da Bola)

**Seletores:**
```js
$('div.product').each((_, el) => {
  titulo = $el.find('.product-name').text().trim()
  link   = $el.find('a.space-image').attr('href') || $el.find('a.product-info').attr('href')
  imagem = $el.find('img.lazyload').attr('data-src') || $el.find('img.lazyload').attr('src')
  preco  = parseFloat($el.find('.current-price').text().replace(/[R$\s.]/g, '').replace(',', '.'))
})
```

**Filtro de seleções (categoria mista):** o scraper extrai o segmento da URL de cada produto e só salva os que batem com slugs de seleções conhecidas (`brasil`, `argentina`, `alemanha`, etc.), descartando automaticamente clubes estrangeiros (`barcelona`, `clubes-sul-americanos`, etc.). No log aparece `🚫 X estrangeiros descartados` por página.

**Para adicionar nova seleção:** incluir o slug no `Set SELECOES_SLUGS` e o mapeamento em `SLUG_PARA_SELECAO` no arquivo do scraper.

---

## Fontes experimentais / pausadas

### Mercado Livre (API oficial)
**Arquivo:** `scraper-mercadolivre.js`
**Status:** ⚠️ Código pronto; chamadas retornam 403 — validar permissão da aplicação

**Variáveis necessárias:**
```
ML_CLIENT_ID=...
ML_CLIENT_SECRET=...
ML_ACCESS_TOKEN=...
ML_REFRESH_TOKEN=...
```

**Filtro:** somente camisas `condition=used`.

**Flags:**
- `--clubes=` limita a execução
- `--max-paginas=` controla páginas por clube
- `--dry-run` mostra resultados sem salvar
- `--sem-desativar` evita marcar produtos antigos como inativos

---

### Mercado Livre via Apify
**Arquivo:** `scraper-apify-mercadolivre.js`
**Status:** 📋 Experimental — gera custo por resultado

**Variável necessária:** `APIFY_TOKEN=...`

---

### OLX via GeckoAPI
**Arquivo:** `scraper-gecko-olx.js`
**Status:** 📋 Experimental — usa `POST /v1/extract` da GeckoAPI

**Variável necessária:** `GECKO_API_KEY=...`

**Comandos:**
```bash
npm run scraper:gecko:olx -- --query="camisa flamengo usada"
npm run scraper:gecko:olx -- --query="camisa flamengo usada" --state=RJ
npm run scraper:gecko:olx -- --url="https://www.olx.com.br/estado-rj?q=camisa%20flamengo%20usada&o=1" --state=RJ
npm run scraper:gecko:olx -- --clubes=flamengo,gremio --max-paginas=1
npm run scraper:gecko:olx -- --clubes=flamengo --max-paginas=2 --salvar
```

**Flags:**
- `--query=` busca manual, sem depender dos clubes do banco
- `--url=` usa uma URL pronta da OLX como entrada
- `--clubes=` limita clubes quando usa as buscas cadastradas
- `--max-paginas=` controla custo; o scraper limita no máximo a `3`
- `--salvar` grava no Supabase; sem isso roda em modo teste
- `--sem-desativar` salva sem marcar OLX antigos como inativos
- `--state=` define a UF da busca; a GeckoAPI exige uma UF para OLX
- quando roda por `--clubes=`, o scraper usa o mapa de UFs por clube se `--state` não for informado
- `--todos-estados` varre todas as UFs do Brasil, multiplicando o custo por 27
- `--city=` refina por cidade quando suportado pela GeckoAPI
- `--price-min=` e `--price-max=` entram na URL da OLX como `ps` e `pe`; o mínimo padrão é `250`
- `--filtro-preco-api` tenta enviar também `priceMin`/`priceMax` como campos do payload
- `--sem-filtro-camisa` desliga o filtro local de títulos com "camisa"
- `--debug` imprime uma amostra do primeiro item retornado pela GeckoAPI

**Mapa de UFs padrão:**
- Flamengo, Fluminense, Vasco, Botafogo: RJ e SP
- São Paulo, Palmeiras, Santos, Corinthians: RJ e SP
- Cruzeiro, Atlético-MG: RJ e MG
- Grêmio, Internacional: RS

---

## Checklist para novo scraper

- [ ] O site renderiza no servidor (HTML) ou no cliente (JavaScript)?
  - HTML → node-fetch + cheerio
  - JavaScript → Playwright
- [ ] Tem API JSON oficial? (Shopify → `.json`, Nuvemshop → `data-variants`, Supabase → REST)
- [ ] Qual o padrão de paginação? (`?page=N`, `?pg=N`, offset, botão "ver mais")
- [ ] Quais seletores identificam título, preço, imagem e link?
- [ ] O site tem produtos esgotados/indisponíveis? Como identificar?
- [ ] Usar paginação automática (while + contador de erros) — sem número fixo de páginas
- [ ] Importar funções do `scraper-utils.js`
- [ ] Testar com 1–2 páginas antes de rodar completo

---

## Fontes planejadas

| Site | Tipo | Abordagem | Status |
|---|---|---|---|
| mercadolivre.com.br | Marketplace | API oficial | ⚠️ Código pronto; validar permissão |
| olx.com.br | Classificados | Playwright + anti-bot | 📋 Complexo |
| futclassics.com.br | Wix | Playwright | ✅ Ativo |
| enjoei.com.br | Marketplace | A verificar | 📋 Backlog |
