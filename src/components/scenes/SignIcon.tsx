import type { SignId } from "@/lib/questions/types";

/**
 * A small, consistent vector sign set. These are stylized approximations of
 * Dutch RVV road signs — enough to teach shape/color recognition — not
 * pixel-accurate reproductions. Every question that shows a sign renders it
 * through this one component, so the visual language stays identical across
 * the whole app (see product brief §20).
 */
export function SignIcon({ id, size = 56 }: { id: SignId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={id}>
      {render(id)}
    </svg>
  );
}

const blue = "var(--sign-blue)";
const red = "var(--sign-red)";
const yellow = "var(--sign-yellow)";
const white = "var(--sign-white)";
const black = "var(--sign-black)";

function render(id: SignId) {
  switch (id) {
    case "priorityRoad":
      return (
        <g>
          <rect x="10" y="10" width="44" height="44" rx="6" fill={yellow} stroke={white} strokeWidth="5" transform="rotate(45 32 32)" />
          <rect x="19" y="19" width="26" height="26" rx="3" fill="none" stroke={white} strokeWidth="3" transform="rotate(45 32 32)" />
        </g>
      );
    case "endPriorityRoad":
      return (
        <g>
          <rect x="10" y="10" width="44" height="44" rx="6" fill={yellow} stroke={white} strokeWidth="5" transform="rotate(45 32 32)" />
          <rect x="19" y="19" width="26" height="26" rx="3" fill="none" stroke={white} strokeWidth="3" transform="rotate(45 32 32)" />
          <line x1="12" y1="52" x2="52" y2="12" stroke={black} strokeWidth="4" />
        </g>
      );
    case "giveWay":
      return (
        <g>
          <polygon points="32,8 58,54 6,54" fill={white} stroke={red} strokeWidth="6" strokeLinejoin="round" />
          <polygon points="32,22 46,46 18,46" fill={white} />
        </g>
      );
    case "stop":
      return (
        <g>
          <polygon
            points="22,6 42,6 58,22 58,42 42,58 22,58 6,42 6,22"
            fill={red}
          />
          <text x="32" y="39" textAnchor="middle" fontSize="15" fontWeight="700" fill={white} fontFamily="sans-serif">
            STOP
          </text>
        </g>
      );
    case "roundabout":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={blue} />
          <path d="M20 32a12 12 0 1 1 6 10.4" fill="none" stroke={white} strokeWidth="4" strokeLinecap="round" />
          <polygon points="24,44 26,34 34,40" fill={white} />
        </g>
      );
    case "noEntry":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={red} />
          <rect x="12" y="27" width="40" height="10" rx="2" fill={white} />
        </g>
      );
    case "noOvertakingCars":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={white} stroke={red} strokeWidth="6" />
          <rect x="10" y="30" width="20" height="10" rx="2" fill={black} />
          <rect x="30" y="24" width="22" height="10" rx="2" fill={red} />
          <line x1="10" y1="50" x2="54" y2="14" stroke={red} strokeWidth="4" />
        </g>
      );
    case "maxSpeed30":
    case "maxSpeed50":
    case "maxSpeed80": {
      const n = id === "maxSpeed30" ? "30" : id === "maxSpeed50" ? "50" : "80";
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={white} stroke={red} strokeWidth="6" />
          <text x="32" y="40" textAnchor="middle" fontSize="20" fontWeight="700" fill={black} fontFamily="sans-serif">
            {n}
          </text>
        </g>
      );
    }
    case "endMaxSpeed":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={white} stroke="#8b8f9c" strokeWidth="5" />
          <text x="32" y="40" textAnchor="middle" fontSize="18" fontWeight="700" fill={black} fontFamily="sans-serif">
            80
          </text>
          <line x1="10" y1="50" x2="54" y2="14" stroke="#8b8f9c" strokeWidth="3" />
        </g>
      );
    case "compulsoryAheadOnly":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={blue} />
          <polygon points="32,14 44,32 35,32 35,50 29,50 29,32 20,32" fill={white} />
        </g>
      );
    case "compulsoryCycleTrack":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={blue} />
          <circle cx="22" cy="42" r="6" fill="none" stroke={white} strokeWidth="3" />
          <circle cx="42" cy="42" r="6" fill="none" stroke={white} strokeWidth="3" />
          <path d="M22 42 L30 24 L38 24 M30 24 L42 42 M26 32 H36" stroke={white} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "pedestrianCrossing":
      return (
        <g>
          <rect x="6" y="6" width="52" height="52" rx="6" fill={blue} />
          <polygon points="32,14 50,44 14,44" fill={white} />
          <circle cx="32" cy="28" r="3.5" fill={black} />
          <path d="M32 32 v8 M32 34 l-5 8 M32 34 l5 8 M28 36 h8" stroke={black} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "noParking":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={blue} />
          <circle cx="32" cy="32" r="20" fill="none" stroke={red} strokeWidth="6" />
          <line x1="18" y1="46" x2="46" y2="18" stroke={red} strokeWidth="6" />
          <text x="32" y="39" textAnchor="middle" fontSize="20" fontWeight="700" fill={white} fontFamily="sans-serif">
            P
          </text>
        </g>
      );
    case "noStoppingOrParking":
      return (
        <g>
          <circle cx="32" cy="32" r="28" fill={blue} />
          <line x1="16" y1="16" x2="48" y2="48" stroke={red} strokeWidth="6" />
          <line x1="48" y1="16" x2="16" y2="48" stroke={red} strokeWidth="6" />
        </g>
      );
    case "oneWay":
      return (
        <g>
          <rect x="6" y="18" width="52" height="28" rx="3" fill={blue} />
          <polygon points="46,32 30,22 30,42" fill={white} />
          <rect x="16" y="28" width="16" height="8" fill={white} />
        </g>
      );
    case "warningChildren":
      return (
        <g>
          <polygon points="32,6 60,56 4,56" fill={yellow} stroke={red} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="24" cy="34" r="4.5" fill={black} />
          <circle cx="38" cy="30" r="5.5" fill={black} />
          <path d="M18 48 q6 -12 12 -2 M30 48 q8 -16 16 -4" stroke={black} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "warningSlipperyRoad":
      return (
        <g>
          <polygon points="32,6 60,56 4,56" fill={yellow} stroke={red} strokeWidth="5" strokeLinejoin="round" />
          <path d="M14 44 q9 -18 18 0 q9 -18 18 0" stroke={black} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "warningRoadNarrows":
      return (
        <g>
          <polygon points="32,6 60,56 4,56" fill={yellow} stroke={red} strokeWidth="5" strokeLinejoin="round" />
          <path d="M12 46 L26 30 L38 30 L52 46 M26 30 L32 40 L38 30" stroke={black} strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      );
    default:
      return <circle cx="32" cy="32" r="28" fill="#ccc" />;
  }
}
