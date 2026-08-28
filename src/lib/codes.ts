import { prisma } from "@/lib/db";

// Excludes ambiguous characters (0/O, 1/I/L) so codes are easy to read aloud
// and type in — school codes and friend codes are both meant to be shared
// verbally or over a whiteboard.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function generateSchoolCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode(6);
    const existing = await prisma.drivingSchool.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique school code");
}

export async function generateFriendCode(name: string): Promise<string> {
  const base = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 6) || "RIJDER";

  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${base}${suffix}`;
    const existing = await prisma.studentProfile.findUnique({ where: { friendCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique friend code");
}

export async function generateUsername(name: string): Promise<string> {
  const base =
    name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .slice(0, 16) || "rijder";

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 10000)}`;
    const existing = await prisma.studentProfile.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique username");
}
