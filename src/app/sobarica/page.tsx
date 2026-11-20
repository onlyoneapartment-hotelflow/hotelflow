import Zaglavlje from "@/components/Zaglavlje";
import { zahtevajUlogu } from "@/lib/sesija";

// Stranica zavisi od prijavljenog korisnika, pa se pravi pri svakom zahtevu.
export const instant = false;

export default async function SobaricaPage() {
  const ja = await zahtevajUlogu(["sobarica"]);
  return (
    <>
      <Zaglavlje korisnik={ja} />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Zdravo, {ja.ime}</h1>
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5 text-zinc-600">
          Ovde uskoro: sobe i zadaci za čišćenje za danas.
        </p>
      </main>
    </>
  );
}
