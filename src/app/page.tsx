import { redirect } from "next/navigation";
import { getKorisnik } from "@/lib/sesija";
import { pocetna } from "@/lib/uloge";

// Stranica zavisi od prijavljenog korisnika, pa se pravi pri svakom zahtevu.
export const instant = false;

export default async function Home() {
  const korisnik = await getKorisnik();
  redirect(korisnik ? pocetna(korisnik.uloga) : "/prijava");
}
