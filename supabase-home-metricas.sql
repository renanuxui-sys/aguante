-- Cache leve para métricas exibidas na home.
-- A rotina diária de scraping atualiza esta linha ao final do processo.

create table if not exists home_metricas (
  id text primary key default 'principal',
  total_produtos integer not null default 0,
  novos_24h integer not null default 0,
  atualizado_em timestamptz not null default now()
);

alter table home_metricas enable row level security;

drop policy if exists "home_metricas_select_publico" on home_metricas;

create policy "home_metricas_select_publico"
on home_metricas
for select
to anon, authenticated
using (id = 'principal');

insert into home_metricas (id, total_produtos, novos_24h, atualizado_em)
select
  'principal',
  count(*) filter (where ativo = true)::integer,
  count(*) filter (where ativo = true and created_at >= now() - interval '24 hours')::integer,
  now()
from produtos
on conflict (id) do update
set
  total_produtos = excluded.total_produtos,
  novos_24h = excluded.novos_24h,
  atualizado_em = excluded.atualizado_em;
