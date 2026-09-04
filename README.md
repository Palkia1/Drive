# Rijklaar — theorie-app voor Nederlandse rijscholen

Een MVP-implementatie van het P² Studios productbrief: een Duolingo-achtige theorie-app voor
het Nederlandse rijbewijs-B examen, met een apart rijschooldashboard voor instructeurs.

> **"Rijklaar"** is een placeholder-merknaam, niet vastgelegd in het brief — makkelijk aan te
> passen (zoek/vervang, plus `metadata.title` in `src/app/layout.tsx`).

## Snel starten

De app draait op Postgres (ook lokaal — nodig omdat productie op Vercel geen SQLite
ondersteunt). Heb je lokaal geen Postgres, dan is een gratis [Neon](https://neon.tech)-
projectje het snelste alternatief; vul de connection string in als `DATABASE_URL`.

```bash
npm install
cp .env.example .env          # zet hierin je eigen DATABASE_URL (lokale Postgres of bijv. Neon)
npm run db:migrate            # past het schema toe op die database
npm run db:seed               # vult onderwerpen, vragen, badges en demo-accounts
npm run dev                   # http://localhost:3000
```

### Demo-accounts (uit de seed, wachtwoord voor iedereen: zie hieronder)

| Rol | E-mail | Wachtwoord | Notitie |
|---|---|---|---|
| Rijschoolhouder | `instructeur@rijschooldeboer.nl` | `demo1234` | Rijschool "De Boer", code `DB4K7P` |
| Leerling (gekoppeld) | `lucas@example.com` | `demo1234` | Gekoppeld aan Rijschool De Boer |
| Leerling (gekoppeld) | `fenna@example.com` | `demo1234` | Gekoppeld aan Rijschool De Boer |
| Leerling (zelfstandig) | `noah@example.com` | `demo1234` | Geen rijschool |

Nieuwe leerlingen kunnen zich ook gewoon registreren via `/registreren` en daarbij de code
`DB4K7P` invullen om zich aan de demo-rijschool te koppelen.

## Android-app (Capacitor)

Rijklaar is een server-rendered Next.js-app (server components, sessie-cookies, een database),
geen statische SPA — dus Capacitor bundelt de app niet als bestanden in de APK. In plaats
daarvan opent het een WebView die naar de live URL van de app wijst (`server.url` in
`capacitor.config.ts`), net als een browser maar dan als installeerbare app-schil.

**Vereist dus eerst een live deployment** (bijv. Vercel) met een echte Postgres-achtige
database — SQLite werkt niet op de meeste serverless hosts. Zodra dat adres bekend is:

```bash
# capacitor.config.ts: vervang server.url door het echte productie-adres
npx cap sync android
```

Daarna open je de `android/`-map in Android Studio (File → Open) om te bouwen/draaien:

- **Testen op emulator/telefoon**: gewoon op Run drukken in Android Studio (telefoon via
  USB met ontwikkelaarsopties/USB-debugging aan, of een emulator).
- **Installeerbare APK/AAB maken**: Build → Generate Signed App Bundle / APK — hiervoor moet
  je eenmalig een keystore aanmaken (Android Studio begeleidt dit); bewaar 'm goed, want
  dezelfde keystore heb je nodig voor elke toekomstige update van de app.

De `android/`-map wordt gewoon meegecommit (standaard bij Capacitor) — alleen build-output,
`local.properties` (machine-specifiek SDK-pad) en keystores staan in `android/.gitignore`.

## Techstack — en waarom

- **Next.js 16 (App Router) + TypeScript** — één codebase voor de leerling-app, het
  rijschooldashboard én de API, met React Server Components voor snelle, SEO-vrije
  server-rendered data-fetching en Route Handlers voor de interactieve delen.
- **Prisma + Postgres** — hetzelfde schema lokaal en in productie (Vercel), zonder
  SQLite-specifieke aannames; migraties draaien automatisch mee in de build
  (`prisma migrate deploy`, zie `package.json`).
- **NextAuth (Auth.js) v5** — credentials-provider (e-mail/wachtwoord) werkt volledig;
  Google- en Apple-providers zijn bedraad maar staan uit totdat er echte OAuth-credentials
  in `.env` staan (zie §"Wat is bewust niet afgemaakt").
- **Tailwind CSS v4** — eigen designtokens (kleuren, radius, schaduwen) in
  `src/app/globals.css`, geen kant-en-klare component-library. Bewust een levendig,
  hoog-contrast palet met "3D-pressed" knoppen (duolingo-achtige gamification-stijl),
  met een eigen kleur per onderwerp (`src/components/topics/TopicIcon.tsx`).
- **Framer Motion** — subtiele micro-animaties (level-up confetti, pop-ins).
- **Sentry + PostHog (optioneel)** — error-tracking en product-analytics, allebei uit tenzij
  `NEXT_PUBLIC_SENTRY_DSN`/`NEXT_PUBLIC_POSTHOG_KEY` in `.env` staan (zelfde
  aan/uit-conventie als de OAuth-providers hierboven). PostHog krijgt custom events op
  vraag-beantwoorden, sessie/examen-afronding en registratie (`src/lib/analytics.ts`).
- **Eigen SVG-scenes** (`src/components/scenes`) in plaats van stockfoto's of een externe
  asset-pipeline: een herbruikbare kruispunt-scene (auto's/fietsers/voetgangers op vaste
  "sloten") en een handgetekende verkeersbordenset. Consistente stijl, geen losse
  illustraties nodig, en makkelijk uit te breiden met nieuwe scenario's.

## Wat is er gebouwd (MVP-kern uit §47 van het brief)

- Leerling-accounts (e-mail/wachtwoord; Google/Apple UI-klaar, zie hieronder)
- Rijschool-accounts met unieke rijschoolcode, seat-based licentie (`License.seats`)
- Leerlingen koppelen/loskoppelen via code, nooit aan 2 scholen tegelijk (schema-constraint)
- Contentmodel: Categorie (rijbewijs B, uitbreidbaar naar A/AM/C/D/E) → Onderwerp →
  Subonderwerp → Vraag, volledig los van de app-code (zie `prisma/seed.ts`)
- Korte oefensessies (8 vragen), snel/onderwerp/combinatie/fouten/zwakke-punten-modi
- 3 interactieve vraagtypes: **single choice**, **multiple choice**, **hotspot**
  (kruispunt-scene en bordenrij) — zie `src/lib/questions/types.ts`
- Foutenregistratie ("Mijn fouten") + "bewaar voor later" bookmarks
- Een lichtgewicht spaced-repetition-achtige selectie (nooit/lang-niet-geziene vragen
  krijgen voorrang) — zie `src/lib/practice.ts`
- Mastery-algoritme per onderwerp (0-5), bewust conservatief — zie §"Mastery-algoritme"
- XP, account-levels, dagelijkse streak (géén levens/harten, nooit bestraffend)
- Dagelijkse doelen, badges, vieringsanimatie (confetti) bij mijlpalen
- Profiel met granulaire privacy-instellingen (los in te stellen: leaderboard, XP, streak,
  badges, mastery zichtbaar voor vrienden)
- Vrienden via vriendschapscode, verzoeken accepteren/weigeren
- Landelijk dagelijks scoreboard (reset vanzelf — het is gewoon "XP sinds middernacht",
  geen aparte reset-job nodig)
- Examenmodus: apart, rustiger UI, geen tussentijdse feedback, pas-percentage o.b.v.
  CBR-achtige 88%-drempel, en een **expliciet onderscheid** tussen "dit examen gehaald"
  en "klaar voor het echte examen" (zie `src/lib/readiness.ts`)
- Rijschooldashboard: leerlingoverzicht (activiteit, sterk/zwak onderwerp, examens) +
  leerlingdetail (mastery per onderwerp, examenhistorie, recente sessies)

## Mastery-algoritme (bewust simpel, zie brief §16/§37)

`src/lib/mastery.ts` berekent per (leerling, onderwerp) een confidence-score uit drie
signalen — **volume** (hoeveel vragen al beantwoord), **moeilijkheidsgewogen accuracy**, en
**recente prestaties** (laatste 12 antwoorden wegen zwaarder) — en leidt daar een level
(0-5) uit af. Onder de 5 beantwoorde vragen toont de UI altijd expliciet **"Nog onvoldoende
gegevens"** in plaats van een geraden niveau (zie het rijschooldashboard-screenshot-gedrag:
een leerling zonder activiteit toont dit voor élk onderwerp, nooit een verzonnen getal).

