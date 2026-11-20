"use server";

import { revalidatePath } from "next/cache";
import { zahtevajUlogu } from "@/lib/sesija";
import { createClient } from "@/lib/supabase/server";
import { ULOGE, type Uloga } from "@/lib/uloge";

export type StanjeKoda = { greska?: string; kod?: string; ime?: string } | undefined;

export async function napraviPozivnicu(_p: StanjeKoda, formData: FormData): Promise<StanjeKoda> {
  await zahtevajUlogu(["admin"]);
  const ime = String(formData.get("ime") ?? "").trim();
  const uloga = String(formData.get("uloga") ?? "") as Uloga;
  if (ime.length < 2) return { greska: "Upišite ime." };
  if (!ULOGE.some((u) => u.id === uloga)) return { greska: "Izaberite ulogu." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("napravi_pozivnicu", { p_ime: ime, p_uloga: uloga });
  if (error || !data) return { greska: "Kod nije napravljen. Pokušajte ponovo." };
  revalidatePath("/admin/osoblje");
  return { kod: String(data), ime };
}

export async function noviPin(_p: StanjeKoda, formData: FormData): Promise<StanjeKoda> {
  await zahtevajUlogu(["admin"]);
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data: osoba } = await supabase.from("osoblje").select("id, ime, uloga").eq("id", id).maybeSingle();
  if (!osoba) return { greska: "Osoba ne postoji." };
  const { data, error } = await supabase.rpc("napravi_pozivnicu", {
    p_ime: osoba.ime,
    p_uloga: osoba.uloga,
    p_osoblje: osoba.id,
  });
  if (error || !data) return { greska: "Kod nije napravljen. Pokušajte ponovo." };
  revalidatePath("/admin/osoblje");
  return { kod: String(data), ime: osoba.ime };
}

export async function promeniAktivnost(formData: FormData) {
  const ja = await zahtevajUlogu(["admin"]);
  const id = String(formData.get("id") ?? "");
  const aktivan = formData.get("aktivan") === "da";
  if (!id || id === ja.id) return;
  const supabase = await createClient();
  await supabase.from("osoblje").update({ aktivan }).eq("id", id);
  revalidatePath("/admin/osoblje");
}

export async function ponistiPozivnicu(formData: FormData) {
  await zahtevajUlogu(["admin"]);
  const id = Number(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("pozivnice").delete().eq("id", id).is("iskoriscena_at", null);
  revalidatePath("/admin/osoblje");
}
