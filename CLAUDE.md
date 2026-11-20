# HotelFlow – uputstvo za rad na projektu

- Korisnik je vlasnik/menadžer apartmana bez tehničkog znanja. Sa njim se piše na srpskom (latinica), jednostavno i bez žargona.
- Ceo interfejs aplikacije je na srpskom, latinicom.
- Stack: Next.js (App Router, TypeScript, Tailwind), Supabase (Postgres, Auth, Storage, Realtime), Vercel.
- Šema baze je u `supabase/migrations/`. Svaka promena baze ide kao nova migracija, nikad izmena stare.
- Pristup podacima čuvaju Row Level Security pravila po ulogama (`admin`, `recepcija`, `sobarica`, `majstor`). Ne zaobilaziti ih servisnim ključem u kodu koji radi u pregledaču.
- Tajne (lozinke, servisni ključevi) nikad u repozitorijum ni u poruke. Upisuju se u Vercel podešavanja.
- Skenovi dokumenata gostiju i slike kvarova idu u privatna Supabase skladišta. Slika kvara se briše zajedno sa nalogom kad majstor završi.
- Firma nije u sistemu PDV-a: na računima nema PDV-a ni boravišne takse. Plaćanje je samo gotovina ili uplata na račun (nema kartice).
- Prototip ponašanja i izgleda: https://claude.ai/artifact/Y1uktqo7GQJsdAMJ7BxQCh
