"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PIN_REGEX, pocetna, type Uloga } from "@/lib/uloge";

const MAKS_POKUSAJA = 5;
const ZAKLJUCAJ_MINUTA = 15;

export type StanjePrijave = { greska?: string } | undefined;

export async function prijaviSe(_prethodno: StanjePrijave, formData: FormData): Promise<StanjePrijave> {
  const osobaId = String(formData.get("osobaId") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!osobaId) return { greska: "Izaberite svoje ime." };
  if (!PIN_REGEX.test(pin)) return { greska: "PIN ima tačno 6 cifara." };

  const admin = createAdminClient();
  if (!admin) return { greska: "Prijava još nije podešena. Javite administratoru." };

  const { data: osoba } = await admin
    .from("osoblje")
    .select("id, uloga, aktivan, email_prijave, neuspesni_pokusaji, zakljucan_do")
    .eq("id", osobaId)
    .maybeSingle();

  if (!osoba || !osoba.aktivan || !osoba.email_prijave) {
    return { greska: "Ovaj nalog nije aktivan. Javite administratoru." };
  }

  if (osoba.zakljucan_do && new Date(osoba.zakljucan_do) > new Date()) {
    const minuta = Math.ceil((new Date(osoba.zakljucan_do).getTime() - Date.now()) / 60000);
    return { greska: `Previše pogrešnih pokušaja. Pokušajte ponovo za ${minuta} min.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: osoba.email_prijave, password: pin });

  if (error) {
    const pokusaji = (osoba.neuspesni_pokusaji ?? 0) + 1;
    if (pokusaji >= MAKS_POKUSAJA) {
      await admin
        .from("osoblje")
        .update({ neuspesni_pokusaji: 0, zakljucan_do: new Date(Date.now() + ZAKLJUCAJ_MINUTA * 60000).toISOString() })
        .eq("id", osoba.id);
      return { greska: `Pogrešan PIN. Nalog je zaključan na ${ZAKLJUCAJ_MINUTA} minuta.` };
    }
    await admin.from("osoblje").update({ neuspesni_pokusaji: pokusaji }).eq("id", osoba.id);
    return { greska: `Pogrešan PIN. Ostalo pokušaja: ${MAKS_POKUSAJA - pokusaji}.` };
  }

  await admin.from("osoblje").update({ neuspesni_pokusaji: 0, zakljucan_do: null }).eq("id", osoba.id);
  redirect(pocetna(osoba.uloga as Uloga));
}

export async function odjaviSe() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/prijava");
}
