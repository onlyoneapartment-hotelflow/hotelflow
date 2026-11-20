-- HotelFlow: početna šema baze
-- Sobe, osoblje i uloge, rezervacije, gosti, čišćenje, popravke, predračuni i računi, istorija promena.

create extension if not exists btree_gist;

-- ─────────────────────────────────────────────
-- Uloge i osoblje
-- ─────────────────────────────────────────────
create type public.uloga as enum ('admin', 'recepcija', 'sobarica', 'majstor');

create table public.osoblje (
  id uuid primary key references auth.users (id) on delete cascade,
  ime text not null,
  uloga public.uloga not null,
  aktivan boolean not null default true,
  created_at timestamptz not null default now()
);

-- Uloga prijavljenog korisnika (koristi se u pravilima pristupa)
create or replace function public.moja_uloga()
returns public.uloga
language sql
stable
security definer
set search_path = public
as $$
  select uloga from public.osoblje where id = auth.uid() and aktivan
$$;

create or replace function public.je_kancelarija()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.moja_uloga() in ('admin', 'recepcija'), false)
$$;

-- ─────────────────────────────────────────────
-- Izdavaoci (dva registrovana objekta) i sobe
-- ─────────────────────────────────────────────
create table public.izdavaoci (
  id text primary key,
  ime text not null,
  objekat text not null,
  adresa text not null default '',
  mesto text not null default '',
  ziro_racun text not null default '',
  napomena text not null default ''
);

create table public.sobe (
  broj text primary key,
  sprat int not null,
  izdavalac_id text references public.izdavaoci (id),
  cisto boolean not null default true,
  van_funkcije boolean not null default false,
  van_funkcije_razlog text,
  van_funkcije_od timestamptz
);

