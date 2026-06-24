-- Newsletter de alertas de queda de preço da Netshoes.
-- Rode no SQL Editor do Supabase antes de abrir o cadastro ao público.

create table if not exists newsletter_netshoes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  clubes_interesse text[] not null default '{}',
  todos_clubes boolean not null default true,
  ativo boolean not null default true,
  origem text,
  unsubscribe_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table newsletter_netshoes add column if not exists clubes_interesse text[] not null default '{}';
alter table newsletter_netshoes add column if not exists todos_clubes boolean not null default true;
alter table newsletter_netshoes add column if not exists ativo boolean not null default true;
alter table newsletter_netshoes add column if not exists origem text;
alter table newsletter_netshoes add column if not exists unsubscribe_token text;
alter table newsletter_netshoes add column if not exists updated_at timestamptz not null default now();

update newsletter_netshoes
set unsubscribe_token = encode(gen_random_bytes(24), 'hex')
where unsubscribe_token is null;

alter table newsletter_netshoes alter column unsubscribe_token set not null;

create unique index if not exists newsletter_netshoes_email_unique
on newsletter_netshoes (lower(email));

create unique index if not exists newsletter_netshoes_unsubscribe_token_unique
on newsletter_netshoes (unsubscribe_token);

create index if not exists newsletter_netshoes_ativo_idx
on newsletter_netshoes (ativo, updated_at desc);

alter table newsletter_netshoes enable row level security;
