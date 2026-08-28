import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({ accept: z.boolean() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const me = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });

  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.addresseeId !== me.id || friendship.status !== "PENDING") {
    return NextResponse.json({ error: "Verzoek niet gevonden" }, { status: 404 });
  }

  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: parsed.data.accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
