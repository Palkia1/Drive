import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Flame, MapPinned, Trophy, Users } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "INSTRUCTOR" ? "/school" : "/app");
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 py-6 flex items-center justify-between">
        <span className="font-extrabold text-xl tracking-tight" style={{ color: "var(--brand-600)" }}>
          Rijklaar
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/registreren/rijschool" className="text-sm font-medium hidden sm:block" style={{ color: "var(--foreground-muted)" }}>
            Voor rijscholen
          </Link>
          <Link href="/inloggen" className="btn-ghost !px-4 !py-2">
            Inloggen
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pt-10 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
            Haal je theorie.
            <br />
            <span style={{ color: "var(--brand-600)" }}>Vijf minuten per keer.</span>
          </h1>
          <p className="mt-5 text-lg" style={{ color: "var(--foreground-muted)" }}>
            Korte, interactieve oefeningen met echte verkeerssituaties. Geen saaie lijst met 1.000 vragen —
            een leerroute die zich aanpast aan wat jij nog moet oefenen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/registreren" className="btn-primary">
              Gratis starten
            </Link>
            <Link href="/inloggen" className="btn-secondary">
              Ik heb al een account
            </Link>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Rijschoolcode van je instructeur? Vul &apos;m in tijdens het registreren.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FeatureCard icon={<MapPinned size={22} />} title="Realistische situaties" text="Tik het juiste antwoord aan in interactieve kruispunten." />
          <FeatureCard icon={<Flame size={22} />} title="Dagelijkse streak" text="Geen levens, geen straf — gewoon elke dag een beetje oefenen." />
          <FeatureCard icon={<Trophy size={22} />} title="Mastery per onderwerp" text="Zie precies waar je goed in bent en wat aandacht nodig heeft." />
          <FeatureCard icon={<Users size={22} />} title="Landelijk scoreboard" text="Daag vrienden uit en vergelijk je voortgang in heel Nederland." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card p-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
        {text}
      </p>
    </div>
  );
}
