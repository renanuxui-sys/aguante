-- Reclassifica produtos existentes para clubes brasileiros adicionados depois.
-- Escopo: Paysandu, Guarani, Santa Cruz e Figueirense.

update produtos
set clube = 'Paysandu'
where titulo ilike '%paysandu%'
  and clube is distinct from 'Paysandu';

update produtos
set clube = 'Guarani'
where (
    titulo ilike '%guarani%'
    or titulo ilike '%guarani fc%'
    or titulo ilike '%guarani futebol clube%'
  )
  and titulo not ilike '%paraguai%'
  and titulo not ilike '%paraguay%'
  and titulo not ilike '%asuncion%'
  and titulo not ilike '%asuncao%'
  and clube is distinct from 'Guarani';

update produtos
set clube = 'Santa Cruz'
where titulo ilike '%santa cruz%'
  and clube is distinct from 'Santa Cruz';

update produtos
set clube = 'Figueirense'
where (
    titulo ilike '%figueirense%'
    or titulo ilike '%figueira%'
  )
  and clube is distinct from 'Figueirense';
