-- Bezbednost pomoćnih funkcija
-- 1. Funkcije za proveru uloge prelaze u privatnu šemu koja nije dostupna preko API-ja.
-- 2. Neprijavljeni korisnici ne mogu da pozovu nijednu funkciju.
-- 3. Broj dokumenta može da traži samo kancelarija (admin, recepcija).

create schema if not exists privatno;
grant usage on schema privatno to authenticated;

alter function public.moja_uloga() set schema privatno;
alter function public.je_kancelarija() set schema privatno;

create or replace function privatno.je_kancelarija()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(privatno.moja_uloga() in ('admin', 'recepcija'), false)
$$;

revoke execute on function privatno.moja_uloga() from public, anon;
revoke execute on function privatno.je_kancelarija() from public, anon;
grant execute on function privatno.moja_uloga() to authenticated;
grant execute on function privatno.je_kancelarija() to authenticated;

create or replace function public.sledeci_broj(p_izdavalac text, p_vrsta text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  godina text := to_char(current_date, 'YYYY');
  n int;
begin
  if not privatno.je_kancelarija() then
    raise exception 'Nemate pravo na ovu radnju';
  end if;
  select count(*) + 1 into n
  from public.dokumenti
  where izdavalac_id = p_izdavalac and vrsta = p_vrsta and to_char(datum, 'YYYY') = godina;
  return lpad(n::text, 3, '0') || case when p_vrsta = 'predracun' then '-' else '/' end || godina;
end;
$$;

create or replace function public.zavrsi_ciscenje(p_nalog bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_soba text;
begin
  update public.nalozi_ciscenja
     set status = 'zavrseno', zavrseno_at = now()
   where id = p_nalog
     and (dodeljeno = auth.uid() or privatno.je_kancelarija())
  returning soba into v_soba;

  if not found then
    raise exception 'Nalog ne postoji ili nije vaš';
  end if;

  if v_soba is not null then
    update public.sobe set cisto = true where broj = v_soba;
    insert into public.istorija (soba, poruka) values (v_soba, 'Soba očišćena');
  end if;
end;
$$;

revoke execute on function public.sledeci_broj(text, text) from public, anon;
revoke execute on function public.zavrsi_ciscenje(bigint) from public, anon;
grant execute on function public.sledeci_broj(text, text) to authenticated;
grant execute on function public.zavrsi_ciscenje(bigint) to authenticated;
