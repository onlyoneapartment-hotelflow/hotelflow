"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PIN_REGEX, pocetna, type Uloga } from "@/lib/uloge";

export type StanjeAktivacije = { greska?: string } | undefined;

const LAKI_PINOVI = new Set(["000000", "111111", "123456", "654321", "121212", "112233"]);

export async function aktiviraj(_prethodno: StanjeAktivacije, formData: FormData): Promise<StanjeAktivacije> {
  const kod = String(formData.get("kod") ?? "").trim().toUpperCase();
  const pin = String(formData.get("pin") ?? "");
  const pin2 = String(formData.get("pin2") ?? "");

  if (kod.length !== 8) return { greska: "Kod ima 8 znakova." };
  if (!PIN_REGEX.test(pin)) return { greska: "PIN mora imati tačno 6 cifara." };
  if (/^(\d)\1{5}$/.test(pin) || LAKI_PINOVI.has(pin)) return { greska: "Taj PIN je previše lak. Izaberite drugi." };
  if (pin !== pin2) return { greska: "PIN-ovi se ne poklapaju." };

  const admin = createAdminClient();
  if (!admin) return { greska: "Aktivacija još nije podešena. Javite administratoru." };

  const { data: pozivnice, error: greskaKoda } = await admin.rpc("proveri_pozivnicu", { p_kod: kod });
  const pozivnica = Array.isArray(pozivnice) ? pozivnice[0] : null;
  if (greskaKoda || !pozivnica) return { greska: "Kod nije ispravan, već je iskorišćen ili je istekao." };

  let email: string;
  let uloga = pozivnica.uloga as Uloga;

  if (pozivnica.osoblje_id) {
    // Novi PIN za postojeću osobu
    const { data: osoba } = await admin
      .from("osoblje")
      .select("id, uloga, email_prijave")
      .eq("id", pozivnica.osoblje_id)
      .maybeSingle();
    if (!osoba?.email_prijave) return { greska: "Nalog za ovaj kod ne postoji. Javite administratoru." };
    const { error } = await admin.auth.admin.updateUserById(osoba.id, { password: pin });
    if (error) return { greska: "PIN nije sačuvan. Pokušajte ponovo." };
    await admin.from("osoblje").update({ neuspesni_pokusaji: 0, zakljucan_do: null, aktivan: true }).eq("id", osoba.id);
    email = osoba.email_prijave;
    uloga = osoba.uloga as Uloga;
  } else {
    // Nova osoba: nalog bez prave e-mail adrese, prijava ide imenom i PIN-om
    email = `osoblje-${randomUUID()}@hotelflow.example`;
    const { data: novi, error } = await admin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { ime: pozivnica.ime },
    });
    if (error || !novi.user) return { greska: "Nalog nije napravljen. Pokušajte ponovo ili javite administratoru." };
    const { error: greskaUpisa } = await admin
      .from("osoblje")
      .insert({ id: novi.user.id, ime: pozivnica.ime, uloga, email_prijave: email });
    if (greskaUpisa) {
      await admin.auth.admin.deleteUser(novi.user.id);
      return { greska: "Nalog nije napravljen. Pokušajte ponovo ili javite administratoru." };
    }
  }

  await admin.from("pozivnice").update({ iskoriscena_at: new Date().toISOString() }).eq("id", pozivnica.id);

  const supabase = await createClient();
  const { error: greskaPrijave } = await supabase.auth.signInWithPassword({ email, password: pin });
  if (greskaPrijave) redirect("/prijava");
  redirect(pocetna(uloga));
}
