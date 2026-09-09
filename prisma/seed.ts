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
  GridHotspotScene,
  IntersectionHotspotScene,
  LocationHotspotScene,
  MultipleChoiceScene,
  RoundaboutHotspotScene,
  SignStripHotspotScene,
  SingleChoiceScene,
  TrafficLightHotspotScene,
} from "../src/lib/questions/types";
import { generateSignQuestions } from "../src/lib/questions/generateSignQuestions";
import { resolvePriority, type PriorityActor } from "../src/lib/questions/priority";
import { LOCATION_ACTOR_SLOTS } from "../src/lib/scenes/locationSlots.generated";
import type { LocationActor, LocationId } from "../src/lib/questions/types";

/** Derives each actor's PriorityActor (just its position bearing) straight
 * from the background's own slot manifest — same idea as GridActor already
 * carrying its bearing directly, so a LocationHotspotScene's `correctSlot`
 * is resolved from the real geometry instead of a bearing table re-typed
 * here that could quietly drift from the artwork. */
function locationPriorityActors(location: LocationId, actors: Pick<LocationActor, "id" | "slot">[]): PriorityActor[] {
  return actors.map((a) => {
    const bearing = LOCATION_ACTOR_SLOTS[location]?.[a.slot]?.bearing;
    if (bearing === undefined) throw new Error(`locationPriorityActors: no slot "${a.slot}" on location "${location}"`);
    return { id: a.id, bearing };
  });
}

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
  /** Stable identifier for hand-authored QUESTIONS entries only (absent on
   * procedurally-generated sign-recognition questions) — lets the
   * beta-tester portal's GitHub sync find and patch this exact entry's
   * source text after a live edit, so the edit survives the next reseed.
   * Assigned once by scripts/inject-seed-ids.ts; never reuse or renumber an
   * existing id. */
  seedId?: string;
  /** Set by a beta-tester's "Weggooien" — seeds as ARCHIVED (excluded from
   * practice) instead of the default PUBLISHED. Kept as text rather than
   * deleting the entry so the original content and history aren't lost. */
  archived?: boolean;
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
  scene:
    | SingleChoiceScene
    | MultipleChoiceScene
    | IntersectionHotspotScene
    | SignStripHotspotScene
    | TrafficLightHotspotScene
    | RoundaboutHotspotScene
    | LocationHotspotScene
    | GridHotspotScene;
};

