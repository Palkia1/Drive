import Link from "next/link";
import { SignOutButton } from "@/components/profile/SignOutButton";

export function SchoolTopBar({ schoolName, code, seatsUsed, seats }: { schoolName: string; code: string; seatsUsed: number; seats: number }) {
  return (
    <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/school" className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
            Rijklaar <span className="font-medium" style={{ color: "var(--foreground-muted)" }}>voor rijscholen</span>
          </Link>
          <p className="text-sm mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            {schoolName} · code <span className="font-semibold tracking-wide">{code}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <p className="font-semibold">
              {seatsUsed}/{seats} plekken
            </p>
            <p style={{ color: "var(--foreground-muted)" }}>in gebruik</p>
          </div>
          <div className="w-36">
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
