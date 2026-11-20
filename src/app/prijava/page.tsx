import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getKorisnik } from "@/lib/sesija";
import { pocetna, type Uloga } from "@/lib/uloge";
import PrijavaForma from "./PrijavaForma";

// Stranica zavisi od prijavljenog korisnika, pa se pravi pri svakom zahtevu.
export const instant = false;

export default async function PrijavaPage() {
  const korisnik = await getKorisnik();
  if (korisnik) redirect(pocetna(korisnik.uloga));

  const admin = createAdminClient();
  let osoblje: { id: string; ime: string; uloga: Uloga }[] = [];
  if (admin) {
    const { data } = await admin
      .from("osoblje")
      .select("id, ime, uloga")
      .eq("aktivan", true)
      .order("ime");
    osoblje = (data ?? []) as typeof osoblje;
  }

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">HotelFlow</h1>
          <p className="text-zinc-600">Prijavi se kao</p>
        </div>

        {!admin ? (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center text-amber-900">
            Prijava još nije podešena. Administrator treba da upiše tajni ključ baze u podešavanja aplikacije.
          </p>
        ) : (
          <PrijavaForma osoblje={osoblje} />
        )}

        <p className="text-center text-sm text-zinc-600">
          Prvi put ovde ili ste dobili novi kod?{" "}
          <Link href="/aktivacija" className="font-semibold text-blue-700 underline">
            Aktivirajte nalog kodom
          </Link>
        </p>
      </div>
    </main>
  );
}
