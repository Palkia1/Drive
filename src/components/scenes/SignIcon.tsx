import { baseCodeOf, numberOf } from "@/lib/questions/signCatalogue";
import { REAL_SIGN_FILES } from "@/lib/questions/realSigns.generated";

/**
 * Renders a Dutch traffic sign from its RVV code (see signCatalogue.ts for
 * the sourced code → name list).
 *
 * Where real artwork exists (public/signs/, tracked in realSigns.generated.ts
 * — regenerate with `npm run signs:manifest`), that's what renders: an
 * <img> straight from the static file. For the remaining codes we fall back
 * to a hand-drawn approximation below — not traced from official artwork,
 * so treat those specific shapes as illustrative pending an instructor
 * review pass, same caveat as the seed questions. Every question that shows
 * a sign renders it through this one component, so the visual language
 * (real or hand-drawn) stays consistent across the whole app.
 */
export function SignIcon({ id, size = 56 }: { id: string; size?: number }) {
  const ext = REAL_SIGN_FILES[id];
  if (ext) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fixed-size icon from a huge, sparsely-used static set; next/image's optimizer overhead isn't worth it here.
      <img src={`/signs/${id}.${ext}`} width={size} height={size} alt={id} style={{ display: "block" }} />
    );
  }
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
const grey = "#8b8f9c";

// ---------------------------------------------------------------------------
// Frame primitives — every sign below is "a frame + a pictogram"
// ---------------------------------------------------------------------------

function ProhibitionCircle({ children }: { children: React.ReactNode }) {
  return (
    <g>
      <circle cx="32" cy="32" r="28" fill={white} stroke={red} strokeWidth="6" />
      {children}
    </g>
  );
}

function MandatoryCircle({ children }: { children: React.ReactNode }) {
  return (
    <g>
      <circle cx="32" cy="32" r="28" fill={blue} />
      {children}
    </g>
  );
}

function EndStripe() {
  return <line x1="12" y1="52" x2="52" y2="12" stroke={red} strokeWidth="4" />;
}

function PriorityDiamond({ ended }: { ended?: boolean }) {
  return (
    <g>
      <rect x="10" y="10" width="44" height="44" rx="6" fill={yellow} stroke={white} strokeWidth="5" transform="rotate(45 32 32)" />
      <rect x="19" y="19" width="26" height="26" rx="3" fill="none" stroke={white} strokeWidth="3" transform="rotate(45 32 32)" />
      {ended && <line x1="12" y1="52" x2="52" y2="12" stroke={black} strokeWidth="4" />}
    </g>
  );
}

function PriorityCrossroadDiamond({ variant }: { variant: "equal" | "left" | "right" }) {
  return (
    <g>
      <rect x="9" y="9" width="46" height="46" rx="4" fill={white} stroke={black} strokeWidth="2.5" transform="rotate(45 32 32)" />
      {/* thick main road (vertical) */}
      <line x1="32" y1="10" x2="32" y2="54" stroke={black} strokeWidth="5" strokeLinecap="round" />
      {/* side road(s) — thin */}
      {variant !== "right" && <line x1="10" y1="32" x2="32" y2="32" stroke={black} strokeWidth="3" strokeLinecap="round" />}
      {variant !== "left" && <line x1="32" y1="32" x2="54" y2="32" stroke={black} strokeWidth="3" strokeLinecap="round" />}
    </g>
  );
}

function GiveWayTriangle() {
  return (
    <g>
      <polygon points="32,8 58,54 6,54" fill={white} stroke={red} strokeWidth="6" strokeLinejoin="round" />
      <polygon points="32,22 46,46 18,46" fill={white} />
    </g>
  );
}

function StopOctagon() {
  return (
    <g>
      <polygon points="22,6 42,6 58,22 58,42 42,58 22,58 6,42 6,22" fill={red} />
      <text x="32" y="39" textAnchor="middle" fontSize="15" fontWeight="700" fill={white} fontFamily="sans-serif">
        STOP
      </text>
    </g>
  );
}

/** Blue square used for G-category "wegtype" signs and informational E-signs. */
function InfoSquare({ children, ended }: { children: React.ReactNode; ended?: boolean }) {
  return (
    <g>
      <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
      {children}
      {ended && <EndStripe />}
    </g>
  );
}

