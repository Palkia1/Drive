/**
 * Official Dutch traffic sign catalogue (RVV 1990, Bijlage 1).
 *
 * Codes and names are sourced from two places:
 *  - A/B/C/D/E/G: OpenStreetMap's NL traffic-sign reference (wiki.openstreetmap.org/
 *    wiki/NL:Overzicht_Nederlandse_Verkeersborden), which mirrors the legal annex
 *    and is what NL mappers use to tag signs accurately.
 *  - J/L: the same wiki's "Informerende RVV-borden" subpage, cross-checked for
 *    L9-L12 against driving-school reference sites (itheorie.nl) since that
 *    subpage only listed a handful of L-codes. L1 isn't on either OSM page;
 *    its name/purpose was confirmed via web search (CROW kennisbank +
 *    traffictotaal.nl product listing) — "Hoogte onderdoorgang", showing the
 *    actual (reduced) clearance height under a low structure.
 *  - F10/H1: also from the main OSM page; H1 ("Bebouwde kom") is simplified
 *    to one generic entry the same way H2 already was, even though the only
 *    supplied artwork for H1 bakes in a specific example place name
 *    ("Helmond") rather than being blank.
 *
 * Artwork: most signs below now render real, user-supplied vector art (see
 * public/signs/ and realSigns.generated.ts) rather than our hand-drawn
 * approximations — SignIcon.tsx falls back to a hand-drawn version only for
 * codes with no real file yet. Where a code has no real file, treat the
 * hand-drawn shape as illustrative pending instructor review.
 */

