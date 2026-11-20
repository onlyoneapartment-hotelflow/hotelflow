import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pocetna, type Uloga } from "@/lib/uloge";

export type Korisnik = { id: string; ime: string; uloga: Uloga };

/** Prijavljena osoba iz osoblja, ili null ako niko nije prijavljen ili je nalog isključen. */
export async function getKorisnik(): Promise<Korisnik | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("osoblje")
    .select("id, ime, uloga, aktivan")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.aktivan) return null;
  return { id: data.id, ime: data.ime, uloga: data.uloga as Uloga };
}

/** Pusti na stranicu samo navedene uloge; ostale vrati na njihovu početnu ili na prijavu. */
export async function zahtevajUlogu(dozvoljene: Uloga[]): Promise<Korisnik> {
  const korisnik = await getKorisnik();
  if (!korisnik) redirect("/prijava");
  if (!dozvoljene.includes(korisnik.uloga)) redirect(pocetna(korisnik.uloga));
  return korisnik;
}
