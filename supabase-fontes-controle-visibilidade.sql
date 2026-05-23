-- Controle de lojas/fontes no CMS.
-- "ativa" controla rotina/rastreamento; "visivel_site" controla exibição pública.

alter table fontes add column if not exists visivel_site boolean not null default true;
alter table fontes add column if not exists updated_at timestamptz default now();
alter table fontes add column if not exists seletor_produto text;
alter table fontes add column if not exists seletor_titulo text;
alter table fontes add column if not exists seletor_preco text;
alter table fontes add column if not exists seletor_imagem text;
alter table fontes add column if not exists seletor_link text;
alter table fontes add column if not exists observacoes text;

create index if not exists idx_fontes_visivel_site on fontes(visivel_site);
create index if not exists idx_fontes_ativa_visivel_site on fontes(ativa, visivel_site);

insert into fontes (nome, url, ativa, visivel_site, total_produtos, ultimo_scraping, updated_at)
select
  p.fonte_nome as nome,
  coalesce(
    max(nullif(p.fonte_url, '')),
    'https://aguante.com.br/fontes/' || regexp_replace(lower(p.fonte_nome), '[^a-z0-9]+', '-', 'g')
  ) as url,
  true as ativa,
  true as visivel_site,
  count(*) filter (where p.ativo = true)::integer as total_produtos,
  max(coalesce(p.last_seen_at, p.updated_at, p.created_at)) as ultimo_scraping,
  now() as updated_at
from produtos p
where p.fonte_nome is not null
group by p.fonte_nome
on conflict (url) do update set
  nome = excluded.nome,
  total_produtos = excluded.total_produtos,
  ultimo_scraping = excluded.ultimo_scraping,
  updated_at = now();
