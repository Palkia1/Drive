# Verkeersbord-bestanden

110 van de 128 borden uit `signCatalogue.ts` hebben hier echte artwork (aangeleverd door
de gebruiker, oorspronkelijk verzameld in een Google Drive-map "Verkeersborden"). Bestandsnaam
= exact de officiële RVV-code, bv. `A1-50.svg`, `B6.svg`, `J21.svg`.

`SignIcon.tsx` gebruikt automatisch een bestand hier zodra het bestaat (zie
`src/lib/questions/realSigns.generated.ts`), en valt anders terug op een zelfgetekende
versie. Na het toevoegen/verwijderen van bestanden:

```bash
npm run signs:manifest
```

**Nog ontbrekend** (zie `verkeersborden-index.md` voor de oorspronkelijke volledige lijst,
en `signCatalogue.ts` voor de actuele): de D-categorie (rijrichting/gebod) volledig, de
"begin"-varianten van een deel van G (G1/G3/G5/G7/G9/G11/G13 — alleen de "einde"-varianten
zijn aangeleverd), C7a, G12a, J12/J13, en categorie K (milieuzones).
