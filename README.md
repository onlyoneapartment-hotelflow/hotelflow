# HotelFlow

Softver za upravljanje apartmanima **The Only One** (31 apartman, dva registrovana objekta: Đorđe Mladenović i Milko Mladenović).

## Šta radi

- **Prijava po ulogama:** admin, recepcija, sobarica, majstor
- **Pregled soba:** dan po dan i ceo mesec, dolasci, odlasci, čistoća, naplata
- **Rezervacije:** ručni unos, uvoz Booking PDF-a, zaštita od duple rezervacije, premeštanje gosta
- **Evidencija gostiju:** gosti sa skenom lične karte ili pasoša (slika se briše po pravilu čuvanja)
- **Čišćenje:** nalozi za sobarice na telefonu, „Gosti izašli → Počni → Čisto”, dodatni zadaci
- **Popravke:** nalozi za majstore sa slikom; nalog i slika se brišu kad je popravljeno
- **Predračuni i računi:** dva izdavaoca, gotovina odmah račun, uplata na račun prvo predračun
- **Istorija promena:** ko je šta i kada uradio

Prototip izgleda i ponašanja: https://claude.ai/artifact/Y1uktqo7GQJsdAMJ7BxQCh

## Tehnologija

- [Next.js](https://nextjs.org) (aplikacija), hostovana na [Vercel](https://vercel.com)
- [Supabase](https://supabase.com): baza (Postgres), prijava korisnika, skladište fajlova, osvežavanje uživo
- Šema baze: `supabase/migrations/`

## Pokretanje na računaru (za razvoj)

```bash
cp .env.example .env.local   # pa upisati vrednosti iz Supabase projekta
npm install
npm run dev
```

## Plan izrade

1. Baza, prijava i uloge
2. Admin i recepcija: pregled dana, kalendar, rezervacije, evidencija, predračuni i računi
3. Telefon za sobarice i majstore, sa promenama uživo
4. Testiranje, ispravke, prelazak sa Excel tabele
5. Kasnije: eTurista, obaveštenja na telefon, Booking/Airbnb preko Beds24
