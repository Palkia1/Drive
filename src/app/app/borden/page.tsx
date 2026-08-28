import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStudent } from "@/lib/session";
import { SIGN_CATALOGUE, type SignCategory } from "@/lib/questions/signCatalogue";
import { SignIcon } from "@/components/scenes/SignIcon";

const CATEGORY_LABEL: Record<SignCategory, string> = {
  A: "A — Snelheid",
  B: "B — Voorrang",
  C: "C — Geslotenverklaring (verbod)",
  D: "D — Rijrichting (gebod)",
  E: "E — Parkeren en stilstaan",
  G: "G — Wegtype / weggebruiker",
};

// A representative number for the signs that need one, just for this preview.
const SAMPLE_NUMBER: Record<string, number> = {
  A1: 50,
  A1zone: 30,
  A2: 50,
  A2zone: 30,
  A4: 70,
  C17: 12,
  C18: 250,
  C19: 320,
  C21: 30,
};

export default async function BordenOverzichtPage() {
  await requireStudent();
  const categories: SignCategory[] = ["A", "B", "C", "D", "E", "G"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/profiel" className="text-sm inline-flex items-center gap-1.5 mb-3" style={{ color: "var(--foreground-muted)" }}>
          <ArrowLeft size={14} /> Terug
        </Link>
        <h1 className="text-2xl font-extrabold">Bordenoverzicht</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Interne referentie ({SIGN_CATALOGUE.length} borden, categorieën A/B/C/D/E/G). Codes en namen zijn
          geverifieerd; de tekeningen zijn zelfgemaakt en nog niet gecontroleerd door een instructeur — zie de
          README.
        </p>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="font-bold text-sm mb-3" style={{ color: "var(--foreground-muted)" }}>
            {CATEGORY_LABEL[cat]}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {SIGN_CATALOGUE.filter((s) => s.category === cat).map((s) => {
              const id = s.numeric && SAMPLE_NUMBER[s.code] ? `${s.code}-${SAMPLE_NUMBER[s.code]}` : s.code;
              return (
                <div key={s.code} className="card p-3 flex flex-col items-center text-center gap-1.5">
                  <SignIcon id={id} size={48} />
                  <p className="text-[11px] font-bold">{s.code}</p>
                  <p className="text-[10px] leading-tight" style={{ color: "var(--foreground-muted)" }}>
                    {s.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
