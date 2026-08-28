import type { LucideIcon } from "lucide-react";

/** A `.input` with a leading icon — the auth screens' icon-prefixed field style. */
export function IconInput({
  icon: Icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--foreground-muted)" }} />
      <input className={`input pl-10 ${className}`} {...props} />
    </div>
  );
}
