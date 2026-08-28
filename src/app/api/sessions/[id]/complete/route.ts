import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeSession } from "@/lib/completeSession";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  try {
    const result = await completeSession(student.id, sessionId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Onbekende fout" }, { status: 400 });
  }
}
