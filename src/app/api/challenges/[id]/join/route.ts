import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { joinChallenge } from "@/lib/challenges";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const me = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const { id } = await params;
  const result = await joinChallenge(me.id, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
