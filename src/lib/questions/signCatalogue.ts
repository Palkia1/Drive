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
  /** One-sentence practical meaning ("what does this mean for me as a driver"),
   *  distinct from `name` (the bord's official short label) — used as the
   *  answer text in the sign-recognition practice modes. */
  definition: string;
  /** true if this code needs a number appended, e.g. "A1-50" */
  numeric?: boolean;
};

export const SIGN_CATALOGUE: SignCatalogueEntry[] = [
  // --- A: Snelheid ---------------------------------------------------------
  { code: "A1", name: "Maximumsnelheid", category: "A", definition: "Je mag hier niet harder rijden dan de aangegeven snelheid.", numeric: true },
  { code: "A1-30zb", name: "Maximumsnelheid 30 zone — begin", category: "A", definition: "Vanaf hier begint een 30 km/h-zone; hier geldt overal maximaal 30 km/h tot het einde-bord." },
  { code: "A1-30ze", name: "Maximumsnelheid 30 zone — einde", category: "A", definition: "Hier eindigt de 30 km/h-zone; de normale maximumsnelheid voor dit type weg geldt weer." },
  { code: "A1-60zb", name: "Maximumsnelheid 60 zone — begin", category: "A", definition: "Vanaf hier begint een 60 km/h-zone; hier geldt overal maximaal 60 km/h tot het einde-bord." },
  { code: "A1-60ze", name: "Maximumsnelheid 60 zone — einde", category: "A", definition: "Hier eindigt de 60 km/h-zone; de normale maximumsnelheid voor dit type weg geldt weer." },
  { code: "A2", name: "Einde maximumsnelheid", category: "A", definition: "De eerder ingestelde maximumsnelheid eindigt hier; de normale snelheidslimiet voor dit wegtype geldt weer.", numeric: true },
  { code: "A3", name: "Maximumsnelheid op elektronisch signaleringsbord", category: "A", definition: "Op een elektronisch signaleringsbord boven de snelweg kan de maximumsnelheid variëren, bijvoorbeeld door drukte of werkzaamheden." },
  { code: "A4", name: "Adviessnelheid", category: "A", definition: "Dit geeft de geadviseerde (niet-verplichte) snelheid aan, bijvoorbeeld voor een scherpe bocht." },
  { code: "A5", name: "Einde adviessnelheid", category: "A", definition: "Hier eindigt het adviessnelheidstraject.", numeric: true },

  // --- B: Voorrang -----------------------------------------------------------
  { code: "B1", name: "Voorrangsweg", category: "B", definition: "Jij hebt op deze weg voorrang op al het verkeer van kruisende wegen, tenzij anders aangegeven." },
  { code: "B2", name: "Einde voorrangsweg", category: "B", definition: "De voorrangsweg eindigt hier; vanaf nu gelden de normale voorrangsregels weer." },
  { code: "B3", name: "Voorrangskruispunt", category: "B", definition: "Je nadert een kruispunt van gelijkwaardige wegen, extra aangeduid met dit bord — voorrang van rechts geldt." },
  { code: "B4", name: "Voorrangskruispunt — zijweg links", category: "B", definition: "Je nadert een kruispunt met een zijweg van links; let op verkeer dat van links kan komen." },
  { code: "B5", name: "Voorrangskruispunt — zijweg rechts", category: "B", definition: "Je nadert een kruispunt met een zijweg van rechts; let op verkeer dat van rechts kan komen (en dus voorrang heeft)." },
  { code: "B6", name: "Verleen voorrang aan bestuurders op de kruisende weg", category: "B", definition: "Je moet voorrang verlenen aan bestuurders op de kruisende weg, maar hoeft niet per se te stoppen als het veilig kan." },
  { code: "B7", name: "Stop — verleen voorrang aan bestuurders op de kruisende weg", category: "B", definition: "Je moet volledig stoppen en voorrang verlenen aan bestuurders op de kruisende weg, ook als er niemand aankomt." },

  // --- C: Geslotenverklaring (verbod) -----------------------------------------
  { code: "C1", name: "Gesloten in beide richtingen voor voertuigen", category: "C", definition: "Voor alle voertuigen is deze weg in beide richtingen gesloten (geen doorgang)." },
  { code: "C2", name: "Eenrichtingsweg — gesloten voor voertuigen in deze richting", category: "C", definition: "Deze weg is een eenrichtingsweg; inrijden vanaf deze kant is verboden." },
  { code: "C3", name: "Eenrichtingsweg", category: "C", definition: "Dit geeft aan dat de weg een eenrichtingsweg is en in welke richting het verkeer mag rijden." },
  { code: "C4L", name: "Eenrichtingsweg — bocht naar links", category: "C", definition: "De eenrichtingsweg maakt hier een bocht naar links." },
  { code: "C4R", name: "Eenrichtingsweg — bocht naar rechts", category: "C", definition: "De eenrichtingsweg maakt hier een bocht naar rechts." },
  { code: "C5", name: "Inrijden toegestaan", category: "C", definition: "Inrijden is hier toegestaan, ook al lijkt het vanaf een andere kant een eenrichtingsweg." },
  { code: "C6", name: "Gesloten voor motorvoertuigen op meer dan twee wielen", category: "C", definition: "Motorvoertuigen met meer dan twee wielen (zoals auto's) mogen deze weg niet op." },
  { code: "C7", name: "Gesloten voor vrachtauto's", category: "C", definition: "Vrachtauto's mogen deze weg niet op." },
  { code: "C7a", name: "Gesloten voor autobussen", category: "C", definition: "Autobussen mogen deze weg niet op." },
  { code: "C8", name: "Gesloten voor landbouw- en bosbouwtrekkers", category: "C", definition: "Landbouw- en bosbouwtrekkers mogen deze weg niet op." },
  { code: "C9", name: "Gesloten voor ruiters, vee, wagens en andere voertuigen", category: "C", definition: "Ruiters, vee, wagens en andere niet-gemotoriseerde voertuigen mogen deze weg niet op." },
  { code: "C10", name: "Gesloten voor motorvoertuigen met aanhangwagen", category: "C", definition: "Motorvoertuigen met een aanhangwagen mogen deze weg niet op." },
  { code: "C11", name: "Gesloten voor motorfietsen", category: "C", definition: "Motorfietsen mogen deze weg niet op." },
  { code: "C12", name: "Gesloten voor alle motorvoertuigen", category: "C", definition: "Alle motorvoertuigen mogen deze weg niet op." },
  { code: "C13", name: "Gesloten voor bromfietsen, snorfietsen en gehandicaptenvoertuigen", category: "C", definition: "Bromfietsen, snorfietsen en gehandicaptenvoertuigen mogen deze weg niet op." },
  { code: "C14", name: "Gesloten voor fietsen en gehandicaptenvoertuigen zonder motor", category: "C", definition: "Fietsen en gehandicaptenvoertuigen zonder motor mogen deze weg niet op." },
  { code: "C15", name: "Gesloten voor fietsen, bromfietsen en gehandicaptenvoertuigen", category: "C", definition: "Fietsen, bromfietsen en gehandicaptenvoertuigen mogen deze weg niet op." },
  { code: "C16", name: "Gesloten voor voetgangers", category: "C", definition: "Voetgangers mogen deze weg niet op." },
  { code: "C17", name: "Gesloten voor voertuigen langer dan aangegeven", category: "C", definition: "Voertuigen langer dan de aangegeven lengte mogen niet verder." },
  { code: "C18", name: "Gesloten voor voertuigen breder dan aangegeven", category: "C", definition: "Voertuigen breder dan de aangegeven breedte mogen niet verder." },
  { code: "C19", name: "Gesloten voor voertuigen hoger dan aangegeven", category: "C", definition: "Voertuigen hoger dan de aangegeven hoogte mogen niet verder." },
  { code: "C20", name: "Gesloten voor voertuigen waarvan de aslast hoger is dan aangegeven", category: "C", definition: "Voertuigen met een hogere aslast dan aangegeven mogen niet verder." },
  { code: "C21", name: "Gesloten voor voertuigen zwaarder dan aangegeven", category: "C", definition: "Voertuigen zwaarder dan het aangegeven gewicht mogen niet verder." },
  { code: "C22", name: "Gesloten voor het vervoer van bepaalde gevaarlijke stoffen", category: "C", definition: "Het vervoer van bepaalde gevaarlijke stoffen is hier verboden." },
  { code: "C23-01", name: "Spitsstrook open", category: "C", definition: "De spitsstrook is op dit moment open voor gebruik." },
  { code: "C23-02", name: "Spitsstrook wordt binnenkort gesloten — rijstrook vrijmaken", category: "C", definition: "De spitsstrook gaat binnenkort dicht; maak deze rijstrook tijdig vrij." },
  { code: "C23-03", name: "Einde spitsstrook", category: "C", definition: "De spitsstrook eindigt hier." },

  // --- D: Rijrichting (gebod) --------------------------------------------------
  { code: "D1", name: "Rotonde — verplichte rijrichting", category: "D", definition: "Op deze rotonde moet je de rijrichting van de pijl volgen." },
  { code: "D2", name: "Gebod tot het voorbijgaan aan de aangegeven zijde", category: "D", definition: "Je moet dit object (bijvoorbeeld een verkeerseiland) voorbijgaan aan de kant die de pijl aangeeft." },
  { code: "D3", name: "Bord mag aan beide zijden worden voorbijgegaan", category: "D", definition: "Je mag dit object aan beide kanten voorbijgaan." },
  { code: "D4", name: "Gebod tot het volgen van de rijrichting op het bord", category: "D", definition: "Je bent verplicht de rijrichting te volgen die het bord aangeeft (bijvoorbeeld rechtdoor)." },
  { code: "D5", name: "Gebod tot het volgen van de rijrichting op het bord", category: "D", definition: "Je bent verplicht de rijrichting te volgen die het bord aangeeft (bijvoorbeeld schuin afslaan)." },
  { code: "D6", name: "Gebod tot het volgen van één van de rijrichtingen op het bord", category: "D", definition: "Je bent verplicht één van de twee aangegeven rijrichtingen te volgen." },
  { code: "D7", name: "Gebod tot het volgen van één van de rijrichtingen op het bord", category: "D", definition: "Je bent verplicht één van de twee aangegeven rijrichtingen te volgen." },

  // --- E: Parkeren en stilstaan --------------------------------------------------
  { code: "E1", name: "Parkeerverbod", category: "E", definition: "Hier mag je niet parkeren." },
  { code: "E2", name: "Verbod stil te staan", category: "E", definition: "Hier mag je niet stilstaan, ook niet even om iemand te laten in- of uitstappen." },
  { code: "E3", name: "Verbod fietsen en bromfietsen te plaatsen", category: "E", definition: "Hier mogen geen fietsen of bromfietsen worden neergezet." },
  { code: "E4", name: "Parkeergelegenheid", category: "E", definition: "Hier is een parkeergelegenheid." },
  { code: "E5", name: "Taxistandplaats", category: "E", definition: "Hier is een standplaats gereserveerd voor taxi's." },
  { code: "E6", name: "Gehandicaptenparkeerplaats", category: "E", definition: "Hier is een parkeerplaats gereserveerd voor gehandicapten." },
  { code: "E7", name: "Gelegenheid voor het laden en lossen van goederen", category: "E", definition: "Hier mogen goederen worden geladen en gelost." },
  { code: "E8", name: "Parkeergelegenheid voor de aangegeven voertuigcategorie", category: "E", definition: "Hier mag alleen de aangegeven voertuigcategorie parkeren." },
  { code: "E8c", name: "Parkeergelegenheid voor elektrische voertuigen", category: "E", definition: "Hier mogen alleen elektrische voertuigen parkeren (vaak met oplaadpunt)." },
  { code: "E9", name: "Parkeergelegenheid alleen voor vergunninghouders", category: "E", definition: "Hier mag alleen geparkeerd worden door mensen met een vergunning." },
  { code: "E10", name: "Parkeerschijf-zone — parkeren met beperkte parkeertijd", category: "E", definition: "Hier geldt een parkeerschijfzone: je mag beperkt lang parkeren, aan te geven met een parkeerschijf." },
  { code: "E11", name: "Einde parkeerschijf-zone", category: "E", definition: "De parkeerschijfzone eindigt hier." },
  { code: "E12", name: "Parkeergelegenheid overstappers openbaar vervoer", category: "E", definition: "Hier is een parkeerplaats voor mensen die overstappen op het openbaar vervoer." },
  { code: "E13", name: "Parkeergelegenheid carpoolers", category: "E", definition: "Hier is een parkeerplaats gereserveerd voor carpoolers." },

  // --- F: Overige geboden en verboden -----------------------------------------
  { code: "F1", name: "Verbod motorvoertuigen in te halen", category: "F", definition: "Motorvoertuigen mogen elkaar hier niet inhalen." },
  { code: "F2", name: "Einde verbod voor motorvoertuigen om elkaar onderling in te halen", category: "F", definition: "Het inhaalverbod voor motorvoertuigen eindigt hier." },
  { code: "F3", name: "Verbod voor vrachtauto's om motorvoertuigen in te halen", category: "F", definition: "Vrachtauto's mogen andere motorvoertuigen hier niet inhalen." },
  { code: "F4", name: "Einde verbod voor vrachtauto's om motorvoertuigen in te halen", category: "F", definition: "Het inhaalverbod voor vrachtauto's eindigt hier." },
  { code: "F5", name: "Verbod door te rijden bij tegengesteld verkeer", category: "F", definition: "Je mag niet doorrijden als er tegemoetkomend verkeer nadert; je moet wachten." },
  { code: "F6", name: "Verkeer in tegengestelde richting heeft voorrang", category: "F", definition: "Tegemoetkomend verkeer heeft hier voorrang op jou." },
  { code: "F7", name: "Keerverbod", category: "F", definition: "Je mag hier niet keren." },
  { code: "F8", name: "Einde van alle door verkeersborden aangegeven verboden", category: "F", definition: "Alle eerder door verkeersborden aangegeven verboden eindigen hier." },
  { code: "F9", name: "Einde van alle op een elektronisch signaleringsbord aangegeven verboden", category: "F", definition: "Alle eerder op een elektronisch signaleringsbord aangegeven verboden eindigen hier." },
  { code: "F10", name: "Verboden toegang, in te vullen door wie of waarom", category: "F", definition: "Toegang is hier verboden; op een onderbord staat voor wie of waarom." },

  // --- G: Wegtype / verkeersdeelnemer -----------------------------------------
  { code: "G1", name: "Autosnelweg", category: "G", definition: "Je rijdt een autosnelweg op; hier gelden speciale snelwegregels." },
  { code: "G2", name: "Einde autosnelweg", category: "G", definition: "De autosnelweg eindigt hier." },
  { code: "G3", name: "Autoweg", category: "G", definition: "Je rijdt een autoweg op; hier gelden speciale regels (bijv. geen langzaam verkeer)." },
  { code: "G4", name: "Einde autoweg", category: "G", definition: "De autoweg eindigt hier." },
  { code: "G5", name: "Erf", category: "G", definition: "Je rijdt een erf (woonerf) op: stapvoets rijden, spelende kinderen mogelijk, voetgangers mogen de hele breedte gebruiken." },
  { code: "G6", name: "Einde erf", category: "G", definition: "Het erf eindigt hier." },
  { code: "G7", name: "Voetpad", category: "G", definition: "Dit is een voetpad; alleen voetgangers mogen hier lopen." },
  { code: "G8", name: "Einde voetpad", category: "G", definition: "Het voetpad eindigt hier." },
  { code: "G9", name: "Ruiterpad", category: "G", definition: "Dit is een ruiterpad, alleen bedoeld voor ruiters." },
  { code: "G10", name: "Einde ruiterpad", category: "G", definition: "Het ruiterpad eindigt hier." },
  { code: "G11", name: "Verplicht fietspad", category: "G", definition: "Dit is een verplicht fietspad: fietsers en bromfietsers moeten hier rijden, ander verkeer mag er meestal niet op." },
  { code: "G12", name: "Einde verplicht fietspad", category: "G", definition: "Het verplichte fietspad eindigt hier." },
  { code: "G12a", name: "Fiets-/bromfietspad", category: "G", definition: "Dit is een pad voor zowel fietsers als bromfietsers." },
  { code: "G12b", name: "Einde fiets-/bromfietspad", category: "G", definition: "Het fiets-/bromfietspad eindigt hier." },
  { code: "G13", name: "Onverplicht fietspad", category: "G", definition: "Dit is een onverplicht fietspad: fietsers mogen het gebruiken, maar het is niet verplicht." },
  { code: "G14", name: "Einde onverplicht fietspad", category: "G", definition: "Het onverplichte fietspad eindigt hier." },

  // --- H: Bebouwde kom ---------------------------------------------------------
  { code: "H1", name: "Bebouwde kom", category: "H", definition: "Je rijdt de bebouwde kom in; vanaf hier geldt de standaard maximumsnelheid binnen de bebouwde kom (meestal 50 km/h, tenzij anders aangegeven)." },
  { code: "H2", name: "Einde bebouwde kom", category: "H", definition: "Je verlaat de bebouwde kom; de maximumsnelheid buiten de bebouwde kom gaat gelden." },

  // --- J: Waarschuwing ----------------------------------------------------------
  { code: "J1", name: "Slecht wegdek", category: "J", definition: "Waarschuwing: het wegdek is hier in slechte staat." },
  { code: "J2", name: "Bocht naar rechts", category: "J", definition: "Waarschuwing: de weg maakt een bocht naar rechts." },
  { code: "J3", name: "Bocht naar links", category: "J", definition: "Waarschuwing: de weg maakt een bocht naar links." },
  { code: "J4", name: "S-bocht(en), eerst naar rechts", category: "J", definition: "Waarschuwing: er komen meerdere bochten (S-bocht), waarvan de eerste naar rechts gaat." },
  { code: "J5", name: "S-bocht(en), eerst naar links", category: "J", definition: "Waarschuwing: er komen meerdere bochten (S-bocht), waarvan de eerste naar links gaat." },
  { code: "J6", name: "Steile helling omhoog", category: "J", definition: "Waarschuwing: een steile helling omhoog." },
  { code: "J7", name: "Steile helling omlaag", category: "J", definition: "Waarschuwing: een steile helling omlaag." },
  { code: "J8", name: "Gevaarlijk kruispunt (van gelijkwaardige wegen)", category: "J", definition: "Waarschuwing: een gevaarlijk kruispunt van gelijkwaardige wegen (voorrang van rechts geldt)." },
  { code: "J9", name: "Rotonde", category: "J", definition: "Waarschuwing: er komt een rotonde aan." },
  { code: "J10", name: "Overweg met slagbomen", category: "J", definition: "Waarschuwing: er komt een spoorwegovergang met slagbomen." },
  { code: "J11", name: "Overweg zonder slagbomen", category: "J", definition: "Waarschuwing: er komt een spoorwegovergang zonder slagbomen; wees extra alert." },
  { code: "J14", name: "Tram(kruising)", category: "J", definition: "Waarschuwing: er komt een tramkruising of -baan." },
  { code: "J15", name: "Beweegbare brug", category: "J", definition: "Waarschuwing: er komt een beweegbare brug, mogelijk met wachttijd." },
  { code: "J16", name: "Werk in uitvoering", category: "J", definition: "Waarschuwing: er zijn werkzaamheden aan de weg." },
  { code: "J17", name: "Rijbaanversmalling", category: "J", definition: "Waarschuwing: de rijbaan versmalt." },
  { code: "J18", name: "Rijbaanversmalling rechts", category: "J", definition: "Waarschuwing: de rijbaan versmalt aan de rechterkant." },
  { code: "J19", name: "Rijbaanversmalling links", category: "J", definition: "Waarschuwing: de rijbaan versmalt aan de linkerkant." },
  { code: "J20", name: "Slipgevaar", category: "J", definition: "Waarschuwing: kans op slippen, bijvoorbeeld door een glad wegdek." },
  { code: "J21", name: "Kinderen", category: "J", definition: "Waarschuwing: hier kunnen kinderen plotseling oversteken, bijvoorbeeld bij een school." },
  { code: "J22", name: "Voetgangersoversteekplaats", category: "J", definition: "Waarschuwing: er komt een voetgangersoversteekplaats." },
  { code: "J23", name: "Voetgangers", category: "J", definition: "Waarschuwing: hier kunnen voetgangers op de weg lopen of oversteken." },
  { code: "J24", name: "Fietsers en bromfietsers", category: "J", definition: "Waarschuwing: hier kunnen fietsers en bromfietsers de weg oversteken of naast je rijden." },
  { code: "J25", name: "Losliggende stenen (steenslag)", category: "J", definition: "Waarschuwing: losliggende stenen of steenslag op het wegdek." },
  { code: "J26", name: "Kade of rivieroever", category: "J", definition: "Waarschuwing: een kade of rivieroever zonder afscheiding." },
  { code: "J27", name: "Groot wild", category: "J", definition: "Waarschuwing: hier kan groot wild (zoals herten) oversteken." },
  { code: "J28", name: "Vee", category: "J", definition: "Waarschuwing: hier kan vee op de weg lopen." },
  { code: "J29", name: "Tegenliggers", category: "J", definition: "Waarschuwing: je kunt hier tegenliggers verwachten, bijvoorbeeld op een smalle weg." },
  { code: "J30", name: "Laagvliegende vliegtuigen", category: "J", definition: "Waarschuwing: laagvliegende vliegtuigen in de buurt van een vliegveld." },
  { code: "J31", name: "Zijwind", category: "J", definition: "Waarschuwing: gevaar voor plotselinge zijwind." },
  { code: "J32", name: "Verkeerslichten", category: "J", definition: "Waarschuwing: er komen verkeerslichten aan." },
  { code: "J33", name: "File", category: "J", definition: "Waarschuwing: kans op file verderop." },
  { code: "J34", name: "Ongeval", category: "J", definition: "Waarschuwing: er heeft hier een ongeval plaatsgevonden of kan plaatsvinden." },
  { code: "J35", name: "Slecht zicht door sneeuw, regen of mist", category: "J", definition: "Waarschuwing: slecht zicht door sneeuw, regen of mist." },
  { code: "J36", name: "IJzel of sneeuw", category: "J", definition: "Waarschuwing: kans op ijzel of sneeuw op het wegdek." },
  { code: "J37", name: "Gevaar (aard van het gevaar op onderbord)", category: "J", definition: "Waarschuwing voor een gevaar; het precieze soort gevaar staat op een onderbord." },
  { code: "J38", name: "Verkeersdrempel", category: "J", definition: "Waarschuwing: er ligt een verkeersdrempel; rem tijdig af." },
  { code: "J39", name: "Elektrische in- en uitschuifbare paal in de rijbaan", category: "J", definition: "Waarschuwing: een elektrisch in- en uitschuifbare paal kan de rijbaan blokkeren." },

  // --- L: Informatie -------------------------------------------------------------
  { code: "L1", name: "Hoogte onderdoorgang (actuele vrije hoogte)", category: "L", definition: "Dit bord toont de actuele (verminderde) vrije hoogte onder een brug of viaduct." },
  { code: "L2", name: "Voetgangersoversteekplaats", category: "L", definition: "Dit geeft een voetgangersoversteekplaats aan (zebrapad)." },
  { code: "L8", name: "Doodlopende weg", category: "L", definition: "Deze weg loopt dood; er is verderop geen doorgang." },
  { code: "L9", name: "Vooraanduiding doodlopende weg", category: "L", definition: "Vooraankondiging dat de weg verderop doodloopt." },
  { code: "L10", name: "Vooraanduiding verkeersmaatregel voor de aangegeven richting", category: "L", definition: "Vooraankondiging van een verkeersmaatregel die voor de aangegeven richting geldt." },
  { code: "L11", name: "Bord geldt alleen voor de aangegeven rijstroken", category: "L", definition: "Dit bord geldt alleen voor de aangegeven rijstroken." },
  { code: "L12", name: "Bord geldt alleen voor de aangegeven rijstrook", category: "L", definition: "Dit bord geldt alleen voor de aangegeven rijstrook." },
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
