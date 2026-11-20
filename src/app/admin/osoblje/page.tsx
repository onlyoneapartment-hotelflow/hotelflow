import Link from "next/link";
import Zaglavlje from "@/components/Zaglavlje";
import { zahtevajUlogu } from "@/lib/sesija";
import { createClient } from "@/lib/supabase/server";
import { nazivUloge, type Uloga } from "@/lib/uloge";
import { ponistiPozivnicu, promeniAktivnost } from "./actions";
import { DodajOsobu, NoviPinDugme } from "./Forme";

// Stranica zavisi od prijavljenog korisnika, pa se pravi pri svakom zahtevu.
export const instant = false;

const datum = (s: string) =>
  new Date(s).toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function OsobljePage() {
  const ja = await zahtevajUlogu(["admin"]);
  const supabase = await createClient();

  const [{ data: osoblje }, { data: pozivnice }] = await Promise.all([
    supabase.from("osoblje").select("id, ime, uloga, aktivan, zakljucan_do").order("uloga").order("ime"),
    supabase
      .from("pozivnice")
      .select("id, ime, uloga, istice, osoblje_id")
      .is("iskoriscena_at", null)
      .gt("istice", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Zaglavlje korisnik={ja} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-1">
          <Link href="/admin" className="text-sm font-semibold text-blue-700">
            ← Nazad
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Osoblje i prijave</h1>
          <p className="text-zinc-600">
            Dodajte osobu i dajte joj kod. Ona na svom telefonu otvori „Aktivirajte nalog kodom” i sama izabere PIN.
          </p>
        </div>

        <DodajOsobu />

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-zinc-900">Aktivni i isključeni nalozi</h2>
          {(osoblje ?? []).length === 0 && <p className="text-zinc-600">Još nema aktiviranih naloga.</p>}
          <ul className="flex flex-col gap-2">
            {(osoblje ?? []).map((o) => {
              const zakljucan = o.zakljucan_do && new Date(o.zakljucan_do) > new Date();
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="flex min-w-40 flex-1 flex-col">
                    <span className="font-semibold text-zinc-900">
                      {o.ime} {o.id === ja.id && <span className="font-normal text-zinc-500">(vi)</span>}
                    </span>
                    <span className="text-sm text-zinc-600">{nazivUloge(o.uloga as Uloga)}</span>
                  </div>
                  <span className={`text-sm font-semibold ${o.aktivan ? "text-green-800" : "text-zinc-500"}`}>
                    {o.aktivan ? (zakljucan ? "Privremeno zaključan" : "Aktivan") : "Isključen"}
                  </span>
                  <NoviPinDugme id={o.id} />
                  {o.id !== ja.id && (
                    <form action={promeniAktivnost}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="aktivan" value={o.aktivan ? "ne" : "da"} />
                      <button
                        type="submit"
                        className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-900"
                      >
                        {o.aktivan ? "Isključi nalog" : "Uključi nalog"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-zinc-900">Kodovi koji čekaju aktivaciju</h2>
          {(pozivnice ?? []).length === 0 && <p className="text-zinc-600">Nema neiskorišćenih kodova.</p>}
          <ul className="flex flex-col gap-2">
            {(pozivnice ?? []).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-zinc-900">{p.ime}</span>
                  <span className="text-sm text-zinc-700">
                    {nazivUloge(p.uloga as Uloga)} · {p.osoblje_id ? "novi PIN" : "novi nalog"} · važi do {datum(p.istice)}
                  </span>
                </div>
                <form action={ponistiPozivnicu}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold">
                    Poništi kod
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
