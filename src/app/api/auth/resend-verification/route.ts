import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createVerificationToken } from "@/lib/verificationTokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const allowed = await checkRateLimit(`resend-verification:${session.user.id}`, 3);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const email = session.user.email;
  const token = await createVerificationToken("verify", email);
  const verifyUrl = `${new URL(req.url).origin}/verifieer/${token}`;
  await sendEmail(
    email,
    "Bevestig je e-mailadres — Rijklaar",
    `<p>Bevestig je e-mailadres via de link hieronder.</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  );

  return NextResponse.json({ ok: true });
}
