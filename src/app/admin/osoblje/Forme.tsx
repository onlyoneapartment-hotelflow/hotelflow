"use client";

import { useActionState } from "react";
import { ULOGE } from "@/lib/uloge";
import { napraviPozivnicu, noviPin, type StanjeKoda } from "./actions";

function PrikazKoda({ stanje }: { stanje: StanjeKoda }) {
  if (!stanje) return null;
  if (stanje.greska) {
    return (
      <p role="alert" className="font-semibold text-red-700">
        {stanje.greska}
      </p>
    );
  }
  return (
    <div role="status" className="rounded-xl border-2 border-green-700 bg-green-50 p-4">
      <p className="text-sm text-green-900">
        Kod za <strong>{stanje.ime}</strong> (prikazuje se samo sada, važi 7 dana i može se iskoristiti jednom):
      </p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] text-zinc-900">{stanje.kod}</p>
      <p className="mt-1 text-sm text-green-900">
        Dajte ga osobi lično. Ona na telefonu otvori aplikaciju, „Aktivirajte nalog kodom”, i izabere svoj PIN.
      </p>
    </div>
  );
}

export function DodajOsobu() {
  const [stanje, akcija, salje] = useActionState(napraviPozivnicu, undefined);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-zinc-900">Dodaj osobu</h2>
      <form action={akcija} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="ime" className="text-sm font-medium text-zinc-800">
            Ime
          </label>
          <input id="ime" name="ime" required className="min-h-11 rounded-lg border border-zinc-400 px-3 text-base" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="uloga" className="text-sm font-medium text-zinc-800">
            Uloga
          </label>
          <select id="uloga" name="uloga" required className="min-h-11 rounded-lg border border-zinc-400 bg-white px-3 text-base">
            {ULOGE.map((u) => (
              <option key={u.id} value={u.id}>
                {u.naziv}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={salje}
          className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white disabled:bg-zinc-300"
        >
          {salje ? "Pravim kod…" : "Napravi kod"}
        </button>
      </form>
      <PrikazKoda stanje={stanje} />
    </section>
  );
}

export function NoviPinDugme({ id }: { id: string }) {
  const [stanje, akcija, salje] = useActionState(noviPin, undefined);
  return (
    <div className="flex flex-col gap-2">
      <form action={akcija}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={salje}
          className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-900"
        >
          Kod za novi PIN
        </button>
      </form>
      <PrikazKoda stanje={stanje} />
    </div>
  );
}