Het level wordt bij elk antwoord **opnieuw berekend** uit de volledige recente historie —
niet met losse ophoog/verlaag-regels — dus een leerling die na een sterke periode weer
structureel fouten maakt, zakt vanzelf terug. Dit is nadrukkelijk een verklaarbare
heuristiek, geen gekalibreerd psychometrisch model — precies zoals het brief vraagt
("mag niet doen alsof het intelligent is als het dat niet is").

## Verkeersbordencatalogus

`src/lib/questions/signCatalogue.ts` bevat 136 officiële RVV 1990-borden (categorieën
A/B/C/D/E/F/G/H/J/L). De **codes en namen zijn gecontroleerd** tegen de OpenStreetMap
NL-bordenreferentie (die kaart-tagging voedt en dus overeen moet komen met de wettelijke
bijlage, aangevuld met itheorie.nl en een gerichte websearch voor een paar L-codes die
daar ontbraken), niet uit het geheugen gegokt.

Voor de **tekeningen** geldt: 133 van de 136 borden renderen nu echte, door de gebruiker
aangeleverde artwork (`public/signs/*.svg`/`.png`/`.webp`) in plaats van een eigen
benadering — een eerdere poging om die vanaf Wikimedia Commons te scrapen liep tegen een
rate-limit op de gedeelde dev-proxy aan, dus zijn ze via Google Drive en twee directe
uploads aangeleverd (eerst 110 vector-SVG's, later 32 raster-WEBP's voor de codes die nog
ontbraken — vooral de hele D-categorie en de "begin"-varianten van G). Waar beide
leveringen dezelfde code bevatten is steeds de vector-SVG gehouden, ook als de WEBP in
pixels groter was: vector schaalt scherp op elk formaat, dus dat is voor een icoon altijd
de betere "resolutie". `SignIcon.tsx` rendert automatisch de echte artwork zodra die
bestaat (zie `realSigns.generated.ts`, gegenereerd met `npm run signs:manifest` — opnieuw
draaien na het toevoegen van bestanden aan `public/signs/`) en valt voor de resterende
3 borden (E8c, L2, C7a) terug op een zelfgetekende, illustratieve versie die nog een
instructeur-controle nodig heeft (C7a's tekening is wel nagetekend van een foto van het
echte bord die de gebruiker deelde). Op `/app/borden` (link onderaan het profielscherm)
is dit meteen zichtbaar: borden met een blauw randje hebben echte artwork, de rest is de
tijdelijke tekening.

