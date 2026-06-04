-- Ofertas afiliadas exibidas na home e gerenciadas no painel.
create table if not exists ofertas_afiliadas (
  id uuid default gen_random_uuid() primary key,
  loja text not null check (loja in ('Mercado Livre', 'Netshoes')),
  titulo text not null,
  preco numeric,
  preco_pix numeric,
  preco_com_cupom numeric,
  imagem_url text,
  link_afiliado text not null,
  link_produto text,
  cupom_codigo text,
  cupom_percentual numeric,
  cupom_percentual_variavel boolean not null default false,
  cupom_descricao text,
  cupom_aplicavel boolean not null default true,
  netshoes_tag_selecao boolean not null default false,
  clube text,
  automacao_origem text,
  external_id text,
  last_seen_at timestamptz,
  inactivated_at timestamptz,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ofertas_afiliadas add column if not exists preco_com_cupom numeric;
alter table ofertas_afiliadas add column if not exists preco_pix numeric;
alter table ofertas_afiliadas add column if not exists cupom_codigo text;
alter table ofertas_afiliadas add column if not exists cupom_percentual numeric;
alter table ofertas_afiliadas add column if not exists cupom_percentual_variavel boolean not null default false;
alter table ofertas_afiliadas add column if not exists cupom_descricao text;
alter table ofertas_afiliadas add column if not exists cupom_aplicavel boolean not null default true;
alter table ofertas_afiliadas add column if not exists netshoes_tag_selecao boolean not null default false;
alter table ofertas_afiliadas add column if not exists clube text;
alter table ofertas_afiliadas add column if not exists automacao_origem text;
alter table ofertas_afiliadas add column if not exists external_id text;
alter table ofertas_afiliadas add column if not exists last_seen_at timestamptz;
alter table ofertas_afiliadas add column if not exists inactivated_at timestamptz;

create index if not exists idx_ofertas_afiliadas_home
on ofertas_afiliadas(ativo, ordem, created_at desc);

create unique index if not exists idx_ofertas_afiliadas_external_id
on ofertas_afiliadas(external_id);

alter table ofertas_afiliadas enable row level security;
