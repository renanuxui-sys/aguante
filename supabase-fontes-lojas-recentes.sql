-- Cadastra páginas públicas das lojas recentes já aprovadas.
-- Rode no Supabase SQL Editor para liberar /lojas/mania-de-camisa
-- e /lojas/old-collection-10 antes mesmo do próximo scraping.

with lojas(nome, url) as (
  values
    ('Mania de Camisa', 'https://www.maniadecamisafut.com.br'),
    ('Old Collection 10', 'https://oldcollection10.lojavirtualnuvem.com.br')
),
atualizadas as (
  update fontes f
  set
    url = l.url,
    ativa = true,
    visivel_site = true,
    updated_at = now()
  from lojas l
  where f.nome = l.nome
  returning f.nome
)
insert into fontes (nome, url, ativa, visivel_site, total_produtos, updated_at)
select l.nome, l.url, true, true, 0, now()
from lojas l
where not exists (
  select 1
  from atualizadas a
  where a.nome = l.nome
)
on conflict (url) do update set
  nome = excluded.nome,
  ativa = true,
  visivel_site = true,
  updated_at = now();
