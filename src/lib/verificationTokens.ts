import crypto from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Reuses NextAuth's VerificationToken table (identifier/token/expires,
 * already in the schema via the Prisma adapter) for our own password-reset
 * and email-verification links, distinguished by an identifier prefix —
 * avoids a second near-identical model. */
export type TokenPurpose = "reset" | "verify";

export async function createVerificationToken(purpose: TokenPurpose, email: string) {
  const identifier = `${purpose}:${email}`;
  // A user can only have one live token per purpose — clear any previous one
  // so an old, still-valid link stops working once a new one is requested.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

/** Looks up and deletes the token in one step (single use). Returns the
 * email it was issued for, or null if missing/expired/wrong purpose. */
export async function consumeVerificationToken(purpose: TokenPurpose, token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
  if (record.expires < new Date()) return null;
  const prefix = `${purpose}:`;
  if (!record.identifier.startsWith(prefix)) return null;
  return record.identifier.slice(prefix.length);
}
