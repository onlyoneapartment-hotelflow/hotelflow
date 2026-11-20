"use client";

import { useActionState } from "react";
import { aktiviraj } from "./actions";

const polje = "min-h-13 rounded-xl border border-zinc-400 px-4 text-xl text-zinc-900";

export default function AktivacijaForma() {
  const [stanje, akcija, salje] = useActionState(aktiviraj, undefined);

  return (
    <form action={akcija} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="kod" className="text-sm font-medium text-zinc-800">
          Kod za aktivaciju (8 znakova)
        </label>
        <input
          id="kod"
          name="kod"
          type="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          maxLength={8}
          required
          className={`${polje} uppercase tracking-[0.25em]`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="pin" className="text-sm font-medium text-zinc-800">
          Novi PIN (6 cifara)
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          pattern="\d{6}"
          required
          className={`${polje} tracking-[0.4em]`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="pin2" className="text-sm font-medium text-zinc-800">
          Ponovite PIN
        </label>
        <input
          id="pin2"
          name="pin2"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          pattern="\d{6}"
          required
          className={`${polje} tracking-[0.4em]`}
        />
      </div>
      {stanje?.greska && (
        <p role="alert" className="font-semibold text-red-700">
          {stanje.greska}
        </p>
      )}
      <button
        type="submit"
        disabled={salje}
        className="min-h-13 rounded-xl bg-blue-700 text-lg font-semibold text-white disabled:bg-zinc-300 disabled:text-zinc-600"
      >
        {salje ? "Aktiviram…" : "Aktiviraj i prijavi se"}
      </button>
    </form>
  );
}
