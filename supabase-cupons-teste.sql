-- Sistema de cupons para ambiente de testes/preview.
-- Rode somente no banco de teste enquanto a funcionalidade estiver em validação.

create table if not exists public.store_coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.fontes(id) on delete set null,
  store_name text not null,
  code text not null,
  discount_label text not null,
  description text,
  rules text,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_coupons_active_store_idx
  on public.store_coupons (is_active, store_name, valid_until);

create index if not exists store_coupons_store_id_idx
  on public.store_coupons (store_id);

create table if not exists public.coupon_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('coupon_reveal', 'coupon_copy')),
  coupon_id uuid references public.store_coupons(id) on delete set null,
  coupon_code text,
  product_id uuid references public.produtos(id) on delete set null,
  store_id uuid references public.fontes(id) on delete set null,
  store_name text,
  user_id uuid,
  session_id text,
  source text,
  campaign text,
  club text,
  page_path text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists coupon_events_created_at_idx
  on public.coupon_events (created_at desc);

create index if not exists coupon_events_coupon_id_idx
  on public.coupon_events (coupon_id);

create index if not exists coupon_events_product_id_idx
  on public.coupon_events (product_id);

alter table public.cliques_saida
  add column if not exists coupon_id uuid references public.store_coupons(id) on delete set null,
  add column if not exists coupon_code text;

-- Alinha produtos antigos à loja cadastrada quando ainda só possuem nome/url.
update public.produtos p
set fonte_id = f.id
from public.fontes f
where p.fonte_id is null
  and (
    p.fonte_url = f.url
    or lower(trim(p.fonte_nome)) = lower(trim(f.nome))
  );

alter table public.store_coupons enable row level security;
alter table public.coupon_events enable row level security;

revoke all on table public.store_coupons from anon, authenticated;
revoke all on table public.coupon_events from anon, authenticated;