function ParkingSquare({ children, prohibited }: { children?: React.ReactNode; prohibited?: boolean }) {
  return (
    <g>
      <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
      <text x="32" y="41" textAnchor="middle" fontSize="26" fontWeight="800" fill={white} fontFamily="sans-serif">
        P
      </text>
      {children}
      {prohibited && (
        <>
          <circle cx="32" cy="32" r="21" fill="none" stroke={red} strokeWidth="5.5" />
          <line x1="17" y1="47" x2="47" y2="17" stroke={red} strokeWidth="5.5" />
        </>
      )}
    </g>
  );
}

/** Speed-limit circle; takes the number to show. */
function SpeedCircle({ n, ended, zone }: { n?: number; ended?: boolean; zone?: boolean }) {
  const circle = (
    <g>
      <circle cx={zone ? 26 : 32} cy="32" r={zone ? 20 : 28} fill={white} stroke={ended ? grey : red} strokeWidth={zone ? 4.5 : 6} />
      <text x={zone ? 26 : 32} y={zone ? 40 : 41} textAnchor="middle" fontSize={zone ? 15 : 20} fontWeight="700" fill={black} fontFamily="sans-serif">
        {n ?? "--"}
      </text>
      {ended && <line x1={zone ? 12 : 12} y1={zone ? 46 : 50} x2={zone ? 40 : 52} y2={zone ? 18 : 14} stroke={grey} strokeWidth="3" />}
    </g>
  );
  if (!zone) return circle;
  return (
    <g>
      <rect x="4" y="8" width="56" height="48" rx="6" fill={white} stroke={black} strokeWidth="2" />
      {circle}
      <text x="46" y="46" textAnchor="middle" fontSize="9" fontWeight="700" fill={black} fontFamily="sans-serif" transform="rotate(90 46 46)">
        ZONE
      </text>
    </g>
  );
}

function AdvisorySpeedCircle({ n, ended }: { n?: number; ended?: boolean }) {
  return (
    <g>
      <circle cx="32" cy="32" r="28" fill={blue} />
      <text x="32" y="41" textAnchor="middle" fontSize="20" fontWeight="700" fill={white} fontFamily="sans-serif">
        {n ?? "--"}
      </text>
      {ended && <line x1="12" y1="50" x2="52" y2="14" stroke={white} strokeWidth="3" />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Small pictogram pieces, reused across many signs
// ---------------------------------------------------------------------------

function PicCar({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,33)">
      <rect x="-14" y="-6" width="28" height="14" rx="4" fill={color} />
      <rect x="-8" y="-13" width="16" height="9" rx="3" fill={color} />
      <circle cx="-8" cy="9" r="3" fill={color} />
      <circle cx="8" cy="9" r="3" fill={color} />
    </g>
  );
}

function PicTruck({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,33)">
      <rect x="-16" y="-9" width="20" height="18" rx="2" fill={color} />
      <rect x="6" y="-2" width="12" height="11" rx="2" fill={color} />
      <circle cx="-9" cy="10" r="3" fill={color} />
      <circle cx="10" cy="10" r="3" fill={color} />
    </g>
  );
}

function PicBus({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,33)">
      <polygon points="-17,3 -16,-3 -11,-9 16,-9 17,-8 17,6 -17,6" fill={color} />
      <rect x="-13" y="-6" width="4" height="5" fill={white} />
      <rect x="-7.5" y="-6" width="4" height="5" fill={white} />
      <rect x="-2" y="-6" width="4" height="5" fill={white} />
      <rect x="3.5" y="-6" width="4" height="5" fill={white} />
      <rect x="9" y="-6" width="4" height="5" fill={white} />
      <circle cx="-9" cy="7" r="3.3" fill={color} />
      <circle cx="9" cy="7" r="3.3" fill={color} />
      <circle cx="-9" cy="7" r="1.2" fill={white} />
      <circle cx="9" cy="7" r="1.2" fill={white} />
    </g>
  );
}

function PicMotorcycle({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,34)">
      <circle cx="-10" cy="6" r="6" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="10" cy="6" r="6" fill="none" stroke={color} strokeWidth="3" />
      <path d="M-10 6 L-2 -8 H8 M-2 -8 L10 6 M-6 -2 H4" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function PicMoped({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,34)">
      <circle cx="-9" cy="7" r="5.5" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="9" cy="7" r="5.5" fill="none" stroke={color} strokeWidth="3" />
      <path d="M-9 7 L-3 -6 H9 M-3 -6 L9 7" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="-3" cy="-6" r="2.5" fill={color} />
    </g>
  );
}

