import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerStudentSchema } from "@/lib/validation";
import { generateFriendCode, generateUsername } from "@/lib/codes";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { createVerificationToken } from "@/lib/verificationTokens";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const allowed = await checkRateLimit(`register:${clientIp(req)}`, 10);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }
  const { name, email, password, schoolCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Er bestaat al een account met dit e-mailadres." }, { status: 409 });
  }

  let drivingSchoolId: string | undefined;
  if (schoolCode) {
    const school = await prisma.drivingSchool.findUnique({
      where: { code: schoolCode },
      include: { license: true, students: { select: { id: true } } },
    });
    if (!school) {
      return NextResponse.json({ error: "Onbekende rijschoolcode." }, { status: 404 });
    }
    if (school.license && school.students.length >= school.license.seats) {
      return NextResponse.json(
        { error: "Deze rijschool heeft het maximum aantal actieve leerlingen bereikt. Neem contact op met je rijschool." },
        { status: 409 }
      );
    }
    drivingSchoolId = school.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [username, friendCode] = await Promise.all([generateUsername(name), generateFriendCode(name)]);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      student: {
        create: { username, friendCode, drivingSchoolId },
      },
    },
    select: { id: true },
  });

  // Best-effort — registration succeeds either way, verification is
  // non-blocking (see EmailVerificationBanner).
  const verifyToken = await createVerificationToken("verify", email);
  const verifyUrl = `${new URL(req.url).origin}/verifieer/${verifyToken}`;
  await sendEmail(
    email,
    "Bevestig je e-mailadres — Rijklaar",
    `<p>Welkom bij Rijklaar! Bevestig je e-mailadres via de link hieronder.</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  ).catch(() => {});

  return NextResponse.json({ ok: true, userId: user.id });
}
