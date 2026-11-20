-- Prijava imenom i PIN-om
-- Admin pravi pozivnicu (ime + uloga) i dobija jednokratni aktivacioni kod.
-- Osoba na svom telefonu unese kod i sama izabere PIN; PIN niko drugi ne vidi.
-- Posle 5 pogrešnih PIN-ova nalog se zaključava na 15 minuta.

alter table public.osoblje
  add column email_prijave text unique,
  add column neuspesni_pokusaji int not null default 0,
  add column zakljucan_do timestamptz;

create table public.pozivnice (
  id bigint generated always as identity primary key,
  ime text not null,
  uloga public.uloga not null,
  kod_hash text not null,
  osoblje_id uuid references public.osoblje (id) on delete cascade, -- popunjeno kad je u pitanju novi PIN za postojeću osobu
  istice timestamptz not null default now() + interval '7 days',
  iskoriscena_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.pozivnice enable row level security;

create policy pozivnice_admin on public.pozivnice for all to authenticated
  using (privatno.moja_uloga() = 'admin') with check (privatno.moja_uloga() = 'admin');

-- Admin pravi pozivnicu i dobija kod (prikazuje se samo jednom; u bazi se čuva samo otisak koda)
create or replace function public.napravi_pozivnicu(p_ime text, p_uloga public.uloga, p_osoblje uuid default null)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  abeceda text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  kod text := '';
  i int;
begin
  if privatno.moja_uloga() is distinct from 'admin' then
    raise exception 'Samo admin pravi pozivnice';
  end if;
  for i in 1..8 loop
    kod := kod || substr(abeceda, 1 + (get_byte(gen_random_bytes(1), 0) % length(abeceda)), 1);
  end loop;
  -- stare neiskorišćene pozivnice za istu osobu prestaju da važe
  if p_osoblje is not null then
    update public.pozivnice set istice = now() where osoblje_id = p_osoblje and iskoriscena_at is null;
  end if;
  insert into public.pozivnice (ime, uloga, kod_hash, osoblje_id)
  values (trim(p_ime), p_uloga, crypt(kod, gen_salt('bf')), p_osoblje);
  return kod;
end;
$$;

revoke execute on function public.napravi_pozivnicu(text, public.uloga, uuid) from public, anon;
grant execute on function public.napravi_pozivnicu(text, public.uloga, uuid) to authenticated;

-- Provera koda pri aktivaciji. Poziva je samo server aplikacije (servisna uloga).
create or replace function public.proveri_pozivnicu(p_kod text)
returns table (id bigint, ime text, uloga public.uloga, osoblje_id uuid)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.ime, p.uloga, p.osoblje_id
  from public.pozivnice p
  where p.iskoriscena_at is null
    and p.istice > now()
    and p.kod_hash = crypt(upper(trim(p_kod)), p.kod_hash)
  limit 1
$$;

revoke execute on function public.proveri_pozivnicu(text) from public, anon, authenticated;
grant execute on function public.proveri_pozivnicu(text) to service_role;
