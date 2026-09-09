/**
 * Rijklaar's mascot — a friendly road-sign character built from the app's
 * own visual language (thick black outline, flat sign colors — see
 * --sign-* tokens) rather than borrowed from any other brand's character.
 * Exists to carry personality and voice on key moments (greeting, session
 * results) the way a static icon or a card full of stats can't.
 */
export function Mascot({
  mood = "neutral",
  size = 72,
  className,
}: {
  mood?: "neutral" | "wave" | "cheer" | "think";
  size?: number;
  className?: string;
}) {
  const raisedArm = mood === "wave" || mood === "cheer";
  const bothArms = mood === "cheer";
  const eyesClosed = mood === "cheer";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* ground shadow */}
      <ellipse cx="50" cy="93" rx="20" ry="4" fill="var(--foreground)" opacity="0.08" />

      {/* legs */}
      <rect x="40" y="76" width="7" height="16" rx="3.5" fill="var(--sign-black)" />
      <rect x="53" y="76" width="7" height="16" rx="3.5" fill="var(--sign-black)" />

      {/* left arm */}
      <rect
        x="20"
        y="55"
        width="9"
        height="26"
        rx="4.5"
        fill="var(--primary-500)"
        stroke="var(--sign-black)"
        strokeWidth="3"
        transform={bothArms ? "rotate(-40 24 60)" : "rotate(-6 24 60)"}
      />
      {/* right arm — raises for wave/cheer */}
      <rect
        x="71"
        y="55"
        width="9"
        height="26"
        rx="4.5"
        fill="var(--primary-500)"
        stroke="var(--sign-black)"
        strokeWidth="3"
        transform={raisedArm ? "rotate(150 76 60)" : "rotate(6 76 60)"}
      />

      {/* body: a rounded warning-triangle silhouette, softened into the brand's sticker shape */}
      <path
        d="M50 8 L88 78 Q90 84 84 84 L16 84 Q10 84 12 78 Z"
        fill="var(--primary-500)"
        stroke="var(--sign-black)"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* inner white face patch */}
      <path
        d="M50 24 L74 68 Q75.5 71 72 71 L28 71 Q24.5 71 26 68 Z"
        fill="white"
      />

      {/* eyes */}
      {eyesClosed ? (
        <>
          <path d="M38 50 Q42 46 46 50" stroke="var(--sign-black)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M54 50 Q58 46 62 50" stroke="var(--sign-black)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="42" cy="50" r="4.2" fill="var(--sign-black)" />
          <circle cx="58" cy="50" r="4.2" fill="var(--sign-black)" />
          <circle cx="43.2" cy="48.5" r="1.2" fill="white" />
          <circle cx="59.2" cy="48.5" r="1.2" fill="white" />
        </>
      )}

      {/* mouth */}
      <path
        d={mood === "think" ? "M45 61 Q50 61 55 61" : "M42 59 Q50 67 58 59"}
        stroke="var(--sign-black)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* cheeks */}
      <circle cx="35" cy="58" r="3.5" fill="var(--danger-400)" opacity="0.5" />
      <circle cx="65" cy="58" r="3.5" fill="var(--danger-400)" opacity="0.5" />

      {mood === "cheer" && (
        <>
          <path d="M14 20 L17 27 L24 30 L17 33 L14 40 L11 33 L4 30 L11 27 Z" fill="var(--gold-500)" />
          <path d="M86 14 L88 19 L93 21 L88 23 L86 28 L84 23 L79 21 L84 19 Z" fill="var(--gold-500)" />
        </>
      )}
    </svg>
  );
}
