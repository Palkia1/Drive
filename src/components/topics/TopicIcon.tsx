import {
  Signpost,
  GitFork,
  Gauge,
  MoveHorizontal,
  ArrowLeftRight,
  RefreshCw,
  Users,
  Lightbulb,
  ParkingCircle,
  Route,
  Leaf,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  sign: Signpost,
  intersection: GitFork,
  speed: Gauge,
  lane: MoveHorizontal,
  overtake: ArrowLeftRight,
  maneuver: RefreshCw,
  pedestrian: Users,
  light: Lightbulb,
  parking: ParkingCircle,
  highway: Route,
  leaf: Leaf,
  shield: ShieldCheck,
};

/** A vivid, distinct color per topic icon key — cycled so every topic in a
 * list reads as its own thing rather than a wall of same-colored rows. */
const COLORS = [
  "var(--brand-500)",
  "var(--primary-500)",
  "var(--gold-600)",
  "var(--purple-500)",
  "var(--pink-500)",
  "var(--teal-500)",
  "var(--danger-500)",
];

const ORDER = Object.keys(ICONS);

export function getTopicColor(icon: string) {
  const idx = ORDER.indexOf(icon);
  return COLORS[(idx < 0 ? 0 : idx) % COLORS.length];
}

export function TopicIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] ?? Signpost;
  return <Icon size={size} color="white" strokeWidth={2.25} />;
}
