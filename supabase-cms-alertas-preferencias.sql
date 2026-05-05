-- Campos para exibir alertas e escolhas de clubes no CMS.
-- Rode este arquivo no SQL Editor do Supabase antes de usar as novas telas.

create table if not exists alertas (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  clube text,
  ano text,
  nome text,
  palavra_chave text,
  produto_id uuid,
  produto_titulo text,
  produto_link text,
  fonte_nome text,
  ativo boolean default true,
  created_at timestamptz default now()
);

alter table alertas add column if not exists nome text;
alter table alertas add column if not exists ano text;
alter table alertas add column if not exists produto_id uuid;
alter table alertas add column if not exists produto_titulo text;
alter table alertas add column if not exists produto_link text;
alter table alertas add column if not exists fonte_nome text;
alter table alertas add column if not exists ativo boolean default true;
alter table alertas add column if not exists created_at timestamptz default now();

create index if not exists alertas_created_at_idx on alertas(created_at desc);
create index if not exists alertas_clube_ano_idx on alertas(clube, ano);

create table if not exists clubes_preferencias (
  id uuid default gen_random_uuid() primary key,
  clube text,
  acao text not null default 'escolheu',
  origem text default 'modal_abertura',
  path text,
  created_at timestamptz default now()
);

create index if not exists clubes_preferencias_created_at_idx on clubes_preferencias(created_at desc);
create index if not exists clubes_preferencias_clube_idx on clubes_preferencias(clube);
create index if not exists clubes_preferencias_acao_idx on clubes_preferencias(acao);
