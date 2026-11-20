export type Uloga = "admin" | "recepcija" | "sobarica" | "majstor";

export const ULOGE: { id: Uloga; naziv: string; opis: string; uredjaj: string }[] = [
  { id: "admin", naziv: "Admin", opis: "Sve: rezervacije, naplata, računi, osoblje i podešavanja.", uredjaj: "Računar ili telefon" },
  { id: "recepcija", naziv: "Recepcija", opis: "Rezervacije, dolasci i odlasci, naplata, čišćenje i popravke.", uredjaj: "Računar na recepciji" },
  { id: "sobarica", naziv: "Sobarica", opis: "Samo svoje sobe i zadaci za čišćenje za danas.", uredjaj: "Telefon" },
  { id: "majstor", naziv: "Majstor", opis: "Samo svoji nalozi za popravke.", uredjaj: "Telefon" },
];

export function nazivUloge(uloga: Uloga) {
  return ULOGE.find((u) => u.id === uloga)?.naziv ?? uloga;
}

/** Početna stranica za svaku ulogu posle prijave. */
export function pocetna(uloga: Uloga) {
  return `/${uloga}`;
}

export const PIN_DUZINA = 6;
export const PIN_REGEX = /^\d{6}$/;
