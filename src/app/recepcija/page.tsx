import Zaglavlje from "@/components/Zaglavlje";
import { zahtevajUlogu } from "@/lib/sesija";

// Stranica zavisi od prijavljenog korisnika, pa se pravi pri svakom zahtevu.
export const instant = false;

export default async function RecepcijaPage() {
  const ja = await zahtevajUlogu(["recepcija", "admin"]);
  return (
    <>
      <Zaglavlje korisnik={ja} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Zdravo, {ja.ime}</h1>
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5 text-zinc-600">
          Ovde uskoro: pregled soba za danas, kalendar, rezervacije, naplata, čišćenje i popravke.
        </p>
      </main>
    </>
  );
}
