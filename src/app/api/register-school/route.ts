import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchoolSchema } from "@/lib/validation";
import { generateSchoolCode } from "@/lib/codes";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }
  const { schoolName, ownerName, email, password, seats } = parsed.data;

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
          license: { create: { seats, plan: "standard", status: "trial" } },
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, userId: user.id, schoolCode: code });
}