Nummerborden (snelheid) zijn geparametriseerd, bv. `"A1-50"` voor een 50 km/h-bord — zie
`baseCodeOf`/`numberOf` in `signCatalogue.ts`. Categorie K (milieuzones) en de J-codes
J12/J13 zijn nog niet toegevoegd (geen betrouwbare bron/artwork gevonden).

Elke entry heeft ook een `definition`: een kort, praktisch zinnetje ("wat betekent dit
voor mij als bestuurder") dat losstaat van de officiële korte `name` — zelf geschreven op
basis van de al geverifieerde namen/categorieën, niet uit een externe bron gescraped.

### Bordherkenning-oefenmodi

Op basis van die catalogus + definities genereert `src/lib/questions/generateSignQuestions.ts`
automatisch twee vragen per bord (272 in totaal, zie ook `prisma/seed.ts`): "welk van deze
vier betekenissen hoort bij dit bord" (`promptSignId` op een `SINGLE_CHOICE`-scene, zie
`types.ts`/`QuestionCard.tsx`) en het omgekeerde, "welk van deze vier borden hoort bij deze
betekenis" (dezelfde scene, maar dan met `signId` per keuze-optie i.p.v. een `promptSignId`).
Distractors zijn drie willekeurige andere catalogus-entries (seeded per bordcode, dus
stabiel tussen reseeds). Beide vormen krijgen een eigen topic (`bord-naar-betekenis` /
`betekenis-naar-bord`) met een eigen knop op de Oefenen-pagina, en zijn bewust uitgesloten
van "Snel oefenen"/"Oefenexamen"/"Zwakke punten" (zie `RECOGNITION_TOPIC_SLUGS` in
`practice.ts`) — anders zouden 272 gegenereerde herkenningsvragen die modi domineren
tegenover de ~28 handgeschreven scenariovragen. Wel expliciet kiesbaar via de twee
dedicated knoppen, en ze tellen gewoon mee voor "Mijn fouten" als je ze fout beantwoordt.

