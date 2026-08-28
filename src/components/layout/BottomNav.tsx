"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, RotateCcw, Users, CircleUser } from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/oefenen", label: "Oefenen", icon: Dumbbell },
  { href: "/app/fouten", label: "Fouten", icon: RotateCcw },
  { href: "/app/sociaal", label: "Sociaal", icon: Users },
  { href: "/app/profiel", label: "Profiel", icon: CircleUser },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 border-t"
      style={{ background: "color-mix(in srgb, var(--background) 92%, transparent)", borderColor: "var(--border)", backdropFilter: "blur(10px)" }}
    >
      <div className="mx-auto max-w-lg px-2 py-1.5 flex items-center justify-between">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition"
              style={{ color: active ? "var(--brand-600)" : "var(--foreground-muted)" }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
