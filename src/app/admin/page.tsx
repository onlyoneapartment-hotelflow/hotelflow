import Link from "next/link";
import Zaglavlje from "@/components/Zaglavlje";
import { zahtevajUlogu } from "@/lib/sesija";

// Stranica zavisi od prijavljenog korisnika, pa se pravi pri svakom zahtevu.
export const instant = false;

export default async function AdminPage() {
  const ja = await zahtevajUlogu(["admin"]);
  return (
    <>
      <Zaglavlje korisnik={ja} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Zdravo, {ja.ime}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/osoblje"
            className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-blue-700"
          >
            <span className="text-xl font-semibold text-zinc-900">Osoblje i prijave</span>
            <span className="text-zinc-600">Dodajte osobu, napravite kod za aktivaciju ili novi PIN.</span>
          </Link>
          <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-zinc-300 bg-white p-5">
            <span className="text-xl font-semibold text-zinc-900">Pregled soba</span>
            <span className="text-zinc-600">U izradi: kalendar, rezervacije, čišćenje, popravke i računi.</span>
          </div>
        </div>
      </main>
    </>
  );
}