function PicBicycle({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,34)">
      <circle cx="-9" cy="7" r="6" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="9" cy="7" r="6" fill="none" stroke={color} strokeWidth="3" />
      <path d="M-9 7 L0 -6 H9 M0 -6 L9 7 M-9 7 H3" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0" cy="-6" r="2.3" fill={color} />
    </g>
  );
}

function PicPedestrian({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,32)">
      <circle cy="-11" r="4.5" fill={color} />
      <path d="M0 -6 v13 M0 -1 l-8 8 M0 -1 l8 8 M-6 2 h12" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
}

function PicHorseRider({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,34)">
      <circle cx="-2" cy="-10" r="3.5" fill={color} />
      <path
        d="M-2 -6 v6 M-2 0 q10 -2 12 8 M-14 10 q2 -10 12 -10 q6 0 8 6"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="-13" cy="11" r="3" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="9" cy="11" r="3" fill="none" stroke={color} strokeWidth="2.5" />
    </g>
  );
}

function PicHouse({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,33)">
      <polygon points="0,-14 16,-2 -16,-2" fill={color} />
      <rect x="-11" y="-2" width="22" height="14" fill={color} />
    </g>
  );
}

function PicArrow({ rotation = 0, color = white }: { rotation?: number; color?: string }) {
  return (
    <g transform={`translate(32,32) rotate(${rotation})`}>
      <line x1="0" y1="16" x2="0" y2="-14" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <polygon points="0,-20 -10,-4 10,-4" fill={color} />
    </g>
  );
}

function PicRoundaboutArrow({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,32)">
      <path d="M-12 0a12 12 0 1 1 6 10.4" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <polygon points="-8,12 -6,2 2,8" fill={color} />
    </g>
  );
}

function PicPlug({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,32)" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round">
      <path d="M-6 -10 v6 M6 -10 v6 M-9 -4 h18 v8 a9 9 0 0 1 -18 0 z" />
      <path d="M0 4 v8" />
    </g>
  );
}

function PicWheelchair({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,33)" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="-2" cy="-10" r="2.6" fill={color} stroke="none" />
      <path d="M-2 -6 v6 h9 M-2 -1 l-3 9 M4 4 a6 6 0 1 1 -8 -2" />
    </g>
  );
}

function PicWeight({ color = black }: { color?: string }) {
  return (
    <g transform="translate(32,33)" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round">
      <path d="M-14 -8 h28 M-10 -8 l-4 12 h8 z M10 -8 l-4 12 h8 z M0 -8 v14 h0" />
      <line x1="-14" y1="6" x2="14" y2="6" />
    </g>
  );
}

function PicMeasure({ axis = "h", color = black }: { axis?: "h" | "v"; color?: string }) {
  if (axis === "h") {
    return (
      <g transform="translate(32,33)" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round">
        <line x1="-16" y1="0" x2="16" y2="0" />
        <polyline points="-11,-5 -16,0 -11,5" />
        <polyline points="11,-5 16,0 11,5" />
      </g>
    );
  }
  return (
    <g transform="translate(32,33)" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round">
      <line x1="0" y1="-16" x2="0" y2="16" />
      <polyline points="-5,-11 0,-16 5,-11" />
      <polyline points="-5,11 0,16 5,11" />
    </g>
  );
}

function PicBox({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,33)" stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round">
      <rect x="-10" y="-8" width="20" height="16" />
      <line x1="-10" y1="0" x2="10" y2="0" />
      <line x1="0" y1="-8" x2="0" y2="0" />
    </g>
  );
}

function PicClock({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,33)" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round">
      <circle r="11" />
      <line x1="0" y1="0" x2="0" y2="-6" />
      <line x1="0" y1="0" x2="4" y2="2" />
    </g>
  );
}

function PicBusTrain({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,31)">
      <rect x="-13" y="-8" width="14" height="14" rx="2" fill="none" stroke={color} strokeWidth="2.3" />
      <path d="M2 6 h11 M2 -8 h11 v14 h-11 z" stroke={color} strokeWidth="2.3" fill="none" strokeLinejoin="round" />
    </g>
  );
}

