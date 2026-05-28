-- Corrige os avisos de segurança do Supabase para public.produtos.
-- Mantem leitura publica apenas para produtos ativos; escrita fica restrita ao servidor/service role.

alter table public.produtos enable row level security;

drop policy if exists "leitura publica de produtos" on public.produtos;
drop policy if exists "produtos_select_publico_ativos" on public.produtos;

create policy "produtos_select_publico_ativos"
on public.produtos
for select
to anon, authenticated
using (ativo = true);

grant select on table public.produtos to anon, authenticated;
revoke insert, update, delete on table public.produtos from anon, authenticated;
