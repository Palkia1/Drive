/**
 * Seed script — realistic-but-illustrative Dutch B-theory content.
 *
 * IMPORTANT: this content is written to exercise the app end-to-end (correct
 * question types, plausible topics, sensible explanations). It has NOT been
 * reviewed by a certified rijschool/CBR content editor and must not be
 * treated as exam-accurate. Per the product brief (§42), real content needs
 * a dedicated editorial process before this ships to actual students.
 */
import { PrismaClient, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import type {
  IntersectionHotspotScene,
  MultipleChoiceScene,
  SignStripHotspotScene,
  SingleChoiceScene,
} from "../src/lib/questions/types";
import { generateSignQuestions } from "../src/lib/questions/generateSignQuestions";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

// Verlichting and Stoppen-en-parkeren were folded into Veiligheid and
// Bijzondere manoeuvres respectively (too many near-empty top-level topics
// for a student to scan); Milieu was dropped entirely as out of scope.
const TOPICS = [
  { slug: "verkeersborden", name: "Verkeersborden", icon: "sign", order: 1 },
  { slug: "voorrang", name: "Voorrang", icon: "intersection", order: 2 },
  { slug: "snelheid", name: "Snelheid", icon: "speed", order: 3 },
  { slug: "plaats-op-de-weg", name: "Plaats op de weg", icon: "lane", order: 4 },
  { slug: "inhalen", name: "Inhalen", icon: "overtake", order: 5 },
  { slug: "bijzondere-manoeuvres", name: "Bijzondere manoeuvres", icon: "maneuver", order: 6 },
  { slug: "weggebruikers", name: "Weggebruikers", icon: "pedestrian", order: 7 },
  { slug: "autosnelwegen", name: "Autosnelwegen", icon: "highway", order: 8 },
  { slug: "veiligheid", name: "Veiligheid", icon: "shield", order: 9 },
  { slug: "bord-naar-betekenis", name: "Bord → betekenis", icon: "sign", order: 10 },
  { slug: "betekenis-naar-bord", name: "Betekenis → bord", icon: "sign", order: 11 },
] as const;

const SUBTOPICS: Record<string, { slug: string; name: string }[]> = {
  voorrang: [
    { slug: "gelijkwaardige-kruispunten", name: "Gelijkwaardige kruispunten" },
    { slug: "rotondes", name: "Rotondes" },
    { slug: "voorrangsvoertuigen", name: "Voorrangsvoertuigen" },
  ],
  verkeersborden: [
    { slug: "gevaarsborden", name: "Gevaarsborden" },
    { slug: "verbodsborden", name: "Verbodsborden" },
    { slug: "gebodsborden", name: "Gebodsborden" },
    { slug: "aanwijzingsborden", name: "Aanwijzingsborden" },
  ],
};

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

type SeedQuestion = {
  topic: string;
  /** Extra topic slugs this question also counts toward for mastery, beyond
   * `topic` (its primary topic) — e.g. a question that's really about both
   * voorrang and weggebruikers. Optional and rarely used today; the
   * question-selection pools (Snel oefenen, Onderwerp kiezen, ...) still key
   * off the single primary `topic`, only mastery-crediting reads this. */
  secondaryTopics?: string[];
  subtopic?: string;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  explanation: string;
  scene: SingleChoiceScene | MultipleChoiceScene | IntersectionHotspotScene | SignStripHotspotScene;
};

const QUESTIONS: SeedQuestion[] = [
  // ---- Voorrang -----------------------------------------------------------
  {
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Wie heeft hier voorrang?",
    explanation:
      "Op een kruispunt zonder verkeersborden of verkeerslichten geldt: bestuurders van rechts hebben voorrang.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: null,
      actors: [
        { slot: "south", kind: "car", color: "var(--sign-blue)", facing: "straight" },
        { slot: "west", kind: "car", color: "var(--sign-red)", facing: "straight" },
      ],
      correctSlot: "west",
      question: "Wie heeft hier voorrang?",
    },
  },
  {
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Op een kruispunt zonder borden of verkeerslichten heeft voorrang:",
    explanation: "Dit is de basisregel 'voorrang van rechts' voor gelijkwaardige kruispunten.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "De bestuurder die het eerst arriveert" },
        { id: "b", label: "De bestuurder die van rechts komt" },
        { id: "c", label: "De bestuurder die rechtdoor rijdt" },
        { id: "d", label: "De grootste voertuig" },
      ],
      correctOptionId: "b",
    },
  },
  {
    topic: "voorrang",
    subtopic: "rotondes",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Je nadert een rotonde binnen de bebouwde kom zonder haaientanden voor de fietsers op de rotonde. Wat betekent dit?",
    explanation:
      "Ontbreken haaientanden bij de fietsoversteek van een rotonde, dan hebben fietsers op de rotonde voorrang op het gemotoriseerd verkeer dat de rotonde op- of afrijdt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Fietsers op de rotonde hebben voorrang" },
        { id: "b", label: "Fietsers op de rotonde moeten altijd voorrang verlenen" },
        { id: "c", label: "Er zijn geen fietsers toegestaan op deze rotonde" },
        { id: "d", label: "Voorrang hangt af van de kleur van de fiets" },
      ],
      correctOptionId: "a",
    },
  },
  {
    topic: "voorrang",
    subtopic: "voorrangsvoertuigen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een ambulance nadert met blauw zwaailicht én sirene. Wat doe je?",
    explanation:
      "Optische én geluidssignalen samen betekenen dat je verplicht bent voorrang te verlenen, ook als de verkeersregels normaal anders zouden zeggen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ik verleen direct voorrang en maak zo nodig ruimte" },
        { id: "b", label: "Ik houd me aan de normale voorrangsregels" },
        { id: "c", label: "Ik stopt alleen als ik zelf voorrang heb" },
        { id: "d", label: "Ik negeer het signaal als ik al op de rotonde rijd" },
      ],
      correctOptionId: "a",
    },
  },
  {
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 3,
    prompt: "Jij komt van de zijweg zonder bord, de ander rijdt op de voorrangsweg. Wie mag als eerst rijden?",
    explanation:
      "Het bord 'voorrangsweg' geeft je voorrang op alle kruisende wegen, ongeacht de richting waaruit het andere verkeer komt.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: "priority-road",
      actors: [
        { slot: "north", kind: "car", color: "var(--sign-blue)", facing: "straight" },
        { slot: "east", kind: "car", color: "var(--sign-red)", facing: "straight" },
      ],
      correctSlot: "north",
      question: "Wie mag als eerst rijden?",
    },
  },

  // ---- Verkeersborden -------------------------------------------------------
  {
    topic: "verkeersborden",
    subtopic: "gebodsborden",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Welk bord betekent 'verplicht voorrang verlenen aan bestuurders op de kruisende weg'?",
    explanation: "Het driehoekige bord met de punt naar beneden is het 'verleen voorrang'-bord.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Stopbord", signId: "B7" },
        { id: "b", label: "Verleen voorrang", signId: "B6" },
        { id: "c", label: "Voorrangsweg", signId: "B1" },
        { id: "d", label: "Rotonde", signId: "D1" },
      ],
      correctOptionId: "b",
    },
  },
  {
    topic: "verkeersborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Tik op het bord 'einde voorrangsweg'.",
    explanation:
      "Het bord met de diagonale streep door het voorrangswegsymbool geeft aan dat de voorrangsweg hier eindigt.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "sign-strip",
      signs: ["B6", "B1", "B2", "B7"],
      correctSignId: "B2",
    },
  },
  {
    topic: "verkeersborden",
    subtopic: "verbodsborden",
    type: "MULTIPLE_CHOICE",
    difficulty: 3,
    prompt: "Welke van deze borden verbieden iets (rood/wit, verbodsborden)?",
    explanation:
      "Verbodsborden zijn rond met een rode rand. 'Geen toegang' en 'inhaalverbod' zijn verbodsborden; de andere twee geven juist een gebod of aanwijzing.",
    scene: {
      kind: "MULTIPLE_CHOICE",
      options: [
        { id: "a", label: "Geslotenverklaring / geen toegang", signId: "C1" },
        { id: "b", label: "Verboden in te halen (motorvoertuigen)", signId: "F1" },
        { id: "c", label: "Verplicht rechtdoor", signId: "D4" },
        { id: "d", label: "Voetgangersoversteekplaats", signId: "L2" },
      ],
      correctOptionIds: ["a", "b"],
    },
  },
  {
    topic: "verkeersborden",
    subtopic: "gebodsborden",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Een blauw, rond bord met een fiets erop betekent meestal:",
    explanation: "Blauwe ronde borden zijn gebodsborden: ze verplichten iets, hier het gebruik van het fietspad.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Verplicht fietspad" },
        { id: "b", label: "Fietsen verboden" },
        { id: "c", label: "Fietsenstalling" },
        { id: "d", label: "Fietsverhuur" },
      ],
      correctOptionId: "a",
    },
  },
  {
    topic: "verkeersborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Tik op het bord dat een maximumsnelheid van 30 km/h aangeeft.",
    explanation: "Snelheidsborden zijn rond, wit met rode rand en tonen het getal in km/h.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "sign-strip",
      signs: ["A1-50", "A1-30", "A1-80", "A2-50"],
      correctSignId: "A1-30",
    },
  },

  // ---- Snelheid -------------------------------------------------------------
  {
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt binnen de bebouwde kom en er staat geen snelheidsbord. Welke maximumsnelheid geldt in principe?",
    explanation: "Binnen de bebouwde kom geldt zonder bord in principe 50 km/h, tenzij anders aangegeven (bijv. 30 km/h-zone).",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "30 km/h" },
        { id: "b", label: "50 km/h" },
        { id: "c", label: "80 km/h" },
        { id: "d", label: "Zoveel je zelf veilig acht" },
      ],
      correctOptionId: "b",
    },
  },
  {
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Bij slecht zicht door dichte mist moet je vooral je snelheid aanpassen op:",
    explanation:
      "Je moet altijd binnen de afstand kunnen stoppen die je vóór je kunt overzien — bij mist is dat vaak veel minder dan de geldende maximumsnelheid.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "De geldende maximumsnelheid, ongeacht het zicht" },
        { id: "b", label: "De snelheid van de auto voor je" },
        { id: "c", label: "De afstand die je voor je kunt overzien" },
        { id: "d", label: "Een vaste snelheid van 50 km/h" },
      ],
      correctOptionId: "c",
    },
  },

  // ---- Plaats op de weg -------------------------------------------------------
  {
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je wilt linksaf slaan op een weg met één rijstrook per richting. Waar ga je rijden vóór het afslaan?",
    explanation: "Voor links afslaan ga je zo veel mogelijk naar de linkerkant van jouw weghelft rijden, zodat je duidelijk je bedoeling toont en ruimte laat aan rechtdoorgaand verkeer.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zo veel mogelijk naar links op mijn weghelft" },
        { id: "b", label: "Zo veel mogelijk naar rechts" },
        { id: "c", label: "In het midden van de weg blijven" },
        { id: "d", label: "Het maakt niet uit" },
      ],
      correctOptionId: "a",
    },
  },
  {
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Op een weg met een doorgetrokken en een onderbroken streep naast elkaar (jij rijdt aan de kant van de onderbroken streep) mag je:",
    explanation: "Je mag de streep die het dichtst bij jou ligt gebruiken om te bepalen of inhalen mag: onderbroken aan jouw kant betekent dat inhalen is toegestaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Inhalen, als het veilig kan" },
        { id: "b", label: "Nooit inhalen" },
        { id: "c", label: "Alleen inhalen bij daglicht" },
        { id: "d", label: "Alleen vrachtwagens inhalen" },
      ],
      correctOptionId: "a",
    },
  },

  // ---- Inhalen -------------------------------------------------------
  {
    topic: "inhalen",
    type: "MULTIPLE_CHOICE",
    difficulty: 3,
    prompt: "In welke situaties mag je niet inhalen?",
    explanation: "Bij onvoldoende zicht en vlak voor/op een voetgangersoversteekplaats is inhalen niet toegestaan, omdat je de situatie niet goed kunt overzien of voetgangers in gevaar kunt brengen.",
    scene: {
      kind: "MULTIPLE_CHOICE",
      options: [
        { id: "a", label: "Bij onvoldoende zicht op de weg (bijv. voor een bocht)" },
        { id: "b", label: "Vlak voor of op een voetgangersoversteekplaats" },
        { id: "c", label: "Op een brede, rechte weg met goed zicht" },
        { id: "d", label: "Als de bestuurder voor je een fietser is" },
      ],
      correctOptionIds: ["a", "b"],
    },
  },
  {
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je haalt een fietser in. Hoeveel zijdelingse afstand houd je minimaal aan buiten de bebouwde kom?",
    explanation: "Buiten de bebouwde kom wordt minimaal ongeveer 1,5 meter zijdelingse afstand als vuistregel aangehouden bij het inhalen van fietsers.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ongeveer 0,5 meter" },
        { id: "b", label: "Ongeveer 1,5 meter" },
        { id: "c", label: "Ongeveer 3 meter" },
        { id: "d", label: "Afstand maakt niet uit zolang je toetert" },
      ],
      correctOptionId: "b",
    },
  },

  // ---- Bijzondere manoeuvres -------------------------------------------------------
  {
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt achteruit een parkeervak in vanaf de weg. Wie moet voorrang verlenen?",
    explanation: "Bij een bijzondere manoeuvre (zoals achteruitrijden, wegrijden, keren) moet jij als bestuurder het overige verkeer voorrang verlenen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ik verleen voorrang aan het overige verkeer" },
        { id: "b", label: "Het overige verkeer moet mij voorrang verlenen" },
        { id: "c", label: "Voorrang van rechts is van toepassing" },
        { id: "d", label: "Wie het eerst toetert heeft voorrang" },
      ],
      correctOptionId: "a",
    },
  },

  // ---- Weggebruikers -------------------------------------------------------
  {
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Een bromfietser rijdt op een weg zonder bromfietspad. Waar hoort deze te rijden?",
    explanation: "Zonder apart bromfietspad rijdt een bromfietser op de rijbaan, net als een auto (tenzij lokale regels anders bepalen).",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Op de rijbaan" },
        { id: "b", label: "Altijd op het fietspad" },
        { id: "c", label: "Altijd op het trottoir" },
        { id: "d", label: "Waar het het beste uitkomt" },
      ],
      correctOptionId: "a",
    },
  },
  {
    topic: "weggebruikers",
    // Proof of concept for multi-topic crediting (see SeedQuestion.secondaryTopics
    // below): this question is as much about voorrang as it is about
    // weggebruikers, so a correct/incorrect answer should move the needle on
    // both — not force a single "which bucket does this belong to" choice.
    secondaryTopics: ["voorrang"],
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Een voetganger steekt over op de voetgangersoversteekplaats. Wie moet hier voorrang verlenen?",
    explanation: "Bestuurders moeten voetgangers die zich al op een voetgangersoversteekplaats bevinden of duidelijk op het punt staan over te steken, voor laten gaan.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: null,
      actors: [
        { slot: "south", kind: "car", color: "var(--sign-blue)", facing: "straight" },
        { slot: "west", kind: "pedestrian", facing: "straight" },
      ],
      correctSlot: "south",
      question: "Wie moet hier voorrang verlenen?",
    },
  },

  // ---- Verlichting (ondergebracht bij Veiligheid) --------------------------
  {
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wanneer ben je verplicht je dimlicht (of daglicht) te voeren?",
    explanation: "Bij dag is dagrijverlichting of dimlicht verplicht voor motorvoertuigen; bij duisternis, mist of ander slecht zicht is dimlicht sowieso verplicht.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Altijd, zowel overdag als 's nachts" },
        { id: "b", label: "Alleen 's nachts" },
        { id: "c", label: "Alleen bij regen" },
        { id: "d", label: "Nooit verplicht in een auto" },
      ],
      correctOptionId: "a",
    },
  },

  // ---- Stoppen en parkeren (ondergebracht bij Bijzondere manoeuvres) -------
  {
    topic: "bijzondere-manoeuvres",
    type: "MULTIPLE_CHOICE",
    difficulty: 2,
    prompt: "Waar mag je in principe niet parkeren?",
    explanation: "Op een kruispunt en binnen 5 meter van een voetgangersoversteekplaats is parkeren niet toegestaan, om zicht en doorstroming te waarborgen.",
    scene: {
      kind: "MULTIPLE_CHOICE",
      options: [
        { id: "a", label: "Op een kruispunt" },
        { id: "b", label: "Binnen 5 meter van een voetgangersoversteekplaats" },
        { id: "c", label: "In een vak met parkeerstreep" },
        { id: "d", label: "Op een parkeerterrein" },
      ],
      correctOptionIds: ["a", "b"],
    },
  },
  {
    topic: "bijzondere-manoeuvres",
    type: "HOTSPOT",
    difficulty: 1,
    prompt: "Tik op het bord dat 'verboden te parkeren' betekent.",
    explanation: "Het ronde bord met de blauwe achtergrond en rode diagonale streep is het parkeerverbod.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "sign-strip",
      signs: ["E2", "E1", "C3", "D4"],
      correctSignId: "E1",
    },
  },

  // ---- Autosnelwegen -------------------------------------------------------
  {
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat doe je normaal gesproken bij het invoegen op een autosnelweg via de invoegstrook?",
    explanation: "Je gebruikt de invoegstrook om je snelheid aan te passen aan het verkeer op de snelweg, en voegt in zodra dat veilig kan — het verkeer op de snelweg heeft voorrang.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Snelheid aanpassen en invoegen zodra het veilig kan" },
        { id: "b", label: "Meteen stoppen op de invoegstrook" },
        { id: "c", label: "Verwachten dat het verkeer op de snelweg voor mij stopt" },
        { id: "d", label: "Zo langzaam mogelijk invoegen" },
      ],
      correctOptionId: "a",
    },
  },

  // ---- Veiligheid -------------------------------------------------------
  {
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is het belangrijkste doel van de gordelplicht?",
    explanation: "De autogordel vermindert de kans op ernstig letsel bij een aanrijding aanzienlijk.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Het beperken van letsel bij een ongeval" },
        { id: "b", label: "Het voorkomen van boetes" },
        { id: "c", label: "Het verbeteren van het brandstofverbruik" },
        { id: "d", label: "Het is puur een wettelijke formaliteit zonder effect" },
      ],
      correctOptionId: "a",
    },
  },
  {
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de vuistregel voor een veilige volgafstand bij droog wegdek?",
    explanation: "De 'drie-secondenregel' (of twee seconden als absoluut minimum) is een bruikbare vuistregel om voldoende afstand te houden tot de auto voor je.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Minimaal 2 seconden volgtijd" },
        { id: "b", label: "Precies 1 autolengte, ongeacht snelheid" },
        { id: "c", label: "Afstand maakt niet uit bij droog weer" },
        { id: "d", label: "Zo dicht mogelijk om windkracht te besparen" },
      ],
      correctOptionId: "a",
    },
  },

  // ---- Overwegen (spoorwegkruisingen) ---------------------------------------
  {
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je nadert een overweg met een Andreaskruis, zonder slagbomen of verkeerslichten. Wat is de regel?",
    explanation:
      "Bij een overweg zonder slagbomen of verkeerslichten — herkenbaar aan het rood-witte Andreaskruis — verleen je altijd voorrang aan het spoorverkeer. Kijk en luister goed voor je oversteekt, ook als je geen trein ziet aankomen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ik heb altijd voorrang op de trein" },
        { id: "b", label: "Ik verleen altijd voorrang aan de trein", signId: "andreaskruis" },
        { id: "c", label: "Voorrang hangt af van wie er het eerst is" },
        { id: "d", label: "Alleen bij twee sporen moet ik voorrang verlenen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    topic: "verkeersborden",
    subtopic: "gevaarsborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Tik op het Andreaskruis — het teken dat pal bij de rails staat, niet de waarschuwing ervoor.",
    explanation:
      "De gele driehoeken (J10/J11) waarschuwen al eerder voor een overweg. Het Andreaskruis zelf staat direct bij de spoorstaven en geeft aan waar je moet stoppen als er een trein nadert.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "sign-strip",
      signs: ["J10", "J11", "andreaskruis", "L2"],
      correctSignId: "andreaskruis",
    },
  },
];

