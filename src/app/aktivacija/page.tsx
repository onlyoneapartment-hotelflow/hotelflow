import Link from "next/link";
import AktivacijaForma from "./AktivacijaForma";

export default function AktivacijaPage() {
  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Aktivacija naloga</h1>
          <p className="text-zinc-600">
            Unesite kod koji ste dobili od administratora i izaberite svoj PIN. PIN zna samo vi.
          </p>
        </div>
        <AktivacijaForma />
        <p className="text-center text-sm text-zinc-600">
          Već imate PIN?{" "}
          <Link href="/prijava" className="font-semibold text-blue-700 underline">
            Prijavite se
          </Link>
        </p>
      </div>
    </main>
  );
}
