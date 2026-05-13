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
  tags text[] default '{}',
  de_jogo boolean default false,
  novidade boolean default true,
  alta_procura boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index para buscas
create index if not exists produtos_clube_idx on produtos(clube);
create index if not exists produtos_titulo_idx on produtos using gin(to_tsvector('portuguese', titulo));
create index if not exists produtos_created_at_idx on produtos(created_at desc);

-- Métricas usadas pelo CMS.
alter table produtos add column if not exists fonte_url text;
alter table produtos add column if not exists ativo boolean default true;
alter table produtos add column if not exists views integer default 0;
alter table produtos add column if not exists likes integer default 0;
alter table produtos add column if not exists cliques_anuncio integer default 0;
alter table produtos add column if not exists last_seen_at timestamptz;
alter table produtos add column if not exists inactivated_at timestamptz;
alter table produtos add column if not exists reactivated_at timestamptz;

create index if not exists idx_produtos_views on produtos(views desc);
create index if not exists idx_produtos_cliques_anuncio on produtos(cliques_anuncio desc);
create index if not exists idx_produtos_likes on produtos(likes desc);
create index if not exists idx_produtos_inactivated_at on produtos(inactivated_at desc) where inactivated_at is not null;
create index if not exists idx_produtos_last_seen_at on produtos(last_seen_at desc);
create index if not exists idx_produtos_fonte_inactivated_at on produtos(fonte_nome, inactivated_at desc) where inactivated_at is not null;
create index if not exists idx_produtos_clube_inactivated_at on produtos(clube, inactivated_at desc) where inactivated_at is not null;

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
