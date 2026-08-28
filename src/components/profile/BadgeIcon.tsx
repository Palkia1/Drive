import { Flag, Flame, Target, Star, Trophy, Clipboard, Award } from "lucide-react";

const ICONS: Record<string, typeof Flag> = { flag: Flag, flame: Flame, target: Target, star: Star, trophy: Trophy, clipboard: Clipboard };

export function BadgeIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] ?? Award;
  return <Icon size={size} />;
}