-- ─────────────────────────────────────────────
-- Rezervacije i gosti
-- ─────────────────────────────────────────────
create table public.rezervacije (
  id bigint generated always as identity primary key,
  soba text not null references public.sobe (broj),
  dolazak date not null,
  odlazak date not null,
  ime_gosta text not null,
  telefon text not null default '',
  broj_gostiju int not null default 1 check (broj_gostiju > 0),
  preko text not null default 'Telefon' check (preko in ('Telefon', 'Lično', 'Booking', 'Airbnb')),
  cena_eur numeric(10, 2) not null default 0,
  naplata text not null default 'Ne' check (naplata in ('Ne', 'Gotovina', 'Uplata na račun', 'Booking', 'Airbnb')),
  naplatu_uzeo uuid references public.osoblje (id),
  komentar text not null default '',
  rani_dolazak time,
  kasna_odjava time,
  status_gosta text not null default 'ocekuje' check (status_gosta in ('ocekuje', 'u_sobi', 'izasao')),
  premesteno_iz bigint references public.rezervacije (id),
  rezervisao uuid references public.osoblje (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (odlazak > dolazak),
  -- Zaštita od duple rezervacije: ista soba ne može imati dve rezervacije koje se preklapaju
  constraint bez_preklapanja exclude using gist (soba with =, daterange(dolazak, odlazak) with &&)
);

create index rezervacije_datumi on public.rezervacije (dolazak, odlazak);

-- Evidencija gostiju: svaki gost iz rezervacije, sa skenom dokumenta u privatnom skladištu
create table public.gosti (
  id bigint generated always as identity primary key,
  rezervacija_id bigint not null references public.rezervacije (id) on delete cascade,
  ime text not null,
  vrsta_dokumenta text not null default 'Lična karta' check (vrsta_dokumenta in ('Lična karta', 'Pasoš')),
  sken_putanja text,
  sken_obrisan boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Čišćenje
-- ─────────────────────────────────────────────
create table public.nalozi_ciscenja (
  id bigint generated always as identity primary key,
  datum date not null default current_date,
  soba text references public.sobe (broj),
  naslov text not null,
  opis text not null default '',
  dodeljeno uuid references public.osoblje (id),
  status text not null default 'za_ciscenje' check (status in ('proveri_izlazak', 'za_ciscenje', 'u_toku', 'zavrseno')),
  hitno boolean not null default false,
  rok time,
  automatski boolean not null default false,
  poceto_at timestamptz,
  zavrseno_at timestamptz,
  created_at timestamptz not null default now()
);

create index nalozi_ciscenja_datum on public.nalozi_ciscenja (datum, dodeljeno);

-- ─────────────────────────────────────────────
-- Popravke (nalog i slika se brišu kad majstor završi)
-- ─────────────────────────────────────────────
create table public.nalozi_popravke (
  id bigint generated always as identity primary key,
  lokacija text not null,
  opis text not null,
  slika_putanja text,
  majstor uuid references public.osoblje (id),
  status text not null default 'novo' check (status in ('novo', 'u_toku', 'ceka_deo')),
  hitno boolean not null default false,
  napomena_majstora text not null default '',
  izvor text not null default 'admin' check (izvor in ('admin', 'ciscenje')),
  prijavio uuid references public.osoblje (id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Kupci (firme), predračuni i računi
-- ─────────────────────────────────────────────
create table public.kupci (
  id bigint generated always as identity primary key,
  naziv text not null,
  adresa text not null default '',
  pib text unique,
  maticni_broj text,
  created_at timestamptz not null default now()
);

create table public.dokumenti (
  id bigint generated always as identity primary key,
  vrsta text not null check (vrsta in ('predracun', 'racun')),
  broj text not null,
  izdavalac_id text not null references public.izdavaoci (id),
  datum date not null default current_date,
  rok_za_uplatu date,
  nacin_placanja text not null check (nacin_placanja in ('Gotovina', 'Uplata na račun')),
  kupac_tip text not null check (kupac_tip in ('pravno', 'fizicko')),
  kupac_naziv text not null,
  kupac_adresa text not null default '',
  kupac_pib text,
  kupac_mb text,
  ukupno numeric(12, 2) not null default 0,
  status text not null check (status in ('ceka_uplatu', 'placen', 'izdat', 'storniran')),
  predracun_id bigint references public.dokumenti (id),
  izdao uuid references public.osoblje (id),
  created_at timestamptz not null default now(),
  unique (izdavalac_id, vrsta, broj)
);

create table public.dokument_stavke (
  id bigint generated always as identity primary key,
  dokument_id bigint not null references public.dokumenti (id) on delete cascade,
  rezervacija_id bigint references public.rezervacije (id),
  opis text not null,
  kolicina numeric(10, 2) not null default 1,
  jedinica text not null default 'kom',
  cena numeric(12, 2) not null default 0
);

-- Sledeći broj dokumenta, posebno za svakog izdavaoca i vrstu (predračun 001-2026, račun 001/2026)
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
  select count(*) + 1 into n
  from public.dokumenti
  where izdavalac_id = p_izdavalac and vrsta = p_vrsta and to_char(datum, 'YYYY') = godina;
  return lpad(n::text, 3, '0') || case when p_vrsta = 'predracun' then '-' else '/' end || godina;
end;
$$;

-- ─────────────────────────────────────────────
-- Istorija promena
-- ─────────────────────────────────────────────
create table public.istorija (
  id bigint generated always as identity primary key,
  rezervacija_id bigint references public.rezervacije (id) on delete set null,
  soba text references public.sobe (broj),
  poruka text not null,
  korisnik uuid references public.osoblje (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index istorija_rez on public.istorija (rezervacija_id);
create index istorija_soba on public.istorija (soba);

-- ─────────────────────────────────────────────
-- Pravila pristupa (Row Level Security)
-- Admin i recepcija: sve. Sobarica: svoji nalozi za čišćenje. Majstor: svoji nalozi za popravke.
-- ─────────────────────────────────────────────
alter table public.osoblje enable row level security;
alter table public.izdavaoci enable row level security;
alter table public.sobe enable row level security;
alter table public.rezervacije enable row level security;
alter table public.gosti enable row level security;
alter table public.nalozi_ciscenja enable row level security;
alter table public.nalozi_popravke enable row level security;
alter table public.kupci enable row level security;
alter table public.dokumenti enable row level security;
alter table public.dokument_stavke enable row level security;
alter table public.istorija enable row level security;

-- Osoblje: svako vidi sebe, kancelarija vidi sve, samo admin menja
create policy osoblje_citanje on public.osoblje for select to authenticated
  using (id = auth.uid() or public.je_kancelarija());
create policy osoblje_admin on public.osoblje for all to authenticated
  using (public.moja_uloga() = 'admin') with check (public.moja_uloga() = 'admin');

-- Izdavaoci: kancelarija čita, admin menja
create policy izdavaoci_citanje on public.izdavaoci for select to authenticated using (public.je_kancelarija());
create policy izdavaoci_admin on public.izdavaoci for all to authenticated
  using (public.moja_uloga() = 'admin') with check (public.moja_uloga() = 'admin');

-- Sobe: svi prijavljeni vide spisak soba, kancelarija menja
create policy sobe_citanje on public.sobe for select to authenticated using (public.moja_uloga() is not null);
create policy sobe_kancelarija on public.sobe for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());

-- Rezervacije, gosti, kupci, dokumenti, stavke: samo kancelarija
create policy rezervacije_kancelarija on public.rezervacije for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());
create policy gosti_kancelarija on public.gosti for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());
create policy kupci_kancelarija on public.kupci for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());
create policy dokumenti_kancelarija on public.dokumenti for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());
create policy stavke_kancelarija on public.dokument_stavke for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());

