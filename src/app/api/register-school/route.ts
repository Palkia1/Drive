import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchoolSchema } from "@/lib/validation";
import { generateSchoolCode } from "@/lib/codes";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

// A school's real seat allowance is an owner decision, not a self-service
// signup choice — a driving school starts on this small trial allowance and
// the platform owner raises it via PATCH /api/admin/schools/[id] (see that
// route) after actually reviewing the school. Never trust a client-supplied
// seat count here, even if one is sent.
const TRIAL_SEATS = 5;

export async function POST(req: Request) {
  const allowed = await checkRateLimit(`register-school:${clientIp(req)}`, 10);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }
  const { schoolName, ownerName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Er bestaat al een account met dit e-mailadres." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = await generateSchoolCode();

  const user = await prisma.user.create({
    data: {
      name: ownerName,
      email,
      passwordHash,
      role: "INSTRUCTOR",
      ownedSchool: {
        create: {
          name: schoolName,
          code,
          license: { create: { seats: TRIAL_SEATS, plan: "standard", status: "trial" } },
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, userId: user.id, schoolCode: code });
}
