/**
 * Official Dutch traffic sign catalogue (RVV 1990, Bijlage 1) — codes and
 * names verified against the OpenStreetMap NL traffic-sign reference
 * (wiki.openstreetmap.org/wiki/NL:Overzicht_Nederlandse_Verkeersborden),
 * which mirrors the legal annex and is what NL mappers use to tag signs
 * accurately. The pictogram *drawings* in SignIcon.tsx are still hand-drawn
 * by us (not traced from an official source — see that file's header for
 * why), so treat the shapes as illustrative pending instructor review, but
 * the codes/names below are sourced, not guessed.
 *
 * Scope of this pass: categories A, B, C, D, E, G (the set a real CBR-theorie
 * exam actually draws from). J (waarschuwing, ~40 signs) and the small
 * F/H/K/L categories are a follow-up.
 */

export type SignCategory = "A" | "B" | "C" | "D" | "E" | "G";

export type SignCatalogueEntry = {
  code: string;
  name: string;
  category: SignCategory;
  /** true if this code needs a number appended, e.g. "A1-50" */
  numeric?: boolean;
};

export const SIGN_CATALOGUE: SignCatalogueEntry[] = [
  // --- A: Snelheid ---------------------------------------------------------
  { code: "A1", name: "Maximumsnelheid", category: "A", numeric: true },
  { code: "A1zone", name: "Maximumsnelheid zone", category: "A", numeric: true },
  { code: "A2", name: "Einde maximumsnelheid", category: "A", numeric: true },
  { code: "A2zone", name: "Einde maximumsnelheid zone", category: "A", numeric: true },
  { code: "A4", name: "Adviessnelheid", category: "A", numeric: true },
  { code: "A5", name: "Einde adviessnelheid", category: "A" },

  // --- B: Voorrang -----------------------------------------------------------
  { code: "B1", name: "Voorrangsweg", category: "B" },
  { code: "B2", name: "Einde voorrangsweg", category: "B" },
  { code: "B3", name: "Voorrangskruispunt", category: "B" },
  { code: "B4", name: "Voorrangskruispunt — zijweg links", category: "B" },
  { code: "B5", name: "Voorrangskruispunt — zijweg rechts", category: "B" },
  { code: "B6", name: "Verleen voorrang aan bestuurders op de kruisende weg", category: "B" },
  { code: "B7", name: "Stop — verleen voorrang aan bestuurders op de kruisende weg", category: "B" },

  // --- C: Geslotenverklaring (verbod) -----------------------------------------
  { code: "C1", name: "Gesloten in beide richtingen voor voertuigen", category: "C" },
  { code: "C2", name: "Eenrichtingsweg — gesloten voor voertuigen in deze richting", category: "C" },
  { code: "C3", name: "Eenrichtingsweg", category: "C" },
  { code: "C4", name: "Eenrichtingsweg", category: "C" },
  { code: "C5", name: "Inrijden toegestaan", category: "C" },
  { code: "C6", name: "Gesloten voor motorvoertuigen op meer dan twee wielen", category: "C" },
  { code: "C7", name: "Gesloten voor vrachtauto's", category: "C" },
  { code: "C7a", name: "Gesloten voor autobussen", category: "C" },
  { code: "C9", name: "Gesloten voor ruiters, vee, wagens en andere voertuigen", category: "C" },
  { code: "C11", name: "Gesloten voor motorfietsen", category: "C" },
  { code: "C12", name: "Gesloten voor alle motorvoertuigen", category: "C" },
  { code: "C13", name: "Gesloten voor bromfietsen, snorfietsen en gehandicaptenvoertuigen", category: "C" },
  { code: "C14", name: "Gesloten voor fietsen en gehandicaptenvoertuigen zonder motor", category: "C" },
  { code: "C15", name: "Gesloten voor fietsen, bromfietsen en gehandicaptenvoertuigen", category: "C" },
  { code: "C16", name: "Gesloten voor voetgangers", category: "C" },
  { code: "C17", name: "Gesloten voor voertuigen langer dan aangegeven", category: "C", numeric: true },
  { code: "C18", name: "Gesloten voor voertuigen breder dan aangegeven", category: "C", numeric: true },
  { code: "C19", name: "Gesloten voor voertuigen hoger dan aangegeven", category: "C", numeric: true },
  { code: "C21", name: "Gesloten voor voertuigen zwaarder dan aangegeven", category: "C", numeric: true },

  // --- D: Rijrichting (gebod) --------------------------------------------------
  { code: "D1", name: "Rotonde — verplichte rijrichting", category: "D" },
  { code: "D2", name: "Gebod tot het voorbijgaan aan de aangegeven zijde", category: "D" },
  { code: "D3", name: "Bord mag aan beide zijden worden voorbijgegaan", category: "D" },
  { code: "D4", name: "Gebod tot het volgen van de rijrichting op het bord", category: "D" },
  { code: "D5", name: "Gebod tot het volgen van de rijrichting op het bord", category: "D" },
  { code: "D6", name: "Gebod tot het volgen van één van de rijrichtingen op het bord", category: "D" },
  { code: "D7", name: "Gebod tot het volgen van één van de rijrichtingen op het bord", category: "D" },

  // --- E: Parkeren en stilstaan --------------------------------------------------
  { code: "E1", name: "Parkeerverbod", category: "E" },
  { code: "E2", name: "Verbod stil te staan", category: "E" },
  { code: "E3", name: "Verbod fietsen en bromfietsen te plaatsen", category: "E" },
  { code: "E4", name: "Parkeergelegenheid", category: "E" },
  { code: "E5", name: "Taxistandplaats", category: "E" },
  { code: "E6", name: "Gehandicaptenparkeerplaats", category: "E" },
  { code: "E7", name: "Gelegenheid voor het laden en lossen van goederen", category: "E" },
  { code: "E8", name: "Parkeergelegenheid voor de aangegeven voertuigcategorie", category: "E" },
  { code: "E8c", name: "Parkeergelegenheid voor elektrische voertuigen", category: "E" },
  { code: "E9", name: "Parkeergelegenheid alleen voor vergunninghouders", category: "E" },
  { code: "E10", name: "Parkeerschijf-zone — parkeren met beperkte parkeertijd", category: "E" },
  { code: "E11", name: "Einde parkeerschijf-zone", category: "E" },
  { code: "E12", name: "Parkeergelegenheid overstappers openbaar vervoer", category: "E" },
  { code: "E13", name: "Parkeergelegenheid carpoolers", category: "E" },

  // --- G: Wegtype / verkeersdeelnemer -----------------------------------------
  { code: "G1", name: "Autosnelweg", category: "G" },
  { code: "G2", name: "Einde autosnelweg", category: "G" },
  { code: "G3", name: "Autoweg", category: "G" },
  { code: "G4", name: "Einde autoweg", category: "G" },
  { code: "G5", name: "Erf", category: "G" },
  { code: "G6", name: "Einde erf", category: "G" },
  { code: "G7", name: "Voetpad", category: "G" },
  { code: "G8", name: "Einde voetpad", category: "G" },
  { code: "G9", name: "Ruiterpad", category: "G" },
  { code: "G10", name: "Einde ruiterpad", category: "G" },
  { code: "G11", name: "Verplicht fietspad", category: "G" },
  { code: "G12", name: "Einde verplicht fietspad", category: "G" },
  { code: "G13", name: "Onverplicht fietspad", category: "G" },
  { code: "G14", name: "Einde onverplicht fietspad", category: "G" },
];

export const SIGN_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  SIGN_CATALOGUE.map((s) => [s.code, s.name])
);

export function baseCodeOf(signId: string): string {
  const dash = signId.indexOf("-");
  return dash === -1 ? signId : signId.slice(0, dash);
}

export function numberOf(signId: string): number | undefined {
  const dash = signId.indexOf("-");
  if (dash === -1) return undefined;
  const n = Number(signId.slice(dash + 1));
  return Number.isFinite(n) ? n : undefined;
}
