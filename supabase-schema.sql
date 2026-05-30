-- Tabela de fontes (sites rastreados)
create table if not exists fontes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  url text not null unique,
  ativa boolean default true,
  ultimo_scraping timestamptz,
  total_produtos integer default 0,
  created_at timestamptz default now()
);

-- Tabela de produtos (camisas encontradas)
create table if not exists produtos (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  ano text,
  preco numeric,
  imagem_url text,
  link_original text not null,
  fonte_id uuid references fontes(id),
  fonte_nome text,
  fonte_url text,
  clube text,
  tipo_camisa text,
  tags text[] default '{}',
  de_jogo boolean default false,
  novidade boolean default true,
  alta_procura boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table produtos enable row level security;

drop policy if exists "leitura publica de produtos" on produtos;
drop policy if exists "produtos_select_publico_ativos" on produtos;

create policy "produtos_select_publico_ativos"
on produtos
for select
to anon, authenticated
using (ativo = true);

grant select on produtos to anon, authenticated;
revoke insert, update, delete on produtos from anon, authenticated;

-- Links afiliados de ofertas de camisas novas.
create table if not exists ofertas_afiliadas (
  id uuid default gen_random_uuid() primary key,
  loja text not null check (loja in ('Mercado Livre', 'Netshoes')),
  titulo text not null,
  preco numeric,
  preco_com_cupom numeric,
  imagem_url text,
  link_afiliado text not null,
  link_produto text,
  cupom_codigo text,
  cupom_percentual numeric,
  cupom_descricao text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ofertas_afiliadas add column if not exists preco_com_cupom numeric;
alter table ofertas_afiliadas add column if not exists cupom_codigo text;
alter table ofertas_afiliadas add column if not exists cupom_percentual numeric;
alter table ofertas_afiliadas add column if not exists cupom_descricao text;

create index if not exists idx_ofertas_afiliadas_home
on ofertas_afiliadas(ativo, ordem, created_at desc);

alter table ofertas_afiliadas enable row level security;

-- Index para buscas
create index if not exists produtos_clube_idx on produtos(clube);
create index if not exists produtos_titulo_idx on produtos using gin(to_tsvector('portuguese', titulo));
create index if not exists produtos_created_at_idx on produtos(created_at desc);

-- Métricas usadas pelo CMS.
alter table produtos add column if not exists fonte_url text;
alter table produtos add column if not exists tipo_camisa text;
alter table produtos add column if not exists ativo boolean default true;
alter table produtos add column if not exists views integer default 0;
alter table produtos add column if not exists likes integer default 0;
alter table produtos add column if not exists cliques_anuncio integer default 0;
alter table produtos add column if not exists last_seen_at timestamptz;
alter table produtos add column if not exists inactivated_at timestamptz;
alter table produtos add column if not exists reactivated_at timestamptz;
alter table fontes add column if not exists visivel_site boolean not null default true;
alter table fontes add column if not exists updated_at timestamptz default now();
alter table fontes add column if not exists seletor_produto text;
alter table fontes add column if not exists seletor_titulo text;
alter table fontes add column if not exists seletor_preco text;
alter table fontes add column if not exists seletor_imagem text;
alter table fontes add column if not exists seletor_link text;
alter table fontes add column if not exists observacoes text;

create index if not exists idx_produtos_views on produtos(views desc);
create index if not exists idx_produtos_cliques_anuncio on produtos(cliques_anuncio desc);
create index if not exists idx_produtos_likes on produtos(likes desc);
create index if not exists idx_produtos_inactivated_at on produtos(inactivated_at desc) where inactivated_at is not null;
create index if not exists idx_produtos_last_seen_at on produtos(last_seen_at desc);
create index if not exists idx_produtos_fonte_inactivated_at on produtos(fonte_nome, inactivated_at desc) where inactivated_at is not null;
create index if not exists idx_produtos_clube_inactivated_at on produtos(clube, inactivated_at desc) where inactivated_at is not null;
create index if not exists idx_produtos_tipo_camisa on produtos(tipo_camisa);
create index if not exists idx_fontes_visivel_site on fontes(visivel_site);
create index if not exists idx_fontes_ativa_visivel_site on fontes(ativa, visivel_site);

-- Evita que camisas "pre-jogo" entrem no filtro "de jogo".
update produtos
set de_jogo = false, tipo_camisa = coalesce(tipo_camisa, 'pre_jogo')
where de_jogo = true
  and (
    titulo ilike '%pré-jogo%' or
    titulo ilike '%pre-jogo%' or
    titulo ilike '%pré jogo%' or
    titulo ilike '%pre jogo%' or
    titulo ilike '%pre match%' or
    titulo ilike '%pre-match%'
  );

-- Histórico de preços por produto, clube e temporada.
create table if not exists produto_precos_historico (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references produtos(id) on delete cascade,
  link_original text not null,
  titulo text,
  fonte_nome text,
  clube text,
  ano text,
  tipo_camisa text,
  preco numeric not null,
  registrado_em timestamptz default now()
);

create index if not exists idx_produto_precos_historico_registrado_em on produto_precos_historico(registrado_em desc);
create index if not exists idx_produto_precos_historico_clube_ano on produto_precos_historico(clube, ano, registrado_em desc);
create index if not exists idx_produto_precos_historico_produto_id on produto_precos_historico(produto_id, registrado_em desc);

-- Índices para as consultas públicas mais frequentes.
create index if not exists idx_produtos_ativo_created_at on produtos(ativo, created_at desc);
create index if not exists idx_produtos_ativo_views_created_at on produtos(ativo, views desc, created_at desc);
create index if not exists idx_produtos_ativo_clube_views_created_at on produtos(ativo, clube, views desc, created_at desc);
create index if not exists idx_produtos_ativo_ano on produtos(ativo, ano);

-- A busca usa ilike com termos parciais; trigram evita varredura completa em tabelas maiores.
create extension if not exists pg_trgm;
create index if not exists idx_produtos_titulo_trgm on produtos using gin (titulo gin_trgm_ops);
create index if not exists idx_produtos_clube_trgm on produtos using gin (clube gin_trgm_ops);
create index if not exists idx_produtos_ano_trgm on produtos using gin (ano gin_trgm_ops);

-- View usada pela navegação para evitar uma consulta de contagem por clube.
create or replace view clubes_com_total_anuncios
with (security_invoker = true)
as
select
  c.id,
  c.nome,
  c.slug,
  c.categoria,
  c.escudo_url,
  c.ativo,
  c.ordem,
  count(p.id)::integer as total_anuncios
from clubes c
left join produtos p
  on p.clube = c.nome
  and p.ativo = true
group by c.id, c.nome, c.slug, c.categoria, c.escudo_url, c.ativo, c.ordem;