## Wat is bewust niet afgemaakt (zie brief §47 "daarna uitbreiden")

Deze dingen zijn *ontworpen om niet in de weg te zitten* bij latere uitbreiding, maar zijn
nu niet gebouwd:

- **Google/Apple-login**: providers staan al in `src/lib/auth.ts`, maar zonder
  `AUTH_GOOGLE_ID`/`AUTH_APPLE_ID` in `.env` blijven de knoppen bewust uitgeschakeld i.p.v.
  een nep-flow te tonen.
- **Contentbeheer-UI**: vragen/lessen zitten in een los, uitbreidbaar schema (zie §40 van
  het brief), maar er is geen CMS-scherm — content wordt nu via `prisma/seed.ts` beheerd.
  De 26 seed-vragen zijn geschreven om de app te demonstreren, **niet geverifieerd door
  een CBR-gecertificeerde content-editor** — dat is een randvoorwaarde voor een echte
  lancering (brief §42).
- **Extra vraagtypes** (volgorde bepalen, sleepvragen, afstand beoordelen): het schema
  (`QuestionType`) is uitbreidbaar, maar alleen single/multiple/hotspot zijn gebouwd.
  Genoeg om eentonigheid te voorkomen (brief §19), niet de volledige lijst.
  Theorie-lessen (`TheoryLesson`) zitten in het schema en de seed (2 voorbeelden), maar
  hebben nog geen eigen leesscherm — alleen de bijbehorende oefensessie (`mode: LESSON`
  in `src/lib/practice.ts`) is bedraad.
- **Pushmeldingen**: functioneel niet gebouwd (vereist een mobiele shell/service worker +
  een notificatie-provider); het datamodel houdt al bij wat je zou willen weten
  (streak, laatste activiteit, XP-verschil) om zulke meldingen later te voeden.
- **Cosmetische beloningen / titels**: `StudentProfile.activeTitle` bestaat en wordt getoond
  op het profiel, maar er is geen "unlock"-systeem gebouwd.
- **Challenges tussen vrienden** (brief §5): het datamodel (`Challenge`,
  `ChallengeParticipant`) staat al klaar, maar er is geen UI voor.
- **Licentie-/betaalflow**: `License` heeft een `plan`/`status`/`seats`, seat-limiet wordt
  al gehandhaafd bij het koppelen van een leerling — maar er zit geen betaalprovider achter.
- **Categorie K (milieuzones)** en een handvol zeldzame J/L-varianten zitten nog niet in de
  bordencatalogus (zie hierboven) — de rest van J/L/F/H is inmiddels wel toegevoegd, met
  echte artwork voor het merendeel.

## Bekende beperkingen

- **Sessietoestand leeft client-side**: als je een oefensessie ververst (F5) halverwege,
  gaat de voortgang van die sessie verloren (de server heeft de losse antwoorden al wel
  opgeslagen). Nieuwe sessie starten lost dit meteen op.
- **Dag-grenzen gebruiken de serverklok (UTC)**, niet de tijdzone van de leerling — voor
  de streak en het dagelijkse scoreboard. `StudentProfile.timezone` staat al in het schema
  om dit later per leerling correct te maken.
- **Vragenbank is klein** (26 vragen, bewust illustratief) — genoeg om elke flow te testen,
  te weinig om herhaling te voorkomen bij langdurig gebruik. Contentuitbreiding raakt geen
  enkele code, alleen `prisma/seed.ts` (of een toekomstige CMS).

## Projectstructuur

```
prisma/schema.prisma       Volledig datamodel (zie inline comments per model)
prisma/seed.ts             Onderwerpen, vragen, badges, demo-accounts
src/lib/                   Server-side logica: auth, mastery, gamification, practice-selectie,
                            leaderboard, exam-readiness — bewust gescheiden van de UI
src/app/api/                Route handlers (sessies starten/beantwoorden/afronden, vrienden,
                            profiel, registratie)
src/app/app/                Leerling-app (bottom-nav shell, guard via requireStudent())
src/app/school/              Rijschooldashboard (guard via requireInstructor())
src/components/scenes/      Herbruikbare SVG-illustraties (kruispunt, verkeersborden)
src/components/practice/    De kern-leerloop: vraagkaart, sessie-runner, resultatenscherm
```
