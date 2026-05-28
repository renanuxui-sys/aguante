-- Eventos detalhados de clique de saída para lojas.
-- A tabela mantém o histórico linha a linha. O contador legado
-- produtos.cliques_anuncio continua sendo atualizado pela rota /out/[id].

create table if not exists public.cliques_saida (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references public.produtos(id) on delete set null,
  produto_titulo text,
  loja_nome text,
  loja_url text,
  clicked_at timestamptz not null default now(),
  origem_usuario text,
  pagina_origem text,
  clube text,
  categoria text,
  campanha text,
  usuario_status text not null default 'anonimo'
    check (usuario_status in ('anonimo', 'logado')),
  usuario_id uuid,
  cupom_revelado boolean not null default false,
  destino_original text not null,
  destino_com_utm text not null,
  user_agent text,
  referer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz not null default now()
);

create index if not exists cliques_saida_clicked_at_idx
  on public.cliques_saida (clicked_at desc);

create index if not exists cliques_saida_produto_id_idx
  on public.cliques_saida (produto_id);

create index if not exists cliques_saida_loja_nome_idx
  on public.cliques_saida (loja_nome);

create index if not exists cliques_saida_campanha_idx
  on public.cliques_saida (campanha);

alter table public.cliques_saida enable row level security;

revoke all on table public.cliques_saida from anon, authenticated;
