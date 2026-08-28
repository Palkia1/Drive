import Link from "next/link";
import { Signpost } from "lucide-react";

/** Shared shell for the auth screens (inloggen/registreren/registreren-rijschool):
 * a soft brand-tinted page background, a small mark + wordmark, and a white
 * card that holds the actual form. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div
      className="flex-1 flex items-center justify-center px-5 py-10"
      style={{ background: "color-mix(in srgb, var(--brand-500) 7%, var(--surface))" }}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="flex flex-col items-center gap-2 mb-6">
          <span className="icon-bubble" style={{ width: 52, height: 52, borderRadius: 18, background: "var(--brand-500)" }}>
            <Signpost size={26} color="white" strokeWidth={2.25} />
          </span>
          <span className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
            Rijklaar
          </span>
        </Link>

        <div className="card p-6">
          <h1 className="text-heading text-center">{title}</h1>
          <p className="text-body text-center mt-1" style={{ color: "var(--foreground-muted)" }}>
            {subtitle}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