// ---------------------------------------------------------------------------
// Theory lessons (short, structured — see TheoryLesson.content)
// ---------------------------------------------------------------------------

const LESSONS: { topic: string; slug: string; title: string; blocks: unknown[] }[] = [
  {
    topic: "voorrang",
    slug: "voorrang-basis",
    title: "De basis van voorrang",
    blocks: [
      { type: "text", text: "Op de meeste kruisingen bepalen borden of verkeerslichten wie voorrang heeft. Is er niets aangegeven? Dan geldt: **voorrang van rechts**." },
      { type: "text", text: "Voertuigen met blauw zwaailicht én sirene gaan altijd voor, ook als de normale regels anders zeggen." },
      { type: "example", prompt: "Wie heeft hier voorrang?", hint: "Kijk goed van welke kant het andere verkeer komt." },
    ],
  },
  {
    topic: "verkeersborden",
    slug: "bordencategorieen",
    title: "De 4 hoofdcategorieën borden",
    blocks: [
      { type: "text", text: "Gevaarsborden (driehoek, gele achtergrond) waarschuwen voor gevaar vooruit." },
      { type: "text", text: "Verbodsborden (rond, rode rand) verbieden iets." },
      { type: "text", text: "Gebodsborden (rond, blauw) verplichten iets." },
      { type: "text", text: "Aanwijzingsborden (rechthoekig/vierkant, blauw) geven extra informatie, zoals een voorrangsweg of parkeergelegenheid." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const BADGES = [
  { code: "first_session", name: "Eerste stap", description: "Je eerste oefensessie voltooid.", icon: "flag", rarity: "common" },
  { code: "streak_7", name: "Week vol vuur", description: "7 dagen op rij geoefend.", icon: "flame", rarity: "common" },
  { code: "streak_30", name: "Maand vol vuur", description: "30 dagen op rij geoefend.", icon: "flame", rarity: "rare" },
  { code: "streak_100", name: "Onstopbaar", description: "100 dagen op rij geoefend.", icon: "flame", rarity: "epic" },
  { code: "hundred_correct", name: "Honderd raak", description: "100 vragen goed beantwoord.", icon: "target", rarity: "common" },
  { code: "perfect_session", name: "Feilloos", description: "Een sessie zonder fouten afgerond.", icon: "star", rarity: "rare" },
  { code: "exam_passed", name: "Geslaagd!", description: "Een oefenexamen gehaald.", icon: "trophy", rarity: "rare" },
  { code: "first_exam", name: "Examenrijp?", description: "Je eerste oefenexamen gemaakt.", icon: "clipboard", rarity: "common" },
];

// ---------------------------------------------------------------------------
// Seed run
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding category + topics...");
  const category = await prisma.category.upsert({
    where: { code: "B" },
    update: {},
    create: { code: "B", name: "Rijbewijs B (personenauto)", order: 1 },
  });

  const topicBySlug = new Map<string, string>();
  for (const t of TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, icon: t.icon, order: t.order },
      create: { ...t, categoryId: category.id },
    });
    topicBySlug.set(t.slug, topic.id);
  }

  const subtopicBySlug = new Map<string, string>();
  for (const [topicSlug, subs] of Object.entries(SUBTOPICS)) {
    const topicId = topicBySlug.get(topicSlug)!;
    let order = 1;
    for (const s of subs) {
      const sub = await prisma.subtopic.upsert({
        where: { slug: s.slug },
        update: { name: s.name, order },
        create: { ...s, topicId, order },
      });
      subtopicBySlug.set(s.slug, sub.id);
      order++;
    }
  }

  const allQuestions: SeedQuestion[] = [...QUESTIONS, ...generateSignQuestions()];
  console.log(`Seeding ${allQuestions.length} questions (${QUESTIONS.length} curated + ${allQuestions.length - QUESTIONS.length} generated sign-recognition)...`);
  for (const q of allQuestions) {
    const topicId = topicBySlug.get(q.topic);
    if (!topicId) throw new Error(`Unknown topic ${q.topic}`);
    const subtopicId = q.subtopic ? subtopicBySlug.get(q.subtopic) : undefined;
    const secondaryTopicIds = "secondaryTopics" in q && q.secondaryTopics?.length
      ? q.secondaryTopics.map((slug) => {
          const id = topicBySlug.get(slug);
          if (!id) throw new Error(`Unknown secondary topic ${slug}`);
          return id;
        })
      : undefined;
    await prisma.question.create({
      data: {
        topicId,
        subtopicId,
        secondaryTopicIds: secondaryTopicIds ? JSON.stringify(secondaryTopicIds) : undefined,
        type: q.type,
        difficulty: q.difficulty,
        prompt: q.prompt,
        explanation: q.explanation,
        scene: JSON.stringify(q.scene),
      },
    });
  }

  console.log(`Seeding ${LESSONS.length} theory lessons...`);
  for (const l of LESSONS) {
    const topicId = topicBySlug.get(l.topic)!;
    await prisma.theoryLesson.upsert({
      where: { slug: l.slug },
      update: { title: l.title, content: JSON.stringify(l.blocks) },
      create: { slug: l.slug, title: l.title, topicId, content: JSON.stringify(l.blocks) },
    });
  }

  console.log(`Seeding ${BADGES.length} badges...`);
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { code: b.code }, update: b, create: b });
  }

  console.log("Seeding demo accounts...");
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const owner = await prisma.user.upsert({
    where: { email: "instructeur@rijschooldeboer.nl" },
    update: {},
    create: {
      email: "instructeur@rijschooldeboer.nl",
      name: "Mevr. De Boer",
      role: "INSTRUCTOR",
      passwordHash,
    },
  });
  const school = await prisma.drivingSchool.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: { name: "Rijschool De Boer", code: "DB4K7P", ownerId: owner.id },
  });
  await prisma.license.upsert({
    where: { drivingSchoolId: school.id },
    update: {},
    create: { drivingSchoolId: school.id, seats: 25, plan: "standard" },
  });

  async function upsertStudent(email: string, name: string, username: string, friendCode: string, schoolId?: string) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role: "STUDENT", passwordHash },
    });
    return prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        username,
        friendCode,
        drivingSchoolId: schoolId,
        xp: 0,
        level: 1,
      },
    });
  }

  await upsertStudent("lucas@example.com", "Lucas", "lucasp", "LUCAS4821", school.id);
  await upsertStudent("fenna@example.com", "Fenna", "fenna_v", "FENNA1190", school.id);
  await upsertStudent("noah@example.com", "Noah", "noahdrives", "NOAH7723");

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