-- Nalozi za čišćenje: kancelarija sve, sobarica vidi i menja samo svoje
create policy ciscenje_kancelarija on public.nalozi_ciscenja for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());
create policy ciscenje_sobarica_citanje on public.nalozi_ciscenja for select to authenticated
  using (dodeljeno = auth.uid());
create policy ciscenje_sobarica_izmena on public.nalozi_ciscenja for update to authenticated
  using (dodeljeno = auth.uid()) with check (dodeljeno = auth.uid());

-- Nalozi za popravke: kancelarija sve, majstor svoje (i briše kad završi), sobarica može da prijavi kvar
create policy popravke_kancelarija on public.nalozi_popravke for all to authenticated
  using (public.je_kancelarija()) with check (public.je_kancelarija());
create policy popravke_majstor_citanje on public.nalozi_popravke for select to authenticated
  using (majstor = auth.uid());
create policy popravke_majstor_izmena on public.nalozi_popravke for update to authenticated
  using (majstor = auth.uid()) with check (majstor = auth.uid());
create policy popravke_majstor_brisanje on public.nalozi_popravke for delete to authenticated
  using (majstor = auth.uid());
create policy popravke_sobarica_prijava on public.nalozi_popravke for insert to authenticated
  with check (public.moja_uloga() = 'sobarica' and izvor = 'ciscenje' and prijavio = auth.uid());

-- Istorija: kancelarija čita, svi prijavljeni upisuju u svoje ime
create policy istorija_citanje on public.istorija for select to authenticated using (public.je_kancelarija());
create policy istorija_upis on public.istorija for insert to authenticated
  with check (public.moja_uloga() is not null and korisnik = auth.uid());

-- Sobarica označava sobu čistom kroz funkciju (ne može da menja ostale podatke o sobi)
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
     and (dodeljeno = auth.uid() or public.je_kancelarija())
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

-- ─────────────────────────────────────────────
-- Uživo osvežavanje (admin vidi promene sobarica i majstora odmah)
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.sobe, public.rezervacije, public.nalozi_ciscenja, public.nalozi_popravke;

-- ─────────────────────────────────────────────
-- Privatna skladišta za skenove dokumenata i slike kvarova
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('dokumenti-gostiju', 'dokumenti-gostiju', false),
  ('slike-popravki', 'slike-popravki', false)
on conflict (id) do nothing;

create policy skenovi_kancelarija on storage.objects for all to authenticated
  using (bucket_id = 'dokumenti-gostiju' and public.je_kancelarija())
  with check (bucket_id = 'dokumenti-gostiju' and public.je_kancelarija());

create policy slike_popravki_citanje on storage.objects for select to authenticated
  using (bucket_id = 'slike-popravki' and public.moja_uloga() in ('admin', 'recepcija', 'majstor'));
create policy slike_popravki_upis on storage.objects for insert to authenticated
  with check (bucket_id = 'slike-popravki' and public.moja_uloga() is not null);
create policy slike_popravki_brisanje on storage.objects for delete to authenticated
  using (bucket_id = 'slike-popravki' and public.moja_uloga() in ('admin', 'recepcija', 'majstor'));

-- ─────────────────────────────────────────────
-- Početni podaci: dva objekta i 31 soba
-- (kojem objektu pripada koja soba upisuje se kad stigne spisak)
-- ─────────────────────────────────────────────
insert into public.izdavaoci (id, ime, objekat, napomena) values
  ('djordje', 'Đorđe Mladenović', 'The Only One smeštaj',
   'Račun izdaje fizičko lice koje pruža usluge smeštaja u domaćoj radinosti (Zakon o ugostiteljstvu). Izdavalac nije obveznik PDV-a.'),
  ('milko', 'Milko Mladenović', 'The Only One smeštaj',
   'Račun izdaje fizičko lice koje pruža usluge smeštaja u domaćoj radinosti (Zakon o ugostiteljstvu). Izdavalac nije obveznik PDV-a.');

insert into public.sobe (broj, sprat)
select broj, left(broj, 1)::int
from unnest(array[
  '101','102','103','104','105','106','107','108','109',
  '201','202','203','204','205','206','207','208','209',
  '301','302','303','304','305','306',
  '401','402','403','404',
  '501','502','503'
]) as broj;
