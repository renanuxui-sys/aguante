-- Tabela de fontes (sites rastreados)
create table fontes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  url text not null unique,
  ativa boolean default true,
  ultimo_scraping timestamptz,
  total_produtos integer default 0,
  created_at timestamptz default now()
);

-- Tabela de produtos (camisas encontradas)
create table produtos (
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
create index produtos_clube_idx on produtos(clube);
create index produtos_titulo_idx on produtos using gin(to_tsvector('portuguese', titulo));
create index produtos_created_at_idx on produtos(created_at desc);
