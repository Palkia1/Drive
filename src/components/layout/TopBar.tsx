import Link from "next/link";

export function TopBar({ schoolName }: { schoolName?: string | null }) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
          Rijklaar
          {schoolName && (
            <span className="ml-2 hidden sm:inline text-xs font-medium align-middle" style={{ color: "var(--foreground-muted)" }}>
              · {schoolName}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
