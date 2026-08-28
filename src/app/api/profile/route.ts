import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  showOnLeaderboard: z.boolean().optional(),
  shareXpWithFriends: z.boolean().optional(),
  shareStreakWithFriends: z.boolean().optional(),
  shareBadgesWithFriends: z.boolean().optional(),
  shareMasteryWithFriends: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const me = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });

  await prisma.studentProfile.update({ where: { id: me.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