export type SignCategory = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "J" | "L";

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
  { code: "A1-30zb", name: "Maximumsnelheid 30 zone — begin", category: "A" },
  { code: "A1-30ze", name: "Maximumsnelheid 30 zone — einde", category: "A" },
  { code: "A1-60zb", name: "Maximumsnelheid 60 zone — begin", category: "A" },
  { code: "A1-60ze", name: "Maximumsnelheid 60 zone — einde", category: "A" },
  { code: "A2", name: "Einde maximumsnelheid", category: "A", numeric: true },
  { code: "A3", name: "Maximumsnelheid op elektronisch signaleringsbord", category: "A" },
  { code: "A4", name: "Adviessnelheid", category: "A" },
  { code: "A5", name: "Einde adviessnelheid", category: "A", numeric: true },

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
  { code: "C4L", name: "Eenrichtingsweg — bocht naar links", category: "C" },
  { code: "C4R", name: "Eenrichtingsweg — bocht naar rechts", category: "C" },
  { code: "C5", name: "Inrijden toegestaan", category: "C" },
  { code: "C6", name: "Gesloten voor motorvoertuigen op meer dan twee wielen", category: "C" },
  { code: "C7", name: "Gesloten voor vrachtauto's", category: "C" },
  { code: "C8", name: "Gesloten voor landbouw- en bosbouwtrekkers", category: "C" },
  { code: "C9", name: "Gesloten voor ruiters, vee, wagens en andere voertuigen", category: "C" },
  { code: "C10", name: "Gesloten voor motorvoertuigen met aanhangwagen", category: "C" },
  { code: "C11", name: "Gesloten voor motorfietsen", category: "C" },
  { code: "C12", name: "Gesloten voor alle motorvoertuigen", category: "C" },
  { code: "C13", name: "Gesloten voor bromfietsen, snorfietsen en gehandicaptenvoertuigen", category: "C" },
  { code: "C14", name: "Gesloten voor fietsen en gehandicaptenvoertuigen zonder motor", category: "C" },
  { code: "C15", name: "Gesloten voor fietsen, bromfietsen en gehandicaptenvoertuigen", category: "C" },
  { code: "C16", name: "Gesloten voor voetgangers", category: "C" },
  { code: "C17", name: "Gesloten voor voertuigen langer dan aangegeven", category: "C" },
  { code: "C18", name: "Gesloten voor voertuigen breder dan aangegeven", category: "C" },
  { code: "C19", name: "Gesloten voor voertuigen hoger dan aangegeven", category: "C" },
  { code: "C20", name: "Gesloten voor voertuigen waarvan de aslast hoger is dan aangegeven", category: "C" },
  { code: "C21", name: "Gesloten voor voertuigen zwaarder dan aangegeven", category: "C" },
  { code: "C22", name: "Gesloten voor het vervoer van bepaalde gevaarlijke stoffen", category: "C" },
  { code: "C23-01", name: "Spitsstrook open", category: "C" },
  { code: "C23-02", name: "Spitsstrook wordt binnenkort gesloten — rijstrook vrijmaken", category: "C" },
  { code: "C23-03", name: "Einde spitsstrook", category: "C" },

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

  // --- F: Overige geboden en verboden -----------------------------------------
  { code: "F1", name: "Verbod motorvoertuigen in te halen", category: "F" },
  { code: "F2", name: "Einde verbod voor motorvoertuigen om elkaar onderling in te halen", category: "F" },
  { code: "F3", name: "Verbod voor vrachtauto's om motorvoertuigen in te halen", category: "F" },
  { code: "F4", name: "Einde verbod voor vrachtauto's om motorvoertuigen in te halen", category: "F" },
  { code: "F5", name: "Verbod door te rijden bij tegengesteld verkeer", category: "F" },
  { code: "F6", name: "Verkeer in tegengestelde richting heeft voorrang", category: "F" },
  { code: "F7", name: "Keerverbod", category: "F" },
  { code: "F8", name: "Einde van alle door verkeersborden aangegeven verboden", category: "F" },
  { code: "F9", name: "Einde van alle op een elektronisch signaleringsbord aangegeven verboden", category: "F" },
  { code: "F10", name: "Verboden toegang, in te vullen door wie of waarom", category: "F" },

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
  { code: "G12a", name: "Fiets-/bromfietspad", category: "G" },
  { code: "G12b", name: "Einde fiets-/bromfietspad", category: "G" },
  { code: "G13", name: "Onverplicht fietspad", category: "G" },
  { code: "G14", name: "Einde onverplicht fietspad", category: "G" },

  // --- H: Bebouwde kom ---------------------------------------------------------
  { code: "H1", name: "Bebouwde kom", category: "H" },
  { code: "H2", name: "Einde bebouwde kom", category: "H" },

  // --- J: Waarschuwing ----------------------------------------------------------
  { code: "J1", name: "Slecht wegdek", category: "J" },
  { code: "J2", name: "Bocht naar rechts", category: "J" },
  { code: "J3", name: "Bocht naar links", category: "J" },
  { code: "J4", name: "S-bocht(en), eerst naar rechts", category: "J" },
  { code: "J5", name: "S-bocht(en), eerst naar links", category: "J" },
  { code: "J6", name: "Steile helling omhoog", category: "J" },
  { code: "J7", name: "Steile helling omlaag", category: "J" },
  { code: "J8", name: "Gevaarlijk kruispunt (van gelijkwaardige wegen)", category: "J" },
  { code: "J9", name: "Rotonde", category: "J" },
  { code: "J10", name: "Overweg met slagbomen", category: "J" },
  { code: "J11", name: "Overweg zonder slagbomen", category: "J" },
  { code: "J14", name: "Tram(kruising)", category: "J" },
  { code: "J15", name: "Beweegbare brug", category: "J" },
  { code: "J16", name: "Werk in uitvoering", category: "J" },
  { code: "J17", name: "Rijbaanversmalling", category: "J" },
  { code: "J18", name: "Rijbaanversmalling rechts", category: "J" },
  { code: "J19", name: "Rijbaanversmalling links", category: "J" },
  { code: "J20", name: "Slipgevaar", category: "J" },
  { code: "J21", name: "Kinderen", category: "J" },
  { code: "J22", name: "Voetgangersoversteekplaats", category: "J" },
  { code: "J23", name: "Voetgangers", category: "J" },
  { code: "J24", name: "Fietsers en bromfietsers", category: "J" },
  { code: "J25", name: "Losliggende stenen (steenslag)", category: "J" },
  { code: "J26", name: "Kade of rivieroever", category: "J" },
  { code: "J27", name: "Groot wild", category: "J" },
  { code: "J28", name: "Vee", category: "J" },
  { code: "J29", name: "Tegenliggers", category: "J" },
  { code: "J30", name: "Laagvliegende vliegtuigen", category: "J" },
  { code: "J31", name: "Zijwind", category: "J" },
  { code: "J32", name: "Verkeerslichten", category: "J" },
  { code: "J33", name: "File", category: "J" },
  { code: "J34", name: "Ongeval", category: "J" },
  { code: "J35", name: "Slecht zicht door sneeuw, regen of mist", category: "J" },
  { code: "J36", name: "IJzel of sneeuw", category: "J" },
  { code: "J37", name: "Gevaar (aard van het gevaar op onderbord)", category: "J" },
  { code: "J38", name: "Verkeersdrempel", category: "J" },
  { code: "J39", name: "Elektrische in- en uitschuifbare paal in de rijbaan", category: "J" },

  // --- L: Informatie -------------------------------------------------------------
  { code: "L1", name: "Hoogte onderdoorgang (actuele vrije hoogte)", category: "L" },
  { code: "L2", name: "Voetgangersoversteekplaats", category: "L" },
  { code: "L8", name: "Doodlopende weg", category: "L" },
  { code: "L9", name: "Vooraanduiding doodlopende weg", category: "L" },
  { code: "L10", name: "Vooraanduiding verkeersmaatregel voor de aangegeven richting", category: "L" },
  { code: "L11", name: "Bord geldt alleen voor de aangegeven rijstroken", category: "L" },
  { code: "L12", name: "Bord geldt alleen voor de aangegeven rijstrook", category: "L" },
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