function PicCarPool({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,34)">
      <circle cx="-6" cy="-9" r="3" fill={color} />
      <circle cx="6" cy="-9" r="3" fill={color} />
      <rect x="-15" y="-4" width="30" height="12" rx="4" fill="none" stroke={color} strokeWidth="2.3" />
      <circle cx="-8" cy="10" r="2.6" fill={color} />
      <circle cx="8" cy="10" r="2.6" fill={color} />
    </g>
  );
}

/** One striped arm of an Andreaskruis (railway-crossing marker) — red with dashed-white bands over a black outline. */
function StripedArm({ x1, y1, x2, y2, width }: { x1: number; y1: number; x2: number; y2: number; width: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={black} strokeWidth={width + 2} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={red} strokeWidth={width} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={white} strokeWidth={width - 1.5} strokeDasharray="6 6" />
    </g>
  );
}

function PicMotorway({ color = white }: { color?: string }) {
  return (
    <g transform="translate(32,33)" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M-16 12 L-4 -12 M4 -12 L16 12" />
      <line x1="-14" y1="8" x2="14" y2="8" />
      <line x1="0" y1="-12" x2="0" y2="12" strokeDasharray="4 4" />
    </g>
  );
}

// ---------------------------------------------------------------------------

function render(rawId: string) {
  const code = baseCodeOf(rawId);
  const n = numberOf(rawId);

  switch (code) {
    // A — snelheid
    case "A1":
      return <SpeedCircle n={n} />;
    case "A1zone":
      return <SpeedCircle n={n} zone />;
    case "A2":
      return <SpeedCircle n={n} ended />;
    case "A2zone":
      return <SpeedCircle n={n} zone ended />;
    case "A4":
      return <AdvisorySpeedCircle n={n} />;
    case "A5":
      return <AdvisorySpeedCircle n={n} ended />;

    // B — voorrang
    case "B1":
      return <PriorityDiamond />;
    case "B2":
      return <PriorityDiamond ended />;
    case "B3":
      return <PriorityCrossroadDiamond variant="equal" />;
    case "B4":
      return <PriorityCrossroadDiamond variant="left" />;
    case "B5":
      return <PriorityCrossroadDiamond variant="right" />;
    case "B6":
      return <GiveWayTriangle />;
    case "B7":
      return <StopOctagon />;

    // C — geslotenverklaring
    case "C1":
      return (
        <ProhibitionCircle>
          <rect x="12" y="27" width="40" height="10" rx="2" fill={black} />
        </ProhibitionCircle>
      );
    case "C2":
      return (
        <ProhibitionCircle>
          <rect x="12" y="27" width="40" height="10" rx="2" fill={black} />
          <polygon points="32,14 24,26 40,26" fill={black} />
        </ProhibitionCircle>
      );
    case "C3":
    case "C4":
      return (
        <InfoSquare>
          <PicArrow rotation={code === "C4" ? 180 : 0} />
        </InfoSquare>
      );
    case "C5":
      return (
        <InfoSquare>
          <PicArrow rotation={0} />
        </InfoSquare>
      );
    case "C6":
      return (
        <ProhibitionCircle>
          <PicCar />
        </ProhibitionCircle>
      );
    case "C7":
      return (
        <ProhibitionCircle>
          <PicTruck />
        </ProhibitionCircle>
      );
    case "C7a":
      return (
        <ProhibitionCircle>
          <PicBus />
        </ProhibitionCircle>
      );
    case "C9":
      return (
        <ProhibitionCircle>
          <PicHorseRider />
        </ProhibitionCircle>
      );
    case "C11":
      return (
        <ProhibitionCircle>
          <PicMotorcycle />
        </ProhibitionCircle>
      );
    case "C12":
      return (
        <ProhibitionCircle>
          <PicCar />
        </ProhibitionCircle>
      );
    case "C13":
      return (
        <ProhibitionCircle>
          <PicMoped />
        </ProhibitionCircle>
      );
    case "C14":
      return (
        <ProhibitionCircle>
          <PicBicycle />
        </ProhibitionCircle>
      );
    case "C15":
      return (
        <ProhibitionCircle>
          <PicBicycle />
        </ProhibitionCircle>
      );
    case "C16":
      return (
        <ProhibitionCircle>
          <PicPedestrian />
        </ProhibitionCircle>
      );
    case "C17":
      return (
        <ProhibitionCircle>
          <PicMeasure axis="h" />
        </ProhibitionCircle>
      );
    case "C18":
      return (
        <ProhibitionCircle>
          <PicMeasure axis="h" />
        </ProhibitionCircle>
      );
    case "C19":
      return (
        <ProhibitionCircle>
          <PicMeasure axis="v" />
        </ProhibitionCircle>
      );
    case "C21":
      return (
        <ProhibitionCircle>
          <PicWeight />
        </ProhibitionCircle>
      );

    // D — rijrichting (gebod)
    case "D1":
      return (
        <MandatoryCircle>
          <PicRoundaboutArrow />
        </MandatoryCircle>
      );
    case "D2":
      return (
        <MandatoryCircle>
          <PicArrow rotation={20} />
        </MandatoryCircle>
      );
    case "D3":
      return (
        <MandatoryCircle>
          <PicArrow rotation={-30} />
          <PicArrow rotation={30} />
        </MandatoryCircle>
      );
    case "D4":
      return (
        <MandatoryCircle>
          <PicArrow rotation={0} />
        </MandatoryCircle>
      );
    case "D5":
      return (
        <MandatoryCircle>
          <PicArrow rotation={45} />
        </MandatoryCircle>
      );
    case "D6":
      return (
        <MandatoryCircle>
          <PicArrow rotation={-20} />
          <PicArrow rotation={20} />
        </MandatoryCircle>
      );
    case "D7":
      return (
        <MandatoryCircle>
          <PicArrow rotation={-45} />
          <PicArrow rotation={45} />
        </MandatoryCircle>
      );

    // E — parkeren en stilstaan
    case "E1":
      return <ParkingSquare prohibited />;
    case "E2":
      return (
        <g>
          <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
          <line x1="16" y1="16" x2="48" y2="48" stroke={red} strokeWidth="6" />
          <line x1="48" y1="16" x2="16" y2="48" stroke={red} strokeWidth="6" />
        </g>
      );
    case "E3":
      return (
        <g>
          <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
          <PicBicycle color={white} />
          <circle cx="32" cy="32" r="21" fill="none" stroke={red} strokeWidth="5.5" />
          <line x1="17" y1="47" x2="47" y2="17" stroke={red} strokeWidth="5.5" />
        </g>
      );
    case "E4":
      return <ParkingSquare />;
    case "E5":
      return (
        <g>
          <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
          <text x="32" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={white} fontFamily="sans-serif">
            TAXI
          </text>
        </g>
      );
    case "E6":
      return <ParkingSquare>
          <g transform="translate(13,13) scale(0.55)"><PicWheelchair /></g>
        </ParkingSquare>;
    case "E7":
      return (
        <InfoSquare>
          <PicBox />
        </InfoSquare>
      );
    case "E8":
      return <ParkingSquare>
          <g transform="translate(11,10) scale(0.5)"><PicTruck color={white} /></g>
        </ParkingSquare>;
    case "E8c":
      return <ParkingSquare>
          <g transform="translate(13,12) scale(0.55)"><PicPlug /></g>
        </ParkingSquare>;
    case "E9":
      return (
        <g>
          <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
          <text x="32" y="36" textAnchor="middle" fontSize="20" fontWeight="800" fill={white} fontFamily="sans-serif">
            P
          </text>
          <text x="32" y="51" textAnchor="middle" fontSize="7" fontWeight="700" fill={white} fontFamily="sans-serif">
            VERGUNNING
          </text>
        </g>
      );
    case "E10":
      return <ParkingSquare>
          <g transform="translate(13,10) scale(0.5)"><PicClock /></g>
        </ParkingSquare>;
    case "E11":
      return (
        <g>
          <ParkingSquare>
          <g transform="translate(13,10) scale(0.5)"><PicClock /></g>
        </ParkingSquare>
          <EndStripe />
        </g>
      );
    case "E12":
      return <ParkingSquare>
          <g transform="translate(12,10) scale(0.5)"><PicBusTrain /></g>
        </ParkingSquare>;
    case "E13":
      return <ParkingSquare>
          <g transform="translate(11,12) scale(0.5)"><PicCarPool /></g>
        </ParkingSquare>;

    // G — wegtype / weggebruiker
    case "G1":
      return (
        <InfoSquare>
          <PicMotorway />
        </InfoSquare>
      );
    case "G2":
      return (
        <InfoSquare ended>
          <PicMotorway />
        </InfoSquare>
      );
    case "G3":
      return (
        <InfoSquare>
          <g transform="translate(32,33)" stroke={white} strokeWidth="3" fill="none" strokeLinecap="round">
            <line x1="0" y1="-14" x2="0" y2="14" />
          </g>
        </InfoSquare>
      );
    case "G4":
      return (
        <InfoSquare ended>
          <g transform="translate(32,33)" stroke={white} strokeWidth="3" fill="none" strokeLinecap="round">
            <line x1="0" y1="-14" x2="0" y2="14" />
          </g>
        </InfoSquare>
      );
    case "G5":
      return (
        <InfoSquare>
          <PicHouse />
        </InfoSquare>
      );
    case "G6":
      return (
        <InfoSquare ended>
          <PicHouse />
        </InfoSquare>
      );
    case "G7":
      return (
        <InfoSquare>
          <PicPedestrian color={white} />
        </InfoSquare>
      );
    case "G8":
      return (
        <InfoSquare ended>
          <PicPedestrian color={white} />
        </InfoSquare>
      );
    case "G9":
      return (
        <InfoSquare>
          <PicHorseRider color={white} />
        </InfoSquare>
      );
    case "G10":
      return (
        <InfoSquare ended>
          <PicHorseRider color={white} />
        </InfoSquare>
      );
    case "G11":
      return (
        <MandatoryCircle>
          <PicBicycle color={white} />
        </MandatoryCircle>
      );
    case "G12":
      return (
        <InfoSquare ended>
          <PicBicycle color={white} />
        </InfoSquare>
      );
    case "G13":
      return (
        <InfoSquare>
          <PicBicycle color={white} />
        </InfoSquare>
      );
    case "G14":
      return (
        <InfoSquare ended>
          <PicBicycle color={white} />
        </InfoSquare>
      );

    // Hand-drawn fallbacks for codes with no real art yet (or, for F1, kept
    // as a defensive fallback even though real art exists — SignIcon always
    // checks REAL_SIGN_FILES first, so this only runs if that file goes missing).
    case "F1": // Verbod motorvoertuigen in te halen
      return (
        <ProhibitionCircle>
          <g transform="translate(30,32)">
            <PicCar />
          </g>
          <g transform="translate(20,26) scale(0.8)">
            <PicCar color={red} />
          </g>
        </ProhibitionCircle>
      );
    case "andreaskruis": // Overwegmarkering — geen RVV-bord (art. 40 RVV 1990), dus geen catalogue-entry
      return (
        <g>
          <StripedArm x1={32} y1={20} x2={32} y2={60} width={6} />
          <StripedArm x1={10} y1={6} x2={54} y2={34} width={7} />
          <StripedArm x1={54} y1={6} x2={10} y2={34} width={7} />
        </g>
      );
    case "L2": // Voetgangersoversteekplaats
      return (
        <g>
          <rect x="6" y="6" width="52" height="52" rx="6" fill={blue} />
          <polygon points="32,14 50,44 14,44" fill={white} />
          <PicPedestrian />
        </g>
      );

    default:
      // A handful of catalogue codes (e.g. J12/J13) have neither real art nor
      // a hand-drawn case yet. Rather than guess a pictogram, show an honest
      // "not illustrated yet" placeholder shaped like its real category.
      if (code.startsWith("J")) {
        return (
          <g>
            <polygon points="32,8 58,54 6,54" fill={yellow} stroke={red} strokeWidth="5" strokeLinejoin="round" />
            <text x="32" y="46" textAnchor="middle" fontSize="22" fontWeight="800" fill={black} fontFamily="sans-serif">
              ?
            </text>
          </g>
        );
      }
      if (code.startsWith("L")) {
        return (
          <g>
            <rect x="6" y="6" width="52" height="52" rx="8" fill={blue} />
            <text x="32" y="42" textAnchor="middle" fontSize="24" fontWeight="800" fill={white} fontFamily="sans-serif">
              ?
            </text>
          </g>
        );
      }
      return <circle cx="32" cy="32" r="28" fill="#ccc" />;
  }
}
