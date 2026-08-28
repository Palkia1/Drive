import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({ questionId: z.string() });

// Toggles a "SAVED" bookmark on a question (brief §14 — "Moeilijk / bewaren").
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  const { questionId } = parsed.data;

  const key = { studentId_questionId_reason: { studentId: student.id, questionId, reason: "SAVED" as const } };
  const existing = await prisma.questionMark.findUnique({ where: key });

  if (existing) {
    await prisma.questionMark.delete({ where: key });
    return NextResponse.json({ saved: false });
  }
  await prisma.questionMark.create({ data: { studentId: student.id, questionId, reason: "SAVED" } });
  return NextResponse.json({ saved: true });
}
