import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/verificationTokens";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const email = await consumeVerificationToken("verify", parsed.data.token);
  if (!email) {
    return NextResponse.json({ error: "Deze link is ongeldig of verlopen." }, { status: 400 });
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return NextResponse.json({ ok: true });
}
