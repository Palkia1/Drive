import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation";
import { createVerificationToken } from "@/lib/verificationTokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const allowed = await checkRateLimit(`forgot-password:${clientIp(req)}`, 5);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }
  const { email } = parsed.data;

  // Always respond ok — never reveal whether an email address has an
  // account (standard practice against account enumeration).
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    const token = await createVerificationToken("reset", email);
    const resetUrl = `${new URL(req.url).origin}/wachtwoord-resetten/${token}`;
    await sendEmail(
      email,
      "Wachtwoord resetten — Rijklaar",
      `<p>Klik op de link hieronder om een nieuw wachtwoord in te stellen. Deze link is 1 uur geldig.</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>Niet zelf aangevraagd? Dan kun je deze e-mail negeren.</p>`
    );
  }

  return NextResponse.json({ ok: true });
}
