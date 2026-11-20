import Link from "next/link";
import { odjaviSe } from "@/app/prijava/actions";
import type { Korisnik } from "@/lib/sesija";
import { nazivUloge, pocetna } from "@/lib/uloge";

export default function Zaglavlje({ korisnik }: { korisnik: Korisnik }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={pocetna(korisnik.uloga)} className="text-xl font-semibold tracking-tight text-zinc-900">
          HotelFlow
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-700">
            <strong className="text-zinc-900">{korisnik.ime}</strong> · {nazivUloge(korisnik.uloga)}
          </span>
          <form action={odjaviSe}>
            <button
              type="submit"
              className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Odjavi se
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
