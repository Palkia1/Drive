# Verkeersbord-bestanden

133 van de 135 borden uit `signCatalogue.ts` hebben hier echte artwork (aangeleverd door
de gebruiker: eerst 110 vector-SVG's uit een Google Drive-map "Verkeersborden", later
aangevuld met 32 raster-WEBP's — Wikimedia Commons-thumbnails — uit een tweede upload
voor codes die in de eerste levering ontbraken, met name de hele D-categorie, de
"begin"-varianten van G, en een deel van E/F/H/L). Bestandsnaam = exact de officiële
RVV-code, bv. `A1-50.svg`, `B6.svg`, `D4.webp`, `J21.svg`.

Waar een code in beide leveringen zat, is steeds de vector-SVG gehouden (schaalt
scherp op elk formaat) in plaats van de raster-WEBP, ook als de WEBP in pixels groter
was — voor een icoon dat op elk formaat gerenderd wordt is vector altijd de betere
"resolutie".

`SignIcon.tsx` gebruikt automatisch een bestand hier zodra het bestaat (zie
`src/lib/questions/realSigns.generated.ts`), en valt anders terug op een zelfgetekende
versie. Na het toevoegen/verwijderen van bestanden:

```bash
npm run signs:manifest
```

**Nog ontbrekend** (zie `verkeersborden-index.md` voor de oorspronkelijke volledige lijst,
en `signCatalogue.ts` voor de actuele):
- **E8c** (parkeergelegenheid elektrische voertuigen) en **L2** (voetgangersoversteekplaats)
  — de enige twee catalogus-codes zonder echte artwork; beide vallen terug op een
  zelfgetekende versie.
- **Categorie K** (milieuzones) — zit nog niet in de catalogus, geen bestanden aangeleverd.
- Losse J-codes **J12/J13** — niet in de catalogus (geen betrouwbare naam/bron gevonden).
- **C7a** — heeft wel een hand-getekende fallback in `SignIcon.tsx`, maar staat niet als
  catalogus-entry (geen bevestigde naam).
