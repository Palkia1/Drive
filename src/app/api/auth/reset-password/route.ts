import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation";
import { consumeVerificationToken } from "@/lib/verificationTokens";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const allowed = await checkRateLimit(`reset-password:${clientIp(req)}`, 10);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const email = await consumeVerificationToken("reset", token);
  if (!email) {
    return NextResponse.json({ error: "Deze link is ongeldig of verlopen. Vraag een nieuwe aan." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
