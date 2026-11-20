"use client";

import { useActionState, useState } from "react";
import { ULOGE, type Uloga } from "@/lib/uloge";
import { prijaviSe } from "./actions";

type Osoba = { id: string; ime: string; uloga: Uloga };

export default function PrijavaForma({ osoblje }: { osoblje: Osoba[] }) {
  const [uloga, setUloga] = useState<Uloga | null>(null);
  const [osobaId, setOsobaId] = useState<string>("");
  const [stanje, akcija, salje] = useActionState(prijaviSe, undefined);

  const ljudi = osoblje.filter((o) => o.uloga === uloga);

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Uloga" className="grid gap-3 sm:grid-cols-2">
        {ULOGE.map((u) => {
          const izabrano = uloga === u.id;
          return (
            <button
              key={u.id}
              type="button"
              aria-pressed={izabrano}
              onClick={() => {
                setUloga(u.id);
                const isti = osoblje.filter((o) => o.uloga === u.id);
                setOsobaId(isti.length === 1 ? isti[0].id : "");
              }}
              className={`flex min-h-24 flex-col gap-1 rounded-2xl border-2 bg-white p-4 text-left transition ${
                izabrano ? "border-blue-700 shadow-md" : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span className="text-xl font-semibold text-zinc-900">{u.naziv}</span>
              <span className="text-sm text-zinc-700">{u.opis}</span>
              <span className="text-xs text-zinc-500">{u.uredjaj}</span>
            </button>
          );
        })}
      </div>

      {uloga && (
        <form action={akcija} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Ko se prijavljuje?</h2>
          {ljudi.length === 0 ? (
            <p className="text-zinc-600">Za ovu ulogu još nema aktivnih naloga.</p>
          ) : (
            <div role="group" aria-label="Ime" className="flex flex-wrap gap-2">
              {ljudi.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={osobaId === o.id}
                  onClick={() => setOsobaId(o.id)}
                  className={`min-h-12 rounded-full border-2 px-5 text-base font-semibold ${
                    osobaId === o.id ? "border-blue-700 bg-blue-700 text-white" : "border-zinc-300 bg-white text-zinc-900"
                  }`}
                >
                  {o.ime}
                </button>
              ))}
            </div>
          )}

          <input type="hidden" name="osobaId" value={osobaId} />
          <div className="flex max-w-64 flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium text-zinc-800">
              PIN (6 cifara)
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              pattern="\d{6}"
              required
              className="min-h-13 rounded-xl border border-zinc-400 px-4 text-2xl tracking-[0.4em] text-zinc-900"
            />
          </div>

          {stanje?.greska && (
            <p role="alert" className="font-semibold text-red-700">
              {stanje.greska}
            </p>
          )}

          <button
            type="submit"
            disabled={!osobaId || salje}
            className="min-h-13 rounded-xl bg-blue-700 text-lg font-semibold text-white disabled:bg-zinc-300 disabled:text-zinc-600"
          >
            {salje ? "Prijavljujem…" : "Prijavi se"}
          </button>
        </form>
      )}
    </div>
  );
}