const QUESTIONS: SeedQuestion[] = [
  // ---- Voorrang -----------------------------------------------------------
  {
    seedId: "sq-0001",
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt. Er staan geen borden. Wie mag als eerste rijden?",
    explanation:
      "Op een kruispunt zonder verkeersborden of verkeerslichten geldt: bestuurders van rechts hebben voorrang. Jij kijkt naar rechts en ziet de blauwe auto — die moet je voor laten gaan.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: null,
      actors: [
        { slot: "south", kind: "car", color: "var(--sign-blue)", facing: "straight" },
        { slot: "west", kind: "car", color: "var(--sign-red)", facing: "straight", self: true },
      ],
      // West-bound (red, "jij") driver looks to their right and sees the
      // south-bound (blue) car approaching — red must give way, so blue has
      // priority. (Previously set to "west" — backwards.)
      correctSlot: "south",
      question: "Wie mag als eerste rijden?",
    },
  },
  {
    seedId: "sq-0002",
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
    seedId: "sq-0003",
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
    seedId: "sq-0004",
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
    seedId: "sq-0005",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 3,
    prompt: "Je komt van de zijweg zonder bord. De andere auto rijdt op de voorrangsweg. Wie mag als eerst rijden?",
    explanation:
      "Het bord 'voorrangsweg' (bij de blauwe auto's weg) geeft voorrang op alle kruisende wegen, ongeacht de richting waaruit het andere verkeer komt.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: { kind: "priority-road", slot: "north" },
      actors: [
        { slot: "north", kind: "car", color: "var(--sign-blue)", facing: "straight" },
        { slot: "east", kind: "car", color: "var(--sign-red)", facing: "straight", self: true },
      ],
      correctSlot: "north",
      question: "Wie mag als eerst rijden?",
    },
  },
  {
    seedId: "sq-0006",
    topic: "voorrang",
    subtopic: "voorrangsborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je ziet het bord 'verleen voorrang'. De andere auto heeft geen bord. Wie mag als eerst rijden?",
    explanation:
      "Bord B6 ('verleen voorrang') verplicht je voorrang te geven aan bestuurders op de kruisende weg — je hoeft niet per se te stoppen, maar wel voorrang te verlenen.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: { kind: "give-way", slot: "south" },
      actors: [
        { slot: "south", kind: "car", color: "var(--sign-red)", facing: "straight", self: true },
        { slot: "east", kind: "car", color: "var(--sign-blue)", facing: "straight" },
      ],
      correctSlot: "east",
      question: "Wie mag als eerst rijden?",
    },
  },
  {
    seedId: "sq-0007",
    topic: "voorrang",
    subtopic: "voorrangsborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je moet stoppen voor een STOP-bord. De andere auto heeft geen bord. Wie mag als eerst rijden?",
    explanation:
      "Bord B7 (STOP) verplicht je te stoppen bij de stopstreep én voorrang te verlenen aan bestuurders op de kruisende weg — zelfs als er niemand aankomt.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: { kind: "stop", slot: "west" },
      actors: [
        { slot: "west", kind: "car", color: "var(--sign-red)", facing: "straight", self: true },
        { slot: "north", kind: "car", color: "var(--sign-blue)", facing: "straight" },
      ],
      correctSlot: "north",
      question: "Wie mag als eerst rijden?",
    },
  },
  {
    seedId: "sq-0008",
    topic: "voorrang",
    subtopic: "rotondes",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert deze rotonde. Wie mag als eerste rijden?",
    explanation:
      "Verkeer dat al op de rotonde rijdt heeft altijd voorrang op verkeer dat de rotonde op wil rijden — ook zonder bord.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "roundabout",
      armCount: 4,
      ringLanes: 1,
      actors: [
        { id: "you", arm: 0, position: "approaching", kind: "car", color: "var(--sign-red)", self: true },
        { id: "ring-car", arm: 0, position: "on-ring", kind: "car", color: "var(--sign-blue)" },
      ],
      correctSlot: "ring-car",
      question: "Wie mag als eerste rijden?",
    },
  },
  {
    seedId: "sq-0010",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt. Voor jou staat het verkeerslicht op groen. Voor de andere auto staat het licht op rood. Wie mag rijden?",
    explanation:
      "Een verkeerslicht gaat altijd vóór de normale voorrangsregels, zoals voorrang van rechts. Bij groen mag jij rijden; de bestuurder met rood moet wachten, ook als die normaal gesproken voorrang zou hebben.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "traffic-light-intersection",
      trafficLights: { north: "green", east: "red" },
      actors: [
        { slot: "north", kind: "car", color: "var(--sign-red)", facing: "straight", self: true },
        { slot: "east", kind: "car", color: "var(--sign-blue)", facing: "straight" },
      ],
      correctSlot: "north",
      question: "Wie mag rijden?",
    },
  },
  {
    seedId: "sq-0011",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert deze T-splitsing. Er staan geen borden. Wie mag als eerste rijden?",
    explanation:
      "Zonder borden geldt voorrang van rechts. De bestuurder die van rechts komt — hier de auto uit de zijstraat — heeft voorrang.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "location",
      location: "straat-van-rechts-stedelijk",
      actors: [
        { id: "you", slot: "south", kind: "car", color: "var(--sign-red)", self: true },
        { id: "side-street-car", slot: "east", kind: "car", color: "var(--sign-blue)" },
      ],
      correctSlot: "side-street-car",
      question: "Wie mag als eerste rijden?",
    },
  },
  {
    seedId: "sq-0012",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt vanaf de zijweg. Wie mag als eerste rijden?",
    explanation:
      "Haaientanden op het wegdek betekenen dat je voorrang moet verlenen aan het verkeer op de kruisende weg — ook zonder bord.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "location",
      location: "doorgaande-weg-twee-zijwegen-zonder-naad",
      actors: [
        { id: "you", slot: "north", kind: "car", color: "var(--sign-red)", self: true },
        { id: "through-road-car", slot: "west", kind: "car", color: "var(--sign-blue)" },
      ],
      correctSlot: "through-road-car",
      question: "Wie mag als eerste rijden?",
    },
  },
  {
    seedId: "sq-0013",
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt. Er staan geen borden of verkeerslichten. Wie mag als eerste rijden?",
    explanation:
      "Op een kruispunt zonder verkeersborden of verkeerslichten geldt: bestuurders van rechts hebben voorrang. Kijk naar rechts — de andere auto komt daarvandaan.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "location",
      location: "gelijkwaardige-kruising",
      actors: [
        { id: "you", slot: "north", kind: "car", color: "var(--sign-red)", self: true },
        { id: "other-car", slot: "east", kind: "car", color: "var(--sign-blue)" },
      ],
      correctSlot: "you",
      question: "Wie mag als eerste rijden?",
    },
  },
  {
    seedId: "sq-0014",
    topic: "voorrang",
    subtopic: "rotondes",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert deze rotonde. Wie mag als eerste rijden?",
    explanation:
      "Verkeer dat al op de rotonde rijdt heeft altijd voorrang op verkeer dat de rotonde op wil rijden — ook een vrachtwagen.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "location",
      location: "eenbaansrotonde",
      actors: [
        { id: "you", slot: "west", position: "approaching", kind: "car", color: "var(--sign-red)", self: true },
        { id: "ring-truck", slot: "west", position: "on-ring", kind: "truck", color: "var(--sign-blue)" },
      ],
      correctSlot: "ring-truck",
      question: "Wie mag als eerste rijden?",
    },
  },
  {
    seedId: "sq-0015",
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Voor jou staat dit verkeerslicht. Wat moet je doen?",
    explanation:
      "Rood licht betekent altijd stoppen, ook als de weg leeg lijkt. Je mag pas verder rijden als het licht op groen springt.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptImageUrl: "/scenes/stoplicht-rood-losse-ringen.svg",
      options: [
        { id: "a", label: "Doorrijden als de weg vrij lijkt" },
        { id: "b", label: "Stoppen en wachten tot het licht op groen springt" },
        { id: "c", label: "Voorzichtig doorrijden, maar wel voorrang verlenen" },
        { id: "d", label: "Alleen stoppen als er een politieagent aanwezig is" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0016",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt. Wie mag rijden?",
    explanation:
      "Bij rood licht moet jij altijd stoppen, ongeacht de voorrangssituatie. De andere bestuurder wordt niet door een licht tegengehouden en mag doorrijden.",
    scene: {
      kind: "HOTSPOT",
      sceneId: "location",
      location: "gelijkwaardige-kruising",
      trafficLight: { slot: "north", state: "red" },
      actors: [
        { id: "you", slot: "north", kind: "car", color: "var(--sign-red)", self: true },
        { id: "other-car", slot: "east", kind: "car", color: "var(--sign-blue)" },
      ],
      correctSlot: "other-car",
      question: "Wie mag rijden?",
    },
  },
  {
    seedId: "sq-0399",
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Jullie komen tegelijk aan bij dit kruispunt. Geen borden, geen verkeerslichten. Wie mag doorrijden?",
    explanation:
      "Zonder borden geldt voorrang van rechts. Jij nadert vanaf de oostkant; de andere auto komt vanuit het zuiden en heeft dus jou aan zijn rechterhand. Die auto moet daarom wachten.",
    scene: (() => {
      const location: LocationId = "gelijkwaardige-kruising-stedelijk";
      const actors: { id: string; slot: string; kind: "car" | "cyclist"; color: string; self?: boolean }[] = [
        { id: "you", slot: "east", kind: "car", color: "var(--sign-red)", self: true },
        { id: "other-car", slot: "south", kind: "car", color: "var(--sign-blue)" },
      ];
      const correctSlot = resolvePriority({ type: "voorrang-van-rechts" }, locationPriorityActors(location, actors));
      return {
        kind: "HOTSPOT",
        sceneId: "location",
        location,
        actors,
        correctSlot,
        question: "Wie mag doorrijden?",
      } satisfies LocationHotspotScene;
    })(),
  },
  {
    seedId: "sq-0400",
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt. Er staan geen borden. Vanaf links komt een fietser aan. Wie mag als eerste?",
    explanation:
      "Voorrang van rechts geldt voor alle bestuurders, ook fietsers. De fietser komt vanuit het westen — dat is voor jou rechts — en heeft daarom voorrang, ook al is het maar een fiets.",
    scene: (() => {
      const location: LocationId = "gelijkwaardige-kruising-stedelijk";
      const actors: { id: string; slot: string; kind: "car" | "cyclist"; color: string; self?: boolean }[] = [
        { id: "you", slot: "north", kind: "car", color: "var(--sign-red)", self: true },
        { id: "cyclist", slot: "west", kind: "cyclist", color: "var(--sign-blue)" },
      ];
      const correctSlot = resolvePriority({ type: "voorrang-van-rechts" }, locationPriorityActors(location, actors));
      return {
        kind: "HOTSPOT",
        sceneId: "location",
        location,
        actors,
        correctSlot,
        question: "Wie mag als eerste?",
      } satisfies LocationHotspotScene;
    })(),
  },
  {
    seedId: "sq-0401",
    topic: "voorrang",
    subtopic: "gelijkwaardige-kruispunten",
    type: "HOTSPOT",
    difficulty: 3,
    prompt: "Op dit kruispunt naderen drie weggebruikers tegelijk. Geen borden, geen verkeerslichten. Wie mag als eerste rijden?",
    explanation:
      "Kijk steeds naar wie er rechts van jou zit. Jij (zuid) hebt de auto uit het oosten rechts van je, dus jij wacht. Die auto heeft op zijn beurt de fietser uit het noorden rechts van zich, dus die auto wacht ook. De fietser heeft niemand rechts van zich — vanuit het westen komt niemand — en mag daarom als eerste.",
    scene: (() => {
      const location: LocationId = "gelijkwaardige-kruising-stedelijk";
      const actors: { id: string; slot: string; kind: "car" | "cyclist"; color: string; self?: boolean }[] = [
        { id: "you", slot: "south", kind: "car", color: "var(--sign-red)", self: true },
        { id: "other-car", slot: "east", kind: "car", color: "var(--sign-blue)" },
        { id: "cyclist", slot: "north", kind: "cyclist", color: "var(--sign-yellow)" },
      ];
      const correctSlot = resolvePriority({ type: "voorrang-van-rechts" }, locationPriorityActors(location, actors));
      return {
        kind: "HOTSPOT",
        sceneId: "location",
        location,
        actors,
        correctSlot,
        question: "Wie mag als eerste rijden?",
      } satisfies LocationHotspotScene;
    })(),
  },
  {
    seedId: "sq-0402",
    topic: "voorrang",
    subtopic: "voorrangsborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt vanuit het zuiden. Je ziet het bord 'verleen voorrang'. Wie mag als eerste rijden?",
    explanation:
      "Bord B6 ('verleen voorrang') verplicht jou voorrang te verlenen aan bestuurders op de kruisende weg — ook als er verder niemand rechts van je zit.",
    scene: (() => {
      const location: LocationId = "gelijkwaardige-kruising-stedelijk";
      const actors: { id: string; slot: string; kind: "car"; color: string; self?: boolean }[] = [
        { id: "you", slot: "south", kind: "car", color: "var(--sign-red)", self: true },
        { id: "other-car", slot: "east", kind: "car", color: "var(--sign-blue)" },
      ];
      const correctSlot = resolvePriority(
        { type: "sign", governedBy: [{ actorId: "you", sign: "give-way" }] },
        locationPriorityActors(location, actors)
      );
      return {
        kind: "HOTSPOT",
        sceneId: "location",
        location,
        signs: [{ signId: "B6", slot: "south" }],
        actors,
        correctSlot,
        question: "Wie mag als eerste rijden?",
      } satisfies LocationHotspotScene;
    })(),
  },
  {
    seedId: "sq-0403",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt. Wie mag rijden?",
    explanation:
      "Bij rood licht moet jij altijd stoppen, ongeacht de voorrangssituatie. De andere bestuurder wordt niet door een licht tegengehouden en mag doorrijden.",
    scene: (() => {
      const location: LocationId = "gelijkwaardige-kruising-stedelijk";
      const actors: { id: string; slot: string; kind: "car"; color: string; self?: boolean }[] = [
        { id: "you", slot: "north", kind: "car", color: "var(--sign-red)", self: true },
        { id: "other-car", slot: "west", kind: "car", color: "var(--sign-blue)" },
      ];
      const correctSlot = resolvePriority(
        { type: "traffic-light", lights: { you: "red" } },
        locationPriorityActors(location, actors)
      );
      return {
        kind: "HOTSPOT",
        sceneId: "location",
        location,
        trafficLight: { slot: "north", state: "red" },
        actors,
        correctSlot,
        question: "Wie mag rijden?",
      } satisfies LocationHotspotScene;
    })(),
  },
  {
    seedId: "sq-0396",
    topic: "voorrang",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je rijdt dit kruispunt op. Geen borden, geen verkeerslicht. Wie mag doorrijden?",
    explanation: "Zonder borden geldt voorrang van rechts — ook voor een fietser. Jij kijkt naar rechts en ziet de fietser aankomen, die heeft daarom voorrang.",
    scene: (() => {
      const cell = { col: 1, row: 0 };
      const actors: PriorityActor[] = [
        { id: "you", bearing: 90 },
        { id: "cyclist", bearing: 0 },
      ];
      const correctSlot = resolvePriority({ type: "voorrang-van-rechts" }, actors);
      return {
        kind: "HOTSPOT",
        sceneId: "grid",
        gridSize: { cols: 3, rows: 1 },
        tiles: [
          { cell: { col: 0, row: 0 }, kind: "grass", rotation: 0 },
          { cell, kind: "crossroad", rotation: 0 },
          { cell: { col: 2, row: 0 }, kind: "grass", rotation: 0 },
        ],
        actors: [
          { id: "you", kind: "car", color: "var(--sign-red)", position: { cell, bearing: 90, stage: "approaching" }, self: true },
          { id: "cyclist", kind: "cyclist", color: "var(--sign-blue)", position: { cell, bearing: 0, stage: "approaching" } },
        ],
        priorityRule: { type: "voorrang-van-rechts" },
        correctSlot,
        question: "Wie mag doorrijden?",
      } satisfies GridHotspotScene;
    })(),
  },
  {
    seedId: "sq-0397",
    topic: "voorrang",
    subtopic: "voorrangsborden",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Je nadert dit kruispunt via de zijweg. Je ziet het bord 'verleen voorrang'. Wie mag als eerst rijden?",
    explanation: "Bord B6 ('verleen voorrang') verplicht je voorrang te verlenen aan bestuurders op de doorgaande weg.",
    scene: (() => {
      const cell = { col: 1, row: 0 };
      const actors: PriorityActor[] = [
        { id: "you", bearing: 0 },
        { id: "other-car", bearing: 90 },
      ];
      const correctSlot = resolvePriority(
        { type: "sign", governedBy: [{ actorId: "you", sign: "give-way" }] },
        actors
      );
      return {
        kind: "HOTSPOT",
        sceneId: "grid",
        gridSize: { cols: 3, rows: 1 },
        tiles: [
          { cell: { col: 0, row: 0 }, kind: "grass", rotation: 0 },
          { cell, kind: "t-junction", rotation: 0 },
          { cell: { col: 2, row: 0 }, kind: "grass", rotation: 0 },
        ],
        signs: [{ signId: "B6", cell, bearing: 0 }],
        actors: [
          { id: "you", kind: "car", color: "var(--sign-red)", position: { cell, bearing: 0, stage: "approaching" }, self: true },
          { id: "other-car", kind: "car", color: "var(--sign-blue)", position: { cell, bearing: 90, stage: "approaching" } },
        ],
        priorityRule: { type: "sign", governedBy: [{ actorId: "you", sign: "give-way" }] },
        correctSlot,
        question: "Wie mag als eerst rijden?",
      } satisfies GridHotspotScene;
    })(),
  },
  {
    seedId: "sq-0398",
    topic: "voorrang",
    subtopic: "rotondes",
    type: "HOTSPOT",
    difficulty: 2,
    prompt: "Bij deze rotonde rijdt al een andere auto. Wie gaat er eerst?",
    explanation:
      "Verkeer dat al op de rotonde rijdt heeft altijd voorrang op verkeer dat de rotonde op wil rijden — ook zonder bord.",
    scene: (() => {
      const cell = { col: 0, row: 0 };
      const actors: PriorityActor[] = [
        { id: "you", bearing: 270, stage: "approaching" },
        { id: "ring-car", bearing: 270, stage: "on-ring" },
      ];
      const correctSlot = resolvePriority({ type: "roundabout" }, actors);
      return {
        kind: "HOTSPOT",
        sceneId: "grid",
        gridSize: { cols: 1, rows: 1 },
        tiles: [{ cell, kind: "roundabout-center", rotation: 0 }],
        actors: [
          { id: "you", kind: "car", color: "var(--sign-red)", position: { cell, bearing: 270, stage: "approaching" }, self: true },
          { id: "ring-car", kind: "car", color: "var(--sign-blue)", position: { cell, bearing: 270, stage: "on-ring" } },
        ],
        priorityRule: { type: "roundabout" },
        correctSlot,
        question: "Wie gaat er eerst?",
      } satisfies GridHotspotScene;
    })(),
  },

  // ---- Verkeersborden -------------------------------------------------------
  {
    seedId: "sq-0017",
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
    seedId: "sq-0018",
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
    seedId: "sq-0019",
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
    seedId: "sq-0020",
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
    seedId: "sq-0021",
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
    seedId: "sq-0022",
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
    seedId: "sq-0023",
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

  {
    seedId: "sq-0025",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is buiten de bebouwde kom vaak de maximumsnelheid op een weg met een 80-bord?",
    explanation: "Wat is buiten de bebouwde kom vaak de maximumsnelheid op een weg met een 80-bord: 80 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "60" },
        { id: "b", label: "70" },
        { id: "c", label: "80" },
        { id: "d", label: "100" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0027",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is de maximumsnelheid op veel Nederlandse autosnelwegen overdag?",
    explanation: "Wat is de maximumsnelheid op veel Nederlandse autosnelwegen overdag: 100 km/u. (tenzij anders aangegeven.)",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "80" },
        { id: "b", label: "90" },
        { id: "c", label: "100" },
        { id: "d", label: "130" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0028",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Tussen welke tijden geldt op veel snelwegen de hogere avond-/nachtsnelheid?",
    explanation: "Tussen welke tijden geldt op veel snelwegen de hogere avond-/nachtsnelheid: 19.00–06.00.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "18.00–06.00" },
        { id: "b", label: "19.00–06.00" },
        { id: "c", label: "20.00–07.00" },
        { id: "d", label: "21.00–05.00" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0029",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Een matrixbord geeft 70 km/u aan terwijl een vast bord 100 aangeeft. Wat geldt?",
    explanation: "Een matrixbord geeft 70 km/u aan terwijl een vast bord 100 aangeeft. Wat geldt: 70 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "100" },
        { id: "b", label: "70" },
        { id: "c", label: "Gemiddelde van beide" },
        { id: "d", label: "Je mag kiezen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0030",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is er een algemene minimumsnelheid voor auto's?",
    explanation: "Is er een algemene minimumsnelheid voor auto's: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja, 30" },
        { id: "b", label: "Ja, 50" },
        { id: "c", label: "Nee" },
        { id: "d", label: "60" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0031",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is de minimumconstructiesnelheid voor een voertuig om op een autoweg te mogen rijden?",
    explanation: "Wat is de minimumconstructiesnelheid voor een voertuig om op een autoweg te mogen rijden: 50 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "30" },
        { id: "b", label: "45" },
        { id: "c", label: "50" },
        { id: "d", label: "60" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0032",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is de minimumconstructiesnelheid voor een voertuig om op een autosnelweg te mogen rijden?",
    explanation: "Wat is de minimumconstructiesnelheid voor een voertuig om op een autosnelweg te mogen rijden: 60 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "40" },
        { id: "b", label: "50" },
        { id: "c", label: "60" },
        { id: "d", label: "80" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0035",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat gebeurt er doorgaans met de remweg als je snelheid stijgt?",
    explanation: "Wat gebeurt er doorgaans met de remweg als je snelheid stijgt: Hij wordt langer.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Hij wordt korter" },
        { id: "b", label: "Hij blijft gelijk" },
        { id: "c", label: "Hij wordt langer" },
        { id: "d", label: "Hij verdwijnt door ABS" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0040",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat betekent 'aangepaste snelheid'?",
    explanation:
      "Aangepaste snelheid betekent dat je niet zomaar de maximumsnelheid aanhoudt, maar je snelheid afstemt op zicht, weer, wegdek en verkeersdrukte — soms moet je dus trager rijden dan het bord toestaat.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Altijd de volledige maximumsnelheid rijden" },
        { id: "b", label: "Je snelheid afstemmen op zicht, weer, wegdek en drukte, ook als dat onder de maximumsnelheid is" },
        { id: "c", label: "Altijd precies 20 km/u onder de limiet rijden" },
        { id: "d", label: "Zo hard mogelijk rijden zolang het veilig aanvoelt" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0042",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je komt een file tegen. Wat is verstandig?",
    explanation: "Vroeg snelheid verminderen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Pas vlak voor de file remmen" },
        { id: "b", label: "Vroeg snelheid verminderen" },
        { id: "c", label: "Gas geven" },
        { id: "d", label: "Vluchtstrook gebruiken" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0044",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Heeft ABS als doel de remweg onder alle omstandigheden te halveren?",
    explanation: "Heeft ABS als doel de remweg onder alle omstandigheden te halveren: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen bij regen" },
        { id: "d", label: "Alleen boven 100 km/u" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0048",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is voor een auto met een aanhanger van minder dan 3.500 kg de maximumsnelheid op de snelweg?",
    explanation: "Wat is voor een auto met een aanhanger van minder dan 3.500 kg de maximumsnelheid op de snelweg: 90 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "70" },
        { id: "b", label: "80" },
        { id: "c", label: "90" },
        { id: "d", label: "100" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0049",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is voor een auto met een aanhanger van meer dan 3.500 kg de maximumsnelheid op de snelweg?",
    explanation: "Wat is voor een auto met een aanhanger van meer dan 3.500 kg de maximumsnelheid op de snelweg: 80 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "70" },
        { id: "b", label: "80" },
        { id: "c", label: "90" },
        { id: "d", label: "100" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0050",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een personenauto met fietsendrager heeft dezelfde maximumsnelheden als:",
    explanation: "Een personenauto zonder fietsendrager.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Een vrachtwagen" },
        { id: "b", label: "Een personenauto zonder fietsendrager" },
        { id: "c", label: "Een auto met zware aanhanger" },
        { id: "d", label: "Een brommobiel" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0051",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom kan te langzaam rijden gevaarlijk zijn?",
    explanation: "Omdat je verkeer kunt hinderen of gevaar veroorzaken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Omdat je altijd een boete krijgt" },
        { id: "b", label: "Omdat je verkeer kunt hinderen of gevaar veroorzaken" },
        { id: "c", label: "Omdat je banden slijten" },
        { id: "d", label: "Omdat je voorrang verliest" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0053",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom is snelheid belangrijk bij kinderen langs de weg?",
    explanation: "Kinderen kunnen onverwacht oversteken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Kinderen kunnen onverwacht oversteken" },
        { id: "b", label: "Kinderen hebben altijd voorrang" },
        { id: "c", label: "Kinderen mogen op de rijbaan lopen" },
        { id: "d", label: "Je auto remt slechter bij kinderen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0055",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat gebeurt er met je reactietijd als je vermoeid bent?",
    explanation: "Die kan langer worden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Die kan langer worden" },
        { id: "b", label: "Die wordt altijd korter" },
        { id: "c", label: "Geen effect" },
        { id: "d", label: "Alleen 's nachts langer" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0056",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat heeft direct invloed op de remweg?",
    explanation: "Snelheid en omstandigheden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Snelheid en omstandigheden" },
        { id: "b", label: "Alleen kleur van de auto" },
        { id: "c", label: "Alleen motorgeluid" },
        { id: "d", label: "Alleen buitentemperatuur" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0057",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Met welke factor neemt het risico bij hogere snelheid toe?",
    explanation: "Zowel benodigde remweg als impactenergie.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen brandstofverbruik" },
        { id: "b", label: "Zowel benodigde remweg als impactenergie" },
        { id: "c", label: "Alleen bandenspanning" },
        { id: "d", label: "Alleen motortoerental" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0060",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom is snelheid in een woonwijk extra belangrijk?",
    explanation: "Er zijn vaak kwetsbare weggebruikers en onverwachte situaties.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Er zijn vaak kwetsbare weggebruikers en onverwachte situaties" },
        { id: "b", label: "Er rijden geen auto's" },
        { id: "c", label: "Iedereen heeft voorrang" },
        { id: "d", label: "Snelheid heeft daar geen invloed" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0061",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je sneller rijden dan de borden aangeven als er geen verkeer is?",
    explanation: "Mag je sneller rijden dan de borden aangeven als er geen verkeer is: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen 's nachts" },
        { id: "d", label: "Alleen op rechte wegen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0062",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt op een weg met een tijdelijke snelheidsbeperking door wegwerkzaamheden. Wat geldt?",
    explanation: "De tijdelijke beperking.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Het oude bord" },
        { id: "b", label: "De tijdelijke beperking" },
        { id: "c", label: "De maximumsnelheid van de vorige weg" },
        { id: "d", label: "Je eigen keuze" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0064",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je nadert een tunnel. Waarom kan snelheid aanpassen belangrijk zijn?",
    explanation: "Zicht en verkeerssituatie kunnen veranderen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zicht en verkeerssituatie kunnen veranderen" },
        { id: "b", label: "Auto's mogen daar altijd maximaal 30" },
        { id: "c", label: "Motoren mogen er niet rijden" },
        { id: "d", label: "Remmen werken niet" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0065",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt tegen de zon in. Wat is verstandig?",
    explanation: "Snelheid eventueel verlagen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Snelheid eventueel verlagen" },
        { id: "b", label: "Gas geven" },
        { id: "c", label: "Alleen groot licht" },
        { id: "d", label: "Ogen sluiten" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0067",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wat is aquaplaning?",
    explanation: "Verlies van contact tussen band en weg door water.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Slip door ijs" },
        { id: "b", label: "Verlies van contact tussen band en weg door water" },
        { id: "c", label: "Defecte rem" },
        { id: "d", label: "Te hoge motorbelasting" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0068",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wat kun je bij aquaplaning het beste doen?",
    explanation: "Rustig gas loslaten en de auto zo recht mogelijk houden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Hard remmen" },
        { id: "b", label: "Rustig gas loslaten en de auto zo recht mogelijk houden" },
        { id: "c", label: "Handrem aantrekken" },
        { id: "d", label: "Hard insturen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0072",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is een lagere snelheid altijd veiliger?",
    explanation: "Nee, je moet ook voorkomen dat je verkeer onnodig hindert.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja, ongeacht de situatie" },
        { id: "b", label: "Nee, je moet ook voorkomen dat je verkeer onnodig hindert" },
        { id: "c", label: "Alleen op de snelweg" },
        { id: "d", label: "Alleen in de stad" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0073",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Welke uitspraak klopt?",
    explanation: "Je snelheid moet zowel wettelijk als veilig zijn.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Maximumsnelheid is altijd de ideale snelheid" },
        { id: "b", label: "Je snelheid moet zowel wettelijk als veilig zijn" },
        { id: "c", label: "Je moet altijd 10 km/u onder de limiet rijden" },
        { id: "d", label: "Alleen verkeersborden bepalen wat veilig is" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0074",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Je rijdt dit bord voorbij. Wat is vanaf hier de maximumsnelheid?",
    explanation:
      "Dit bord geeft het begin van een 30 km/u-zone aan. Vanaf hier tot het eindebord geldt overal in de zone maximaal 30 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "A1-30zb",
      options: [
        { id: "a", label: "15 km/u" },
        { id: "b", label: "30 km/u" },
        { id: "c", label: "50 km/u" },
        { id: "d", label: "Zoveel als veilig aanvoelt" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0075",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Je rijdt deze straat in. Wat is hier de maximumsnelheid?",
    explanation:
      "Het bord bij de straatingang geeft het begin van een 30 km/u-zone aan — die snelheid geldt voor de hele zone, niet alleen ter hoogte van het bord zelf.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptLocationScene: {
        location: "straat-van-rechts-stedelijk",
        signs: [{ signId: "A1-30zb", slot: "north" }],
      },
      options: [
        { id: "a", label: "30 km/u" },
        { id: "b", label: "50 km/u" },
        { id: "c", label: "15 km/u" },
        { id: "d", label: "Geen limiet, het is een woonerf" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0076",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt dit bord voorbij. Wat betekent het?",
    explanation:
      "Dit bord geeft het einde van de 30 km/u-zone aan; vanaf hier geldt weer de normale maximumsnelheid voor dit type weg.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "A1-30ze",
      options: [
        { id: "a", label: "De 30 km/u-zone eindigt hier" },
        { id: "b", label: "Er begint hier een nieuwe 30 km/u-zone" },
        { id: "c", label: "Je moet hier stoppen" },
        { id: "d", label: "Vrachtverkeer is verboden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0077",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Je rijdt dit bord voorbij, buiten de bebouwde kom. Wat is vanaf hier de maximumsnelheid?",
    explanation:
      "Dit bord geeft het begin van een 60 km/u-zone aan. Vanaf hier tot het eindebord geldt overal in de zone maximaal 60 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "A1-60zb",
      options: [
        { id: "a", label: "50 km/u" },
        { id: "b", label: "60 km/u" },
        { id: "c", label: "80 km/u" },
        { id: "d", label: "100 km/u" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0078",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt dit bord voorbij. Wat betekent het?",
    explanation:
      "Dit bord geeft aan dat de eerder ingestelde maximumsnelheid (hier 50) hier eindigt; de normale snelheidslimiet voor dit type weg geldt weer.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "A2-50",
      options: [
        { id: "a", label: "Vanaf hier geldt maximaal 50 km/u" },
        { id: "b", label: "De eerder ingestelde snelheidsbeperking eindigt hier" },
        { id: "c", label: "Je moet minimaal 50 km/u rijden" },
        { id: "d", label: "Adviessnelheid 50 km/u" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0079",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je nadert een scherpe bocht met dit bord. Ben je verplicht deze snelheid aan te houden?",
    explanation:
      "Een adviessnelheid is geen verplichting, maar wel een sterke aanbeveling — bijvoorbeeld voor een bocht die scherper is dan hij lijkt.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "A4",
      options: [
        { id: "a", label: "Ja, dit is een verplichte maximumsnelheid" },
        { id: "b", label: "Nee, het is een advies, geen verplichting" },
        { id: "c", label: "Alleen verplicht voor vrachtverkeer" },
        { id: "d", label: "Alleen verplicht bij regen" },
      ],
      correctOptionId: "b",
    },
  },
  // ---- Plaats op de weg -------------------------------------------------------
  {
    seedId: "sq-0080",
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
    seedId: "sq-0081",
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

  {
    seedId: "sq-0084",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt op een weg met drie rijstroken in dezelfde richting. Welke rijstrook gebruik je normaal?",
    explanation: "Je rijdt op een weg met drie rijstroken in dezelfde richting. Welke rijstrook gebruik je normaal: Rechter.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Linker" },
        { id: "b", label: "Middelste" },
        { id: "c", label: "Rechter" },
        { id: "d", label: "Vluchtstrook" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0087",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je wilt rechtsaf slaan. Waar moet je rekening mee houden?",
    explanation: "Verkeer naast je, vooral fietsers.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Verkeer naast je, vooral fietsers" },
        { id: "b", label: "Alleen verkeer achter je" },
        { id: "c", label: "Alleen tegemoetkomers" },
        { id: "d", label: "Alleen voetgangers" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0090",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat betekenen dubbele witte middenstrepen met groen ertussen buiten de bebouwde kom doorgaans?",
    explanation: "Wat betekenen dubbele witte middenstrepen met groen ertussen buiten de bebouwde kom doorgaans: 100 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "60 km/u" },
        { id: "b", label: "80 km/u" },
        { id: "c", label: "100 km/u" },
        { id: "d", label: "130 km/u" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0091",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat betekenen dubbele witte middenstrepen zonder groene vulling buiten de bebouwde kom doorgaans?",
    explanation: "Wat betekenen dubbele witte middenstrepen zonder groene vulling buiten de bebouwde kom doorgaans: 80.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "50" },
        { id: "b", label: "60" },
        { id: "c", label: "80" },
        { id: "d", label: "100" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0092",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat betekent buiten de bebouwde kom een weg zonder middenstreep officieel doorgaans?",
    explanation: "Wat betekent buiten de bebouwde kom een weg zonder middenstreep officieel doorgaans: 60. (behoudens andere aangegeven regels.)",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "30" },
        { id: "b", label: "50" },
        { id: "c", label: "60" },
        { id: "d", label: "100" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0094",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een fietsstrook met doorgetrokken streep overschrijden om te parkeren?",
    explanation: "Mag je een fietsstrook met doorgetrokken streep overschrijden om te parkeren: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen 's nachts" },
        { id: "d", label: "Alleen 5 minuten" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0098",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wat is de dode hoek?",
    explanation: "Een gebied dat je ondanks spiegels niet direct kunt zien.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Een deel van de weg zonder asfalt" },
        { id: "b", label: "Een gebied dat je ondanks spiegels niet direct kunt zien" },
        { id: "c", label: "Een verboden rijstrook" },
        { id: "d", label: "Een parkeerplaats" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0100",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je wilt van rijstrook wisselen. Wat doe je?",
    explanation: "Kijken, richting aangeven en alleen gaan als het veilig is.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen richting aangeven" },
        { id: "b", label: "Kijken, richting aangeven en alleen gaan als het veilig is" },
        { id: "c", label: "Alleen spiegelen" },
        { id: "d", label: "Meteen naar de andere strook" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0102",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een busbaan gebruiken als je geen bus bent?",
    explanation: "Alleen als de regels of bebording dit toestaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Altijd" },
        { id: "b", label: "Alleen als de regels of bebording dit toestaan" },
        { id: "c", label: "Alleen 's nachts" },
        { id: "d", label: "Als je haast hebt" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0103",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een rijstrook is gemarkeerd met een pijl rechtdoor. Wat betekent dat?",
    explanation: "Alleen rechtdoor rijden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen rechtdoor rijden" },
        { id: "b", label: "Je moet parkeren" },
        { id: "c", label: "Je mag keren" },
        { id: "d", label: "Je moet linksaf" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0104",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Een voorsorteerstrook heeft een pijl linksaf. Wat moet je doen?",
    explanation: "Linksaf rijden wanneer je die strook gebruikt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Rechtsaf" },
        { id: "b", label: "Rechtdoor" },
        { id: "c", label: "Linksaf rijden wanneer je die strook gebruikt" },
        { id: "d", label: "Stoppen" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0107",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waar hoort een auto op een autosnelweg normaal te rijden?",
    explanation: "Waar hoort een auto op een autosnelweg normaal te rijden: Rechter rijstrook.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Linker rijstrook" },
        { id: "b", label: "Rechter rijstrook" },
        { id: "c", label: "Vluchtstrook" },
        { id: "d", label: "Middenberm" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0108",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer gebruik je de linker rijstrook op de snelweg?",
    explanation: "Bijvoorbeeld voor inhalen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Normaal altijd" },
        { id: "b", label: "Bijvoorbeeld voor inhalen" },
        { id: "c", label: "Om langzaam te rijden" },
        { id: "d", label: "Alleen bij files" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0109",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je hebt zojuist iemand ingehaald. Wat doe je daarna normaal?",
    explanation: "Terug naar rechts als dat veilig kan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Onnodig links blijven" },
        { id: "b", label: "Terug naar rechts als dat veilig kan" },
        { id: "c", label: "Naar de vluchtstrook" },
        { id: "d", label: "Stoppen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0110",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je de vluchtstrook gebruiken als gewone rijstrook?",
    explanation: "Mag je de vluchtstrook gebruiken als gewone rijstrook: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen 's nachts" },
        { id: "d", label: "Alleen bij regen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0111",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wanneer mag je over een verdrijvingsvlak rijden?",
    explanation: "Alleen wanneer de markering en verkeerssituatie dit toestaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Wanneer je haast hebt" },
        { id: "b", label: "Alleen wanneer de markering en verkeerssituatie dit toestaan" },
        { id: "c", label: "Altijd" },
        { id: "d", label: "Voor inhalen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0112",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wat is een puntstuk?",
    explanation: "Een gemarkeerd gebied dat rijstroken scheidt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Een parkeerplaats" },
        { id: "b", label: "Een gemarkeerd gebied dat rijstroken scheidt" },
        { id: "c", label: "Een fietspad" },
        { id: "d", label: "Een vluchtstrook" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0113",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Mag je een puntstuk gebruiken om een rijstrook over te slaan?",
    explanation: "Nee, niet als dat verboden is door de markering.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja, altijd" },
        { id: "b", label: "Nee, niet als dat verboden is door de markering" },
        { id: "c", label: "Alleen bij file" },
        { id: "d", label: "Alleen buiten de bebouwde kom" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0117",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt langs een geparkeerde auto. Wat moet je controleren?",
    explanation: "Of een portier kan opengaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Of een portier kan opengaan" },
        { id: "b", label: "Alleen je snelheid" },
        { id: "c", label: "Alleen de spiegels van je eigen auto" },
        { id: "d", label: "Alleen de middenstreep" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0118",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is een goede veiligheidsafstand tot geparkeerde auto's?",
    explanation: "Voldoende om onverwachte deuren en bewegingen op te vangen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zo klein mogelijk" },
        { id: "b", label: "Voldoende om onverwachte deuren en bewegingen op te vangen" },
        { id: "c", label: "Exact 10 cm" },
        { id: "d", label: "Geen afstand" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0119",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waar mag een auto normaal niet rijden?",
    explanation: "Waar mag een auto normaal niet rijden: Fietspad.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Rijbaan" },
        { id: "b", label: "Fietspad" },
        { id: "c", label: "Rijstrook" },
        { id: "d", label: "Voorsorteerstrook" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0125",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Welke positie maakt inhalen meestal mogelijk?",
    explanation: "Zo veel mogelijk rechts wanneer je niet inhaalt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zo veel mogelijk rechts wanneer je niet inhaalt" },
        { id: "b", label: "Altijd links rijden" },
        { id: "c", label: "Op het fietspad" },
        { id: "d", label: "Op de middenberm" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0129",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je zonder reden voortdurend van rijstrook wisselen?",
    explanation: "Nee, dit is onnodig en risicovol.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee, dit is onnodig en risicovol" },
        { id: "c", label: "Alleen op snelweg" },
        { id: "d", label: "Alleen bij droog weer" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0130",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de beste basisregel voor je plaats op de weg?",
    explanation: "Rechts houden en voldoende ruimte bewaren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Rechts houden en voldoende ruimte bewaren" },
        { id: "b", label: "Links houden" },
        { id: "c", label: "Midden houden" },
        { id: "d", label: "Zo dicht mogelijk langs obstakels rijden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0131",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat bepaalt uiteindelijk je veilige positie op de weg?",
    explanation: "Verkeersregels én de actuele verkeerssituatie.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen snelheid" },
        { id: "b", label: "Verkeersregels én de actuele verkeerssituatie" },
        { id: "c", label: "Alleen navigatie" },
        { id: "d", label: "Alleen je auto" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0132",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je met de auto een weg op waar dit bord staat?",
    explanation: "Dit bord sluit motorvoertuigen op meer dan twee wielen — waaronder een auto — uit van de weg.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "C6",
      options: [
        { id: "a", label: "Nee, auto's mogen deze weg niet op" },
        { id: "b", label: "Ja, alleen bromfietsen mogen er niet op" },
        { id: "c", label: "Ja, mits je stapvoets rijdt" },
        { id: "d", label: "Alleen als je een vergunning hebt" },
      ],
      correctOptionId: "a",
    },
  },
  // ---- Inhalen -------------------------------------------------------
  {
    seedId: "sq-0133",
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
    seedId: "sq-0134",
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

  {
    seedId: "sq-0137",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt op een snelweg met meerdere rijstroken. Het verkeer links rijdt langzamer dan jij rechts. Mag je rechts passeren als dat het gevolg is van het verkeer op jouw rijstrook?",
    explanation: "Je rijdt op een snelweg met meerdere rijstroken. Het verkeer links rijdt langzamer dan jij rechts. Mag je rechts passeren als dat het gevolg is van het verkeer op jouw rijstrook: Ja.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen 's nachts" },
        { id: "d", label: "Alleen boven 100 km/u" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0140",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je wordt ingehaald. Mag je versnellen om de andere bestuurder tegen te houden?",
    explanation: "Je wordt ingehaald. Mag je versnellen om de andere bestuurder tegen te houden: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen buiten bebouwde kom" },
        { id: "d", label: "Alleen als je onder limiet zit" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0144",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom is inhalen vlak voor een kruispunt riskant?",
    explanation: "Je zicht op kruisend verkeer kan beperkt zijn.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Je zicht op kruisend verkeer kan beperkt zijn" },
        { id: "b", label: "Je auto wordt langzamer" },
        { id: "c", label: "Er geldt altijd 30" },
        { id: "d", label: "Je krijgt automatisch voorrang" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0146",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat betekent een onderbroken middenstreep doorgaans voor inhalen?",
    explanation: "Inhalen kan mogelijk zijn als het verder veilig en toegestaan is.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Inhalen kan mogelijk zijn als het verder veilig en toegestaan is" },
        { id: "b", label: "Inhalen is altijd verboden" },
        { id: "c", label: "Je moet stoppen" },
        { id: "d", label: "Alleen vrachtwagens mogen inhalen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0147",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat betekent een doorgetrokken middenstreep doorgaans?",
    explanation: "Inhalen is verboden wanneer daarvoor de streep overschreden moet worden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Je mag de streep overschrijden om in te halen" },
        { id: "b", label: "Inhalen is verboden wanneer daarvoor de streep overschreden moet worden" },
        { id: "c", label: "Je moet links rijden" },
        { id: "d", label: "Voorrang" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0155",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Waarom is inhalen in een onoverzichtelijke bocht gevaarlijk?",
    explanation: "Een tegenligger kan te laat zichtbaar worden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Een tegenligger kan te laat zichtbaar worden" },
        { id: "b", label: "Je banden verliezen altijd grip" },
        { id: "c", label: "De maximumsnelheid verandert" },
        { id: "d", label: "Je krijgt altijd een boete" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0161",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt op twee rijstroken in dezelfde richting. Rechts rijdt het verkeer sneller dan links door drukte. Wat is dat?",
    explanation: "Niet automatisch verboden rechts inhalen; het kan een gevolg van verkeersdrukte zijn.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Niet automatisch verboden rechts inhalen; het kan een gevolg van verkeersdrukte zijn" },
        { id: "b", label: "Altijd een overtreding" },
        { id: "c", label: "Altijd verboden op snelwegen" },
        { id: "d", label: "Altijd verboden binnen de kom" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0163",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Waarom moet je voor het inhalen de dode hoek controleren?",
    explanation: "Er kan een ander voertuig naast je zitten.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Er kan een ander voertuig naast je zitten" },
        { id: "b", label: "Je motor kan uitvallen" },
        { id: "c", label: "Het is verplicht voor parkeren" },
        { id: "d", label: "Alleen bij vrachtwagens" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0164",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom moet je na het inhalen voldoende afstand nemen voordat je naar rechts gaat?",
    explanation: "Om de ingehaalde bestuurder niet af te snijden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Om de ingehaalde bestuurder niet af te snijden" },
        { id: "b", label: "Om langzamer te rijden" },
        { id: "c", label: "Om voorrang te krijgen" },
        { id: "d", label: "Voor de motor" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0168",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een auto inhalen op een smalle brug zonder goed zicht?",
    explanation: "Nee, als het daardoor onveilig is.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee, als het daardoor onveilig is" },
        { id: "c", label: "Alleen met groot licht" },
        { id: "d", label: "Alleen onder 30 km/u" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0170",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Mag je over een verdrijvingsvlak inhalen?",
    explanation: "Nee, niet om daarover de inhaalmanoeuvre uit te voeren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee, niet om daarover de inhaalmanoeuvre uit te voeren" },
        { id: "c", label: "Alleen met file" },
        { id: "d", label: "Alleen 's nachts" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0171",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wat is 'bumperkleven' bij een voorligger voor een inhaalactie?",
    explanation: "Wat is 'bumperkleven' bij een voorligger voor een inhaalactie: Onveilig.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Veilig" },
        { id: "b", label: "Onveilig" },
        { id: "c", label: "Verplicht" },
        { id: "d", label: "Nodig voor zicht" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0179",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Kun je juridisch voorrang krijgen alleen omdat je aan het inhalen bent?",
    explanation: "Kun je juridisch voorrang krijgen alleen omdat je aan het inhalen bent: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Nee" },
        { id: "b", label: "Ja, altijd" },
        { id: "c", label: "Alleen op snelweg" },
        { id: "d", label: "Alleen buiten bebouwde kom" },
      ],
      correctOptionId: "a",
    },
  },
  // ---- Bijzondere manoeuvres -------------------------------------------------------
  {
    seedId: "sq-0185",
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

  {
    seedId: "sq-0191",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat geldt bij een bijzondere manoeuvre?",
    explanation: "Je moet het overige verkeer voor laten gaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Je hebt voorrang" },
        { id: "b", label: "Je moet het overige verkeer voor laten gaan" },
        { id: "c", label: "Alleen verkeer van rechts gaat voor" },
        { id: "d", label: "Alleen fietsers gaan voor" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0192",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je wilt achteruit wegrijden. Wat controleer je?",
    explanation: "Je wilt achteruit wegrijden. Wat controleer je: Rondom de auto.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen achteruitkijkspiegel" },
        { id: "b", label: "Rondom de auto" },
        { id: "c", label: "Alleen links" },
        { id: "d", label: "Alleen rechts" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0193",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom moet je bij achteruitrijden langzaam rijden?",
    explanation: "Voor controle en mogelijkheid om te stoppen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Voor controle en mogelijkheid om te stoppen" },
        { id: "b", label: "Omdat achteruit maximaal 5 km/u mag" },
        { id: "c", label: "Om brandstof te besparen" },
        { id: "d", label: "Omdat motoren anders beschadigen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0201",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wie moet zich bij invoegen aanpassen?",
    explanation: "De invoegende bestuurder.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "De invoegende bestuurder" },
        { id: "b", label: "Alleen het verkeer op de hoofdrijbaan" },
        { id: "c", label: "Niemand" },
        { id: "d", label: "De achterligger alleen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0204",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je staat stil en wilt wegrijden. Wat controleer je?",
    explanation: "Spiegels, dode hoek en verkeer.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Spiegels, dode hoek en verkeer" },
        { id: "b", label: "Alleen de binnenspiegel" },
        { id: "c", label: "Alleen voor je" },
        { id: "d", label: "Alleen achter je" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0206",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je bij een bijzondere manoeuvre snelheid maken om voorrang te krijgen?",
    explanation: "Mag je bij een bijzondere manoeuvre snelheid maken om voorrang te krijgen: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Nee" },
        { id: "b", label: "Ja" },
        { id: "c", label: "Alleen buiten de kom" },
        { id: "d", label: "Alleen bij fietsers" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0208",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Achteruit inparkeren lukt niet in één keer. Wat kun je doen?",
    explanation: "Opnieuw steken als dat veilig is.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Opnieuw steken als dat veilig is" },
        { id: "b", label: "Zonder kijken doorgaan" },
        { id: "c", label: "Alleen vooruit rijden" },
        { id: "d", label: "Op het fietspad staan" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0209",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is belangrijk bij parkeren langs de weg?",
    explanation: "Verkeer niet onnodig hinderen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Verkeer niet onnodig hinderen" },
        { id: "b", label: "Zo dicht mogelijk bij kruispunt parkeren" },
        { id: "c", label: "Fietspad blokkeren" },
        { id: "d", label: "Zebra blokkeren" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0210",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je keren op een autosnelweg?",
    explanation: "Mag je keren op een autosnelweg: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen als er geen verkeer is" },
        { id: "d", label: "Alleen op vluchtstrook" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0211",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je achteruitrijden op een autosnelweg om een afrit te halen?",
    explanation: "Mag je achteruitrijden op een autosnelweg om een afrit te halen: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen op vluchtstrook" },
        { id: "d", label: "Alleen 's nachts" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0212",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je mist een afrit. Wat moet je doen?",
    explanation: "Doorrijden naar de volgende mogelijkheid.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Doorrijden naar de volgende mogelijkheid" },
        { id: "b", label: "Achteruit" },
        { id: "c", label: "Keren" },
        { id: "d", label: "Vluchtstrook" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0216",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de juiste volgorde bij veilig rijstrook wisselen?",
    explanation: "Kijken – richting aangeven – opnieuw controleren – manoeuvreren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Richtingaanwijzer – meteen sturen" },
        { id: "b", label: "Kijken – richting aangeven – opnieuw controleren – manoeuvreren" },
        { id: "c", label: "Alleen richting aangeven" },
        { id: "d", label: "Alleen binnenspiegel" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0222",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een uitritconstructie ziet er soms uit als een trottoir dat doorloopt. Wat betekent dit?",
    explanation: "Je moet het overige verkeer voor laten gaan bij het verlaten.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Je moet het overige verkeer voor laten gaan bij het verlaten" },
        { id: "b", label: "Jij hebt voorrang" },
        { id: "c", label: "Alleen fietsers voor laten gaan" },
        { id: "d", label: "Niemand" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0226",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is een veelgemaakte fout bij achteruitrijden?",
    explanation: "Alleen naar de achteruitrijcamera kijken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Te veel naar voren kijken" },
        { id: "b", label: "Alleen naar de achteruitrijcamera kijken" },
        { id: "c", label: "Te langzaam rijden" },
        { id: "d", label: "Richting aangeven" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0231",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Bij welke manoeuvre moet je extra letten op achteropkomende fietsers?",
    explanation: "Bij welke manoeuvre moet je extra letten op achteropkomende fietsers: Alle bovenstaande.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Rechtsaf slaan" },
        { id: "b", label: "Wegrijden" },
        { id: "c", label: "Achteruitrijden" },
        { id: "d", label: "Alle bovenstaande" },
      ],
      correctOptionId: "d",
    },
  },
  {
    seedId: "sq-0233",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is uit een parkeergarage komen te vergelijken met uit een uitrit komen?",
    explanation: "Ja, voor de voorrangsregels kan het als uitritsituatie gelden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja, voor de voorrangsregels kan het als uitritsituatie gelden" },
        { id: "b", label: "Nee, je hebt altijd voorrang" },
        { id: "c", label: "Alleen buiten de kom" },
        { id: "d", label: "Alleen bij slagbomen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0235",
    topic: "bijzondere-manoeuvres",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de hoofdregel voor alle bijzondere manoeuvres?",
    explanation: "Degene die de manoeuvre uitvoert moet het overige verkeer voor laten gaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Degene die de manoeuvre uitvoert moet het overige verkeer voor laten gaan" },
        { id: "b", label: "Verkeer van links gaat voor" },
        { id: "c", label: "Auto's gaan altijd voor" },
        { id: "d", label: "Niemand heeft voorrang" },
      ],
      correctOptionId: "a",
    },
  },
  // ---- Weggebruikers -------------------------------------------------------
  {
    seedId: "sq-0236",
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
    seedId: "sq-0237",
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

  {
    seedId: "sq-0241",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een bal rolt tussen geparkeerde auto's vandaan. Wat verwacht je?",
    explanation: "Er kan een kind achteraan komen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Er kan een kind achteraan komen" },
        { id: "b", label: "Er gebeurt niets" },
        { id: "c", label: "Alleen een fietser" },
        { id: "d", label: "Een politieagent" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0243",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een blinde voetganger met een witte stok wil oversteken. Wat doe je?",
    explanation: "Extra voorzichtig zijn en voorrang verlenen waar vereist.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Extra voorzichtig zijn en voorrang verlenen waar vereist" },
        { id: "b", label: "Toeteren" },
        { id: "c", label: "Accelereren" },
        { id: "d", label: "Alleen stoppen als hij midden op de weg staat" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0244",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je ziet een fietser die om zich heen kijkt. Wat kan dat betekenen?",
    explanation: "Hij kan van richting veranderen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Hij kan van richting veranderen" },
        { id: "b", label: "Hij heeft altijd voorrang" },
        { id: "c", label: "Hij gaat altijd stoppen" },
        { id: "d", label: "Hij gaat altijd rechtdoor" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0246",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Een vrachtwagen heeft een grote dode hoek. Wat moet je doen?",
    explanation: "Niet naast de vrachtwagen blijven hangen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Niet naast de vrachtwagen blijven hangen" },
        { id: "b", label: "Zo dicht mogelijk ernaast rijden" },
        { id: "c", label: "Rechts naast de chauffeur rijden" },
        { id: "d", label: "Alleen claxonneren" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0247",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Waar is de dode hoek bij een vrachtwagen vooral gevaarlijk?",
    explanation: "Rechts naast en voor/achter het voertuig.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Rechts naast en voor/achter het voertuig" },
        { id: "b", label: "Alleen ver achter" },
        { id: "c", label: "Alleen linksvoor" },
        { id: "d", label: "Alleen op de snelweg" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0249",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een brommobiel rijdt op de rijbaan. Mag deze op het fietspad?",
    explanation: "Een brommobiel rijdt op de rijbaan. Mag deze op het fietspad: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen buiten de bebouwde kom" },
        { id: "d", label: "Alleen bij file" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0250",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat is de maximumsnelheid van een brommobiel?",
    explanation: "Wat is de maximumsnelheid van een brommobiel: 45 km/u.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "25" },
        { id: "b", label: "30" },
        { id: "c", label: "45" },
        { id: "d", label: "50" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0253",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een motorrijder rijdt tussen langzaam rijdende auto's. Wat doe je?",
    explanation: "Extra spiegelen en geen plotselinge manoeuvres maken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Extra spiegelen en geen plotselinge manoeuvres maken" },
        { id: "b", label: "De motor afsnijden" },
        { id: "c", label: "Rechts rijden zonder te kijken" },
        { id: "d", label: "Portier openen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0258",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een bus staat bij een halte. Waarom moet je extra opletten?",
    explanation: "Passagiers kunnen oversteken of de weg op komen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Passagiers kunnen oversteken of de weg op komen" },
        { id: "b", label: "De bus heeft altijd voorrang op iedereen" },
        { id: "c", label: "Alle auto's moeten stoppen" },
        { id: "d", label: "De bus rijdt altijd achteruit" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0261",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een hulpverleningsvoertuig met zwaailicht en sirene zomaar volgen om sneller door verkeer te komen?",
    explanation: "Mag je een hulpverleningsvoertuig met zwaailicht en sirene zomaar volgen om sneller door verkeer te komen: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen op snelweg" },
        { id: "d", label: "Alleen buiten bebouwde kom" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0262",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een politieagent regelt verkeer op een kruispunt. Wat doe je?",
    explanation: "Zijn aanwijzingen volgen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zijn aanwijzingen volgen" },
        { id: "b", label: "Alleen verkeerslichten volgen" },
        { id: "c", label: "Alleen borden volgen" },
        { id: "d", label: "Alleen rechts gaat voor" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0264",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom moet je bij paarden niet onnodig claxonneren?",
    explanation: "Het dier kan schrikken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Het dier kan schrikken" },
        { id: "b", label: "Het is altijd verboden" },
        { id: "c", label: "Paarden hebben voorrang" },
        { id: "d", label: "Je motor kan afslaan" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0266",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom kunnen landbouwvoertuigen onverwacht afslaan?",
    explanation: "Ze kunnen breed zijn en verschillende werkzaamheden uitvoeren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ze kunnen breed zijn en verschillende werkzaamheden uitvoeren" },
        { id: "b", label: "Ze hebben geen richtingaanwijzers" },
        { id: "c", label: "Ze rijden altijd achteruit" },
        { id: "d", label: "Ze mogen niet op de weg" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0269",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom zijn kinderen op fietsen extra onvoorspelbaar?",
    explanation: "Hun verkeersinzicht kan nog in ontwikkeling zijn.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Hun verkeersinzicht kan nog in ontwikkeling zijn" },
        { id: "b", label: "Ze hebben altijd voorrang" },
        { id: "c", label: "Ze mogen geen rem gebruiken" },
        { id: "d", label: "Ze rijden altijd links" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0276",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is een kwetsbare verkeersdeelnemer?",
    explanation: "Iemand zonder veel fysieke bescherming.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Iemand zonder veel fysieke bescherming" },
        { id: "b", label: "Alleen een vrachtwagenchauffeur" },
        { id: "c", label: "Alleen een buschauffeur" },
        { id: "d", label: "Alleen een automobilist" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0277",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom moet je bij fietsers extra controleren vóór rechtsaf slaan?",
    explanation: "Ze kunnen naast je rijden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ze kunnen naast je rijden" },
        { id: "b", label: "Auto's hebben geen voorrang" },
        { id: "c", label: "Fietsers stoppen altijd" },
        { id: "d", label: "Ze rijden altijd op het trottoir" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0286",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Welke weggebruikers kunnen extra onverwacht gedrag vertonen?",
    explanation: "Kinderen, ouderen en dieren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Kinderen, ouderen en dieren" },
        { id: "b", label: "Alleen vrachtwagens" },
        { id: "c", label: "Alleen automobilisten" },
        { id: "d", label: "Alleen bussen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0287",
    topic: "weggebruikers",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de belangrijkste basisregel bij kwetsbare weggebruikers?",
    explanation: "Extra anticiperen en ruimte geven.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Extra anticiperen en ruimte geven" },
        { id: "b", label: "Zo snel mogelijk voorbij" },
        { id: "c", label: "Zo dicht mogelijk volgen" },
        { id: "d", label: "Alleen claxonneren" },
      ],
      correctOptionId: "a",
    },
  },
  // ---- Verlichting (ondergebracht bij Veiligheid) --------------------------
  {
    seedId: "sq-0288",
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
    seedId: "sq-0289",
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
    seedId: "sq-0290",
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
    seedId: "sq-0291",
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

  {
    seedId: "sq-0293",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je met een brommobiel op een autosnelweg rijden?",
    explanation: "Mag je met een brommobiel op een autosnelweg rijden: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen buiten bebouwde kom" },
        { id: "d", label: "Alleen 's nachts" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0296",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je op de vluchtstrook inhalen?",
    explanation: "Mag je op de vluchtstrook inhalen: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen langzaam verkeer" },
        { id: "d", label: "Alleen bij file" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0298",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer mag je de vluchtstrook in het algemeen gebruiken?",
    explanation: "Bij nood of wanneer omstandigheden dit noodzakelijk maken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Voor normaal verkeer" },
        { id: "b", label: "Bij nood of wanneer omstandigheden dit noodzakelijk maken" },
        { id: "c", label: "Voor inhalen" },
        { id: "d", label: "Voor parkeren tijdens lunch" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0301",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer kan 's avonds en 's nachts 120 of 130 km/u gelden?",
    explanation: "Op wegen waar dat specifiek is aangegeven.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Op wegen waar dat specifiek is aangegeven" },
        { id: "b", label: "Op iedere weg" },
        { id: "c", label: "Alleen binnen bebouwde kom" },
        { id: "d", label: "Nooit" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0307",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat doe je als er geen veilige ruimte is om in te voegen?",
    explanation: "Afremmen of versnellen om een veilige ruimte te vinden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Afremmen of versnellen om een veilige ruimte te vinden" },
        { id: "b", label: "Stilvallen op de invoegstrook zonder reden" },
        { id: "c", label: "Vluchtstrook" },
        { id: "d", label: "Midden op rijbaan invoegen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0310",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je op een autosnelweg stoppen om een passagier uit te laten stappen?",
    explanation: "Nee, behalve bij nood/noodzaak.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee, behalve bij nood/noodzaak" },
        { id: "c", label: "Alleen op vluchtstrook" },
        { id: "d", label: "Alleen 's nachts" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0311",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je auto heeft pech op de snelweg. Wat doe je?",
    explanation: "Zo veilig mogelijk stilzetten en de situatie beveiligen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zo veilig mogelijk stilzetten en de situatie beveiligen" },
        { id: "b", label: "Midden op de rijbaan blijven staan" },
        { id: "c", label: "Achteruit rijden" },
        { id: "d", label: "Keren" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0315",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom moet je op de snelweg extra afstand houden?",
    explanation: "Door hoge snelheden is meer rem- en reactieruimte nodig.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Door hoge snelheden is meer rem- en reactieruimte nodig" },
        { id: "b", label: "Voor brandstof" },
        { id: "c", label: "Voor radio" },
        { id: "d", label: "Omdat je anders links moet rijden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0316",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat doe je als een achterligger veel te dicht op je rijdt?",
    explanation: "Zelf voldoende afstand vóór je houden en niet provoceren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zelf voldoende afstand vóór je houden en niet provoceren" },
        { id: "b", label: "Hard remmen" },
        { id: "c", label: "Versnellen boven limiet" },
        { id: "d", label: "Achteruitrijden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0318",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat betekent een rood kruis boven jouw rijstrook?",
    explanation: "Wat betekent een rood kruis boven jouw rijstrook: Rijstrook gesloten.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Rijstrook gesloten" },
        { id: "b", label: "Maximum 130" },
        { id: "c", label: "Inhalen verplicht" },
        { id: "d", label: "Rijstrook voor vrachtwagens" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0322",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je op een snelweg via de middenberm keren?",
    explanation: "Mag je op een snelweg via de middenberm keren: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen bij file" },
        { id: "d", label: "Alleen politie" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0327",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Heeft de invoegende auto automatisch voorrang?",
    explanation: "Heeft de invoegende auto automatisch voorrang: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen bij groen" },
        { id: "d", label: "Alleen bij 100 km/u" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0330",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat doe je bij een stilstaande auto op de vluchtstrook?",
    explanation: "Afstand houden en opletten op personen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Afstand houden en opletten op personen" },
        { id: "b", label: "Er zo dicht mogelijk langs rijden" },
        { id: "c", label: "Claxonneren" },
        { id: "d", label: "Stoppen ernaast" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0333",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een kapotte auto op de rijbaan van een snelweg laten staan als je hem niet kunt verplaatsen?",
    explanation: "Alleen wanneer het door noodzaak niet anders kan, en je moet de situatie zo veilig mogelijk maken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen wanneer het door noodzaak niet anders kan, en je moet de situatie zo veilig mogelijk maken" },
        { id: "b", label: "Ja, altijd" },
        { id: "c", label: "Nee, ook bij pech niet" },
        { id: "d", label: "Alleen 's nachts" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0338",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Waarom zijn op- en afritten gevaarlijke plekken?",
    explanation: "Verkeersstromen voegen samen en splitsen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Verkeersstromen voegen samen en splitsen" },
        { id: "b", label: "Er geldt altijd 30" },
        { id: "c", label: "Alleen vrachtwagens rijden er" },
        { id: "d", label: "Er zijn geen markeringen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0339",
    topic: "autosnelwegen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat betekent de minimumconstructiesnelheid van 60 km/u niet?",
    explanation: "Dat je altijd minimaal 60 moet rijden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Dat je altijd minimaal 60 moet rijden" },
        { id: "b", label: "Dat je voertuig geschikt moet zijn voor minimaal 60" },
        { id: "c", label: "Dat een scooter niet toegelaten is" },
        { id: "d", label: "Dat de snelweg een snelheidslimiet heeft" },
      ],
      correctOptionId: "a",
    },
  },
  // ---- Veiligheid -------------------------------------------------------
  {
    seedId: "sq-0342",
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
    seedId: "sq-0343",
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

  {
    seedId: "sq-0346",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een gordel delen met een andere passagier?",
    explanation: "Mag je een gordel delen met een andere passagier: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen kinderen" },
        { id: "d", label: "Alleen achterin" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0347",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat geldt voor kinderen kleiner dan 1,35 meter?",
    explanation: "Zij moeten in een passend kinderbeveiligingsmiddel worden vervoerd.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zij moeten in een passend kinderbeveiligingsmiddel worden vervoerd" },
        { id: "b", label: "Alleen gordel" },
        { id: "c", label: "Geen beveiliging" },
        { id: "d", label: "Alleen achterin" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0348",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat geldt voor kinderen langer dan 1,35 meter?",
    explanation: "Zij mogen de gewone autogordel gebruiken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Zij mogen de gewone autogordel gebruiken" },
        { id: "b", label: "Zij moeten altijd achterin" },
        { id: "c", label: "Zij mogen geen gordel dragen" },
        { id: "d", label: "Zij moeten altijd in een babyzitje" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0349",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Vervangt een airbag de veiligheidsgordel?",
    explanation: "Vervangt een airbag de veiligheidsgordel: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen bij lage snelheid" },
        { id: "d", label: "Alleen bij nieuwe auto's" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0354",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je merkt dat je ogen zwaar worden tijdens het rijden. Wat doe je?",
    explanation: "Veilige plek zoeken en rust nemen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Veilige plek zoeken en rust nemen" },
        { id: "b", label: "Raam openen en doorgaan" },
        { id: "c", label: "Radio harder" },
        { id: "d", label: "Sneller rijden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0355",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is alcohol vóór het rijden veilig?",
    explanation: "Nee, alcohol kan je rijvaardigheid verminderen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Nee, alcohol kan je rijvaardigheid verminderen" },
        { id: "b", label: "Ja, maximaal twee glazen altijd" },
        { id: "c", label: "Alleen bier is veilig" },
        { id: "d", label: "Alleen buiten bebouwde kom gevaarlijk" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0356",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Kunnen medicijnen je rijvaardigheid beïnvloeden?",
    explanation: "Kunnen medicijnen je rijvaardigheid beïnvloeden: Ja.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen antibiotica" },
        { id: "d", label: "Alleen 's nachts" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0358",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je een telefoon vasthouden tijdens het rijden?",
    explanation: "Mag je een telefoon vasthouden tijdens het rijden: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen bij langzaam rijden" },
        { id: "d", label: "Alleen op de snelweg" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0359",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is een betere manier om navigatie te gebruiken?",
    explanation: "Voor vertrek instellen of handsfree gebruiken zonder onveilig afgeleid te raken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Voor vertrek instellen of handsfree gebruiken zonder onveilig afgeleid te raken" },
        { id: "b", label: "Tijdens het rijden uitgebreid typen" },
        { id: "c", label: "Telefoon in de hand" },
        { id: "d", label: "Achteraf kaart lezen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0360",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is handsfree telefoongebruik automatisch zonder risico?",
    explanation: "Nee, het kan nog steeds afleiden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee, het kan nog steeds afleiden" },
        { id: "c", label: "Alleen bij 30 km/u" },
        { id: "d", label: "Alleen buiten de kom" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0364",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer moet je extra afstand houden?",
    explanation: "Bij regen, gladheid, mist en slecht zicht.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Bij regen, gladheid, mist en slecht zicht" },
        { id: "b", label: "Alleen 's nachts" },
        { id: "c", label: "Alleen boven 100" },
        { id: "d", label: "Nooit" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0368",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer gebruik je het mistachterlicht?",
    explanation: "Bij mist of sneeuw waardoor zicht minder dan 50 meter is.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Bij mist of sneeuw waardoor zicht minder dan 50 meter is" },
        { id: "b", label: "Bij iedere regenbui" },
        { id: "c", label: "Altijd 's nachts" },
        { id: "d", label: "Alleen buiten bebouwde kom" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0369",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Mag je mistachterlicht gebruiken bij zware regen?",
    explanation: "Mag je mistachterlicht gebruiken bij zware regen: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen buiten bebouwde kom" },
        { id: "d", label: "Alleen op snelweg" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0372",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer mag groot licht niet worden gebruikt?",
    explanation: "Wanneer je een andere weggebruiker tegenkomt of vlak achter een voertuig rijdt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Wanneer je een andere weggebruiker tegenkomt of vlak achter een voertuig rijdt" },
        { id: "b", label: "Alleen binnen bebouwde kom" },
        { id: "c", label: "Alleen bij regen" },
        { id: "d", label: "Alleen bij 30 km/u" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0375",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Gaan bij iedere auto de achterlichten automatisch aan met dagrijverlichting?",
    explanation: "Nee, dat verschilt per auto.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee, dat verschilt per auto" },
        { id: "c", label: "Alleen oude auto's" },
        { id: "d", label: "Alleen elektrische auto's" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0377",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is een veiligheidsvest verplicht in een Nederlandse auto?",
    explanation: "Is een veiligheidsvest verplicht in een Nederlandse auto: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen op snelweg" },
        { id: "d", label: "Alleen voor bestuurder" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0378",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Is een gevarendriehoek verplicht om standaard in je Nederlandse auto te hebben?",
    explanation: "Is een gevarendriehoek verplicht om standaard in je Nederlandse auto te hebben: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen buiten kom" },
        { id: "d", label: "Alleen bij APK" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0380",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Op ongeveer welke afstand wordt een gevarendriehoek geplaatst?",
    explanation: "Op ongeveer welke afstand wordt een gevarendriehoek geplaatst: 30 meter.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "5 meter" },
        { id: "b", label: "10 meter" },
        { id: "c", label: "30 meter" },
        { id: "d", label: "100 meter" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0381",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer hoef je geen gevarendriehoek te plaatsen als je voertuig een obstakel vormt?",
    explanation: "Als de knipperende waarschuwingslichten aanstaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Als de knipperende waarschuwingslichten aanstaan" },
        { id: "b", label: "Als de radio aanstaat" },
        { id: "c", label: "Als je verlichting uit is" },
        { id: "d", label: "Als je in de auto blijft zitten" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0385",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Wat doe je als je verblind wordt door tegenliggers?",
    explanation: "Snelheid verminderen en zoveel mogelijk naar de wegkant oriënteren zonder gevaarlijk te sturen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Snelheid verminderen en zoveel mogelijk naar de wegkant oriënteren zonder gevaarlijk te sturen" },
        { id: "b", label: "Groot licht terug" },
        { id: "c", label: "Ogen dicht" },
        { id: "d", label: "Accelereren" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0388",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is een belangrijk voordeel van ABS?",
    explanation: "Het helpt wielblokkering bij hard remmen te voorkomen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Het helpt wielblokkering bij hard remmen te voorkomen" },
        { id: "b", label: "Het verhoogt de maximumsnelheid" },
        { id: "c", label: "Het voorkomt ieder ongeval" },
        { id: "d", label: "Het geeft voorrang" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0389",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Betekent ABS dat je altijd sneller tot stilstand komt?",
    explanation: "Betekent ABS dat je altijd sneller tot stilstand komt: Nee.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
        { id: "c", label: "Alleen bij sneeuw" },
        { id: "d", label: "Alleen op snelweg" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0391",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is anticiperend rijden?",
    explanation: "Vooruitkijken en rekening houden met wat er kan gebeuren.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Vooruitkijken en rekening houden met wat er kan gebeuren" },
        { id: "b", label: "Alleen naar de auto voor je kijken" },
        { id: "c", label: "Zo laat mogelijk remmen" },
        { id: "d", label: "Altijd langzaam rijden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0392",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de veiligste houding tegenover andere weggebruikers?",
    explanation: "Ervan uitgaan dat ze fouten kunnen maken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ervan uitgaan dat ze fouten kunnen maken" },
        { id: "b", label: "Ervan uitgaan dat ze altijd alles goed doen" },
        { id: "c", label: "Altijd voorrang claimen" },
        { id: "d", label: "Nooit remmen" },
      ],
      correctOptionId: "a",
    },
  },
  // ---- Overwegen (spoorwegkruisingen) ---------------------------------------
  {
    seedId: "sq-0394",
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
        { id: "b", label: "Ik verleen altijd voorrang aan de trein" },
        { id: "c", label: "Voorrang hangt af van wie er het eerst is" },
        { id: "d", label: "Alleen bij twee sporen moet ik voorrang verlenen" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0395",
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

  // ---- Batch aangeleverd door de gebruiker (echte CBR-stijl vragen) --------
  // Antwoorden zijn niet geraden: per vraag opgezocht (RVV 1990-artikeltekst
  // via maxius.nl waar mogelijk, anders VVN/CBR-content), niet uit het
  // geheugen. Zie de git-commit voor de bronnen per vraag.
  {
    seedId: "sq-0404",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je wilt de langzaam rijdende tram links inhalen. Mag dat?",
    explanation:
      "Inhalen gebeurt normaal gesproken links — dat geldt ook voor een tram. Trams hebben daarnaast nog een extra uitzondering: die mag je óók rechts inhalen (art. 11 RVV 1990), maar dat vervangt links inhalen niet, het komt erbij.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0405",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Welke verlichting moet je bij dag voeren als door weersomstandigheden het zicht ernstig wordt belemmerd?",
    explanation:
      "Dimlicht — grootlicht kaatst juist terug van regen, sneeuw of mist en verblindt jezelf en anderen. Dimlicht (eventueel met mistlicht erbij) is dan de juiste keuze.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Afhankelijk van de omstandigheden groot licht of dimlicht" },
        { id: "b", label: "Dimlicht" },
        { id: "c", label: "Groot licht" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0406",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wanneer gebruik je minder brandstof?",
    explanation:
      "Cruise control houdt je snelheid gelijkmatiger dan je dat zelf doet, en dat scheelt echt brandstof. Open ramen kosten juist meer door extra luchtweerstand, en de motor eerst stationair laten warmdraaien helpt niet — een auto warmt pas op tijdens het rijden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Als je met open ramen rijdt" },
        { id: "b", label: "Als je regelmatig de cruise control gebruikt" },
        { id: "c", label: "Als je eerst de motor warm laat worden en pas daarna wegrijdt" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0407",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Bij welke temperatuur (Celsius) moet je rekening houden met een glad wegdek door ijsvorming?",
    explanation:
      "Al onder de +4°C, niet pas bij 0°C — het wegdek zelf kan een paar graden kouder zijn dan de temperatuur die je auto of het weerbericht aangeeft, dus gladheid kan al eerder ontstaan dan je zou denken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Als de temperatuur daalt onder de +4 graden Celsius" },
        { id: "b", label: "Pas als de temperatuur daalt onder de +2 graden Celsius" },
        { id: "c", label: "Pas als de temperatuur daalt onder de 0 graden Celsius" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0408",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Het zicht is ernstig belemmerd omdat het regent. Mag je nu met dimlicht en mistlicht aan de voorzijde rijden?",
    explanation:
      "Ja. Mistlicht voor mag je voeren als het zicht ernstig wordt belemmerd door mist, sneeuwval of regen (art. 34 RVV 1990), en dat mag gewoon tegelijk met dimlicht — het een sluit het ander niet uit.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0409",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Bij welk wegdek moet je rekening houden met een langere remweg?",
    explanation:
      "Bij allebei: nat wegdek geeft minder grip, en verrassend genoeg is ook net aangelegd nieuw asfalt tijdelijk gladder (door het bindmiddel dat er nog op zit) — vandaar de borden 'Nieuw wegdek, langere remweg'.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Alleen bij een nieuw wegdek" },
        { id: "b", label: "Alleen bij een nat wegdek" },
        { id: "c", label: "Bij een nieuw en een nat wegdek" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0410",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Langs de kant van de weg staan soms bermpaaltjes. Aan welke kant van de weg hebben de bermpaaltjes rode reflectoren?",
    explanation:
      "Aan de rechterkant rood, aan de linkerkant wit — dezelfde kleurcode als de achterlichten (rood) en voorkant (wit) van voertuigen, zodat je in het donker meteen ziet aan welke kant van de weg je rijdt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Aan de linkerkant" },
        { id: "b", label: "Aan de rechterkant én aan de linkerkant" },
        { id: "c", label: "Aan de rechterkant" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0411",
    topic: "inhalen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt op een weg met tegenliggers. Wat is de belangrijkste factor waar je op moet letten als je een ander voertuig wil gaan inhalen?",
    explanation:
      "Het snelheidsverschil: hoe kleiner het verschil tussen jouw snelheid en die van het voertuig dat je inhaalt, hoe langer de inhaalmanoeuvre duurt — en hoe langer je op de weghelft van de tegenligger zit.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Het snelheidsverschil tussen jou en het voertuig dat je wil inhalen" },
        { id: "b", label: "De lengte van het voertuig dat je wil inhalen" },
        { id: "c", label: "Het aantal voertuigen dat achter jou rijdt" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0412",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is de maximale snelheid van een Segway in een voetgangersgebied?",
    explanation:
      "6 km/u — op het voetpad/trottoir telt een Segway (net als een scootmobiel) als gehandicaptenvoertuig en moet die stapvoets, niet sneller dan een voetganger.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "6 kilometer per uur" },
        { id: "b", label: "13 kilometer per uur" },
        { id: "c", label: "25 kilometer per uur" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0413",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Kun je direct na een lange autorit een betrouwbare oliepeiling doen?",
    explanation:
      "Nee. Meteen na het stoppen is de olie nog niet teruggelopen in het carter — je peilstok geeft dan een te laag niveau aan. Wacht minstens 10 minuten na het uitzetten van de motor.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ja" },
        { id: "b", label: "Nee" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0414",
    topic: "plaats-op-de-weg",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt op een weg waar je 50 kilometer per uur mag rijden. Je wilt afslaan. Wanneer moet je je richtingaanwijzer aanzetten?",
    explanation:
      "Binnen de bebouwde kom (waar 50 km/u de norm is) is de vuistregel ongeveer 100 meter voor de uitrijstrook of het kruispunt — genoeg tijd voor het verkeer achter je om het op te merken.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "25 meter voor de uitrijstrook of voor het kruispunt" },
        { id: "b", label: "50 meter voor de uitrijstrook of voor het kruispunt" },
        { id: "c", label: "100 meter voor de uitrijstrook of voor het kruispunt" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0415",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wanneer kun je last hebben van aquaplaning?",
    explanation:
      "Aquaplaning ontstaat klassiek in sporen (spoorvorming) die vol water staan: je banden kunnen dat water niet snel genoeg wegdrukken, waardoor er een waterfilm tussen band en wegdek ontstaat en je het contact met het wegdek verliest.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Als je door het opspattende water van een vrachtauto rijdt" },
        { id: "b", label: "Als je op een weg met gaten, die volstaan met water, rijdt" },
        { id: "c", label: "Als je op een weg rijdt met sporen die volstaan met water" },
      ],
      correctOptionId: "c",
    },
  },
  {
    seedId: "sq-0416",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Je hebt twee glazen bier gedronken. Wat gebeurt er met je reactievermogen?",
    explanation:
      "Het neemt af. Alcohol vertraagt je reactietijd en maakt je onvoorzichtiger, ook al voelt rijden juist ontspannener aan — dat gevoel is precies het probleem.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Het reactievermogen neemt toe" },
        { id: "b", label: "Het reactievermogen neemt af" },
        { id: "c", label: "Het reactievermogen blijft gelijk" },
      ],
      correctOptionId: "b",
    },
  },
  {
    seedId: "sq-0417",
    topic: "voorrang",
    type: "MULTIPLE_CHOICE",
    difficulty: 2,
    prompt: "Je nadert een voetgangersoversteekplaats. Wat geldt er? Er kunnen meer antwoorden goed zijn.",
    explanation:
      "Alle drie kloppen (art. 12 RVV 1990): vlak voor of op een oversteekplaats mag je niet inhalen, en je moet zowel voetgangers als bestuurders van een gehandicaptenvoertuig voor laten gaan die (willen) oversteken.",
    scene: {
      kind: "MULTIPLE_CHOICE",
      options: [
        { id: "a", label: "Je mag geen voertuig inhalen" },
        { id: "b", label: "Je moet voetgangers die (willen) oversteken, voor laten gaan" },
        { id: "c", label: "Je moet bestuurders van een gehandicaptenvoertuig die (willen) oversteken, voor laten gaan" },
      ],
      correctOptionIds: ["a", "b", "c"],
    },
  },
  {
    seedId: "sq-0418",
    topic: "veiligheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Wat kan er gebeuren als sensoren en camera's van ADAS-systemen vuil zijn?",
    explanation:
      "De rijhulpsystemen raken verstoord — een vuile of bevroren sensor 'ziet' de weg niet goed meer, waardoor het systeem verkeerd werkt of helemaal uitvalt.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "De ADAS-systemen raken verstoord" },
        { id: "b", label: "De motor van de auto start niet meer" },
        { id: "c", label: "Het navigatiesysteem werkt niet meer" },
      ],
      correctOptionId: "a",
    },
  },

  // ---- Content-balans: meer Verkeersborden + Voorrang (RVV 1990-artikelen
  // en officiële bordbetekenissen opgezocht per vraag, zie hieronder) -------
  {
    seedId: "sq-0419",
    topic: "verkeersborden",
    subtopic: "verbodsborden",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Bij dit bord nadert een gewone motorfiets zonder zijspan. Mag deze doorrijden?",
    explanation:
      "C6 sluit voertuigen met meer dan twee wielen uit (auto's, motoren mét zijspan). Een gewone motorfiets op twee wielen mag er wél onderdoor — dat is precies het verschil met bord C12, dat álle motorvoertuigen verbiedt, ongeacht het aantal wielen.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "C6",
      options: [
        { id: "a", label: "Ja, want C6 verbiedt alleen voertuigen met meer dan twee wielen" },
        { id: "b", label: "Nee, want C6 verbiedt alle motorvoertuigen" },
        { id: "c", label: "Alleen als de motor een zijspan heeft" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0420",
    topic: "verkeersborden",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt:
      "Je rijdt op een erf en nadert een kruising zonder verdere borden. Daarna verlaat je het erf weer via de uitrit naar een gewone weg. Welke voorrangsregel geldt waar?",
    explanation:
      "Op kruisingen binnen het erf geldt gewoon voorrang van rechts. Maar het erf werkt bij het verlaten als een soort uitrit: dan moet je altijd al het overige verkeer voorrang verlenen, ook als je eigenlijk van rechts zou komen.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "G5",
      options: [
        { id: "a", label: "Binnen het erf geldt voorrang van rechts; bij het verlaten van het erf moet je al het verkeer voor laten gaan" },
        { id: "b", label: "Op een erf gelden geen voorrangsregels, iedereen let op elkaar" },
        { id: "c", label: "Binnen het erf én bij het verlaten geldt altijd voorrang van rechts" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0421",
    topic: "verkeersborden",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Je parkeert je auto om 14:20 in een parkeerschijfzone. Op welke tijd zet je je parkeerschijf?",
    explanation:
      "De parkeerschijf moet op de aankomsttijd staan, afgerond naar het eerstvolgende hele of halve uur — 14:20 wordt dus 14:30.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "E10",
      options: [
        { id: "a", label: "14:30" },
        { id: "b", label: "14:20" },
        { id: "c", label: "15:00" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0422",
    topic: "verkeersborden",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Bij dit bord nadert een bromfietser (geel kenteken). Mag deze dit fietspad gebruiken?",
    explanation:
      "G11 (verplicht fietspad) is bedoeld voor fietsers en snorfietsen. Bromfietsen (geel kenteken) mogen hier normaal niet rijden — dat mag alleen op een G12a-fietspad ('fiets-/bromfietspad'), dat expliciet ook bromfietsen toelaat.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "G11",
      options: [
        { id: "a", label: "Nee, G11 is alleen voor fietsers en snorfietsen — bromfietsen moeten op de rijbaan blijven" },
        { id: "b", label: "Ja, alle brom- en snorfietsen mogen op elk fietspad rijden" },
        { id: "c", label: "Alleen als de bromfietser stapvoets rijdt" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0423",
    topic: "verkeersborden",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Je rijdt achter een langzame trekker en passeert dit bord. Mag je de trekker nog inhalen?",
    explanation:
      "F1 verbiedt het inhalen van motorvoertuigen. Een trekker is een motorvoertuig, dus die mag je hier niet inhalen — een veelgemaakte denkfout. Fietsers, bromfietsers en gehandicaptenvoertuigen mag je bij dit bord wél nog inhalen.",
    scene: {
      kind: "SINGLE_CHOICE",
      promptSignId: "F1",
      options: [
        { id: "a", label: "Nee, een trekker is een motorvoertuig, dus het inhaalverbod geldt ook hiervoor" },
        { id: "b", label: "Ja, want F1 geldt alleen voor auto's" },
        { id: "c", label: "Ja, langzame landbouwvoertuigen zijn altijd uitgezonderd van inhaalverboden" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0424",
    topic: "verkeersborden",
    subtopic: "voorrangsborden",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Wat is het verschil tussen het bord 'voorrangskruispunt' (B3) en het bord 'verleen voorrang' (B6)?",
    explanation:
      "B3 (en de varianten B4/B5) bevestigen dat jij op deze kruising voorrang hebt op kruisend verkeer. B6 is het spiegelbeeld: dat bord staat bij de zijweg en verplicht de bestuurder daar om voorrang te verlenen aan jou.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "B3 waarschuwt dat jij voorrang hébt op de kruising; B6 verplicht jou om voorrang te verlénen" },
        { id: "b", label: "Ze betekenen precies hetzelfde, alleen een andere vorm" },
        { id: "c", label: "B3 geldt alleen buiten de bebouwde kom, B6 alleen erbinnen" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0425",
    topic: "verkeersborden",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Er is een trottoir aanwezig, maar een voetganger loopt liever op de rijbaan. Mag dat?",
    explanation:
      "Voetgangers zijn verplicht het trottoir of voetpad te gebruiken als dat aanwezig is. Pas als dat ontbreekt, mogen ze uitwijken naar het fietspad, en pas als ook dat ontbreekt naar de berm of de rand van de rijbaan.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Nee, als er een trottoir of voetpad is, moet een voetganger dat gebruiken" },
        { id: "b", label: "Ja, voetgangers mogen altijd zelf kiezen waar ze lopen" },
        { id: "c", label: "Alleen als er geen fietsers op het trottoir zijn" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0426",
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je rijdt een uitrit op naar de openbare weg. Een fietser nadert van links, een auto van rechts. Wie laat je voorgaan?",
    explanation:
      "Een uitrit is geen gelijkwaardige weg. Bij het oprijden van de openbare weg vanuit een uitrit moet je al het overige verkeer voorrang verlenen — voetgangers, fietsers én auto's, ongeacht van welke kant ze komen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Allebei — vanuit een uitrit verleen je altijd voorrang aan al het overige verkeer" },
        { id: "b", label: "Alleen de auto, want die komt van rechts" },
        { id: "c", label: "Alleen de fietser, want fietsers hebben altijd voorrang" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0427",
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Binnen de bebouwde kom zet een lijnbus bij een halte zijn richtingaanwijzer aan om weg te rijden. Wat doe jij?",
    explanation:
      "Binnen de bebouwde kom moet je een lijnbus die met richtingaanwijzer aangeeft van een halte weg te rijden, de gelegenheid geven dat te doen — dus zo nodig vaart minderen en stoppen. Buiten de bebouwde kom geldt deze regel niet.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Ik vertraag en laat de bus zo nodig voorgaan" },
        { id: "b", label: "Ik heb voorrang, want ik rijd al op de doorgaande weg" },
        { id: "c", label: "Dit geldt alleen buiten de bebouwde kom" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0428",
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 3,
    prompt: "Je nadert een kruising zonder voorrangsborden. Van links komt een tram aan. Wie heeft voorrang?",
    explanation:
      "Een tram heeft op een kruising zonder voorrangsborden of -lichten altijd voorrang, ongeacht uit welke richting hij komt — de normale regel 'voorrang van rechts' geldt hier niet voor de tram. Wél moet de tram zich houden aan een stopbord, rood licht of voorrangsweg als die er zijn.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "De tram — die gaat bij een kruising zonder voorrangsregeling altijd voor, ook van links" },
        { id: "b", label: "Ik, want ik kom van rechts" },
        { id: "c", label: "Dat hangt af van de snelheid van de tram" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0429",
    topic: "voorrang",
    subtopic: "voorrangsvoertuigen",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Een politieauto nadert met alléén het blauwe zwaailicht aan, geen sirene. Moet je voorrang verlenen zoals bij een voorrangsvoertuig?",
    explanation:
      "Een voertuig is pas een voorrangsvoertuig — met voorrang op al het overige verkeer — als het zowel het blauwe zwaailicht als het tweetonige geluidssignaal (sirene) voert. Zwaailicht zonder sirene betekent dat je nog niet verplicht bent voorrang te verlenen.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Nee — pas met zwaailicht én sirene samen is het een voorrangsvoertuig dat voorrang krijgt" },
        { id: "b", label: "Ja, het zwaailicht alleen is al genoeg" },
        { id: "c", label: "Alleen bij nacht" },
      ],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0430",
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 2,
    prompt: "Je slaat linksaf. Een fietser rijdt op dezelfde weg rechtdoor, vlak naast je. Wie gaat er voor?",
    explanation:
      "Wie afslaat, moet het verkeer dat op dezelfde weg rechtdoor gaat — of hem tegemoetkomt — voor laten gaan. Dat geldt voor alle bestuurders, dus ook voor fietsers en bromfietsers die rechtdoor blijven rijden.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "De fietser — wie afslaat, moet rechtdoorgaand verkeer op dezelfde weg voor laten gaan" },
        { id: "b", label: "Ik, want ik ben al aan het afslaan" },
        { id: "c", label: "De fietser alleen als hij een hand uitsteekt" },
      ],
      correctOptionId: "a",
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

export async function main() {
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
  // Questions have no natural unique key to upsert on, so re-running this
  // (e.g. re-seeding production after a content fix) would otherwise pile up
  // duplicates — clear the slate first. Attempts/marks cascade-delete with
  // their question; per-topic Mastery is keyed by topic, not question, so it
  // survives a reseed untouched.
  await prisma.question.deleteMany({});
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
        seedKey: "seedId" in q ? q.seedId : undefined,
        status: "archived" in q && q.archived ? "ARCHIVED" : "PUBLISHED",
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

// Only auto-run when this file is the actual entrypoint (`tsx prisma/seed.ts`,
// i.e. `npm run db:seed`) — not when `main` is imported elsewhere (the
// one-time /api/admin/seed route uses the same logic against production).
import { fileURLToPath } from "url";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
