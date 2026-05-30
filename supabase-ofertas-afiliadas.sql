-- Ofertas afiliadas exibidas na home e gerenciadas no painel.
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
