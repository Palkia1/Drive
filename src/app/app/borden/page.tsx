import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStudent } from "@/lib/session";
import { SIGN_CATALOGUE, type SignCategory } from "@/lib/questions/signCatalogue";
import { REAL_SIGN_FILES } from "@/lib/questions/realSigns.generated";
import { SignIcon } from "@/components/scenes/SignIcon";

const CATEGORY_LABEL: Record<SignCategory, string> = {
  A: "A — Snelheid",
  B: "B — Voorrang",
  C: "C — Geslotenverklaring (verbod)",
  D: "D — Rijrichting (gebod)",
  E: "E — Parkeren en stilstaan",
  F: "F — Overige geboden en verboden",
  G: "G — Wegtype / weggebruiker",
  H: "H — Bebouwde kom",
  J: "J — Waarschuwing",
  L: "L — Informatie",
};

// A representative number for the few remaining signs that still take one
// (only A1 has multiple real speed-value files; A2/A5 have exactly one).
const SAMPLE_NUMBER: Record<string, number> = {
  A1: 50,
  A2: 50,
  A5: 50,
};

export default async function BordenOverzichtPage() {
  await requireStudent();
  const categories: SignCategory[] = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "L"];
  const realCount = Object.keys(REAL_SIGN_FILES).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/profiel" className="text-sm inline-flex items-center gap-1.5 mb-3" style={{ color: "var(--foreground-muted)" }}>
          <ArrowLeft size={14} /> Terug
        </Link>
        <h1 className="text-2xl font-extrabold">Bordenoverzicht</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Interne referentie — {SIGN_CATALOGUE.length} borden in de catalogus, {realCount} daarvan met echte
          aangeleverde artwork (blauw randje); de rest is een zelfgemaakte tijdelijke tekening. Codes en namen
          zijn geverifieerd; zie de README voor de bronnen.
        </p>
      </div>

      {categories.map((cat) => {
        const inCat = SIGN_CATALOGUE.filter((s) => s.category === cat);
        if (inCat.length === 0) return null;
        return (
          <div key={cat}>
            <h2 className="font-bold text-sm mb-3" style={{ color: "var(--foreground-muted)" }}>
              {CATEGORY_LABEL[cat]}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {inCat.map((s) => {
                const id = s.numeric && SAMPLE_NUMBER[s.code] ? `${s.code}-${SAMPLE_NUMBER[s.code]}` : s.code;
                const isReal = Boolean(REAL_SIGN_FILES[id]);
                return (
                  <div
                    key={s.code}
                    className="card p-3 flex flex-col items-center text-center gap-1.5"
                    style={isReal ? { boxShadow: "inset 0 0 0 2px var(--brand-400)" } : undefined}
                  >
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
        );
      })}
    </div>
  );
}
